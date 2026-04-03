"""
privacy_requests.py  –  Privacy toggle + Follow-request system

Mount this router in your main app:
    from privacy_requests import router as privacy_router
    app.include_router(privacy_router)

You also need to add  is_private = Column(Boolean, default=False)
to your User model and run a migration / alembic revision.

The FollowRequest model (follow_request.py) is already present in the project.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.users import User
from application.models.follow import Follow
from application.models.follow_request import FollowRequest

router = APIRouter(tags=["Privacy & Follow Requests"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _current_user_id(request: Request) -> int:
    sid = request.cookies.get("session_id")
    if not sid:
        raise HTTPException(status_code=401, detail="Not logged in")
    try:
        return int(sid)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid session")


def _user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Privacy ───────────────────────────────────────────────────────────────────

@router.get("/privacy")
def get_privacy(request: Request, db: Session = Depends(get_db)):
    """Return the current user's privacy setting."""
    uid = _current_user_id(request)
    user = _user_or_404(uid, db)
    return {"is_private": bool(getattr(user, "is_private", False))}


@router.put("/privacy")
def toggle_privacy(request: Request, db: Session = Depends(get_db)):
    """Toggle private / public. Returns new state."""
    uid = _current_user_id(request)
    user = _user_or_404(uid, db)

    current = bool(getattr(user, "is_private", False))
    user.is_private = not current
    db.commit()
    db.refresh(user)

    return {"is_private": bool(user.is_private)}


# ── Follow Requests ───────────────────────────────────────────────────────────

@router.post("/follow-request/{target_id}")
def send_follow_request(target_id: int, request: Request, db: Session = Depends(get_db)):
    """Send (or re-send) a follow request to a private account."""
    uid = _current_user_id(request)

    if uid == target_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # If target is public, just follow directly
    target = _user_or_404(target_id, db)
    if not getattr(target, "is_private", False):
        # Public → instant follow (idempotent)
        exists = db.query(Follow).filter(
            Follow.follower_id == uid, Follow.following_id == target_id
        ).first()
        if not exists:
            db.add(Follow(follower_id=uid, following_id=target_id))
            db.commit()
        return {"status": "following"}

    # Already following?
    already_following = db.query(Follow).filter(
        Follow.follower_id == uid, Follow.following_id == target_id
    ).first()
    if already_following:
        return {"status": "following"}

    # Existing pending request?
    existing_req = db.query(FollowRequest).filter(
        FollowRequest.requester_id == uid,
        FollowRequest.requested_id == target_id,
        FollowRequest.status == "pending"
    ).first()
    if existing_req:
        return {"status": "pending", "request_id": existing_req.id}

    # Clean up any old declined request so UniqueConstraint won't bite
    old = db.query(FollowRequest).filter(
        FollowRequest.requester_id == uid,
        FollowRequest.requested_id == target_id
    ).first()
    if old:
        db.delete(old)
        db.flush()

    new_req = FollowRequest(
        requester_id=uid,
        requested_id=target_id,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return {"status": "pending", "request_id": new_req.id}


@router.get("/follow-requests/pending")
def get_pending_requests(request: Request, db: Session = Depends(get_db)):
    """Get all pending follow requests addressed TO the current user."""
    uid = _current_user_id(request)

    rows = (
        db.query(FollowRequest, User)
        .join(User, User.id == FollowRequest.requester_id)
        .filter(
            FollowRequest.requested_id == uid,
            FollowRequest.status == "pending"
        )
        .order_by(FollowRequest.created_at.desc())
        .all()
    )

    return [
        {
            "id":          req.id,
            "requester_id": req.requester_id,
            "name":        user.name,
            "profilepic":  getattr(user, "profile_picture", None),
            "created_at":  req.created_at,
        }
        for req, user in rows
    ]


# @router.get("/follow-request/status/{target_id}")
# def check_request_status(target_id: int, request: Request, db: Session = Depends(get_db)):
#     """
#     Return current relationship status between viewer and target.
#     Possible values: "none" | "pending" | "following"
#     """
#     uid = _current_user_id(request)

#     is_following = db.query(Follow).filter(
#         Follow.follower_id == uid, Follow.following_id == target_id
#     ).first() is not None

#     if is_following:
#         return {"status": "following"}

#     pending = db.query(FollowRequest).filter(
#         FollowRequest.requester_id == uid,
#         FollowRequest.requested_id == target_id,
#         FollowRequest.status == "pending"
#     ).first()

#     if pending:
#         return {"status": "pending", "request_id": pending.id}

#     return {"status": "none"}

@router.get("/follow-request/status/{target_id}")
def check_request_status(target_id: int, request: Request, db: Session = Depends(get_db)):
    try:
        uid = _current_user_id(request)
        print("UID:", uid, "TARGET:", target_id)

        is_following = db.query(Follow).filter(
            Follow.follower_id == uid,
            Follow.following_id == target_id
        ).first()

        if is_following:
            return {"status": "following"}

        pending = db.query(FollowRequest).filter(
            FollowRequest.requester_id == uid,
            FollowRequest.requested_id == target_id,
            FollowRequest.status == "pending"
        ).first()

        if pending:
            return {"status": "pending"}

        return {"status": "none"}

    except Exception as e:
        print("🔥 ERROR:", str(e))   # 👈 IMPORTANT
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/follow-request/{request_id}/accept")
def accept_follow_request(request_id: int, request: Request, db: Session = Depends(get_db)):
    """Accept an incoming follow request → creates a Follow row."""
    uid = _current_user_id(request)

    req = db.query(FollowRequest).filter(
        FollowRequest.id == request_id,
        FollowRequest.requested_id == uid,   # only the target can accept
        FollowRequest.status == "pending"
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Follow request not found")

    # Create the actual follow
    already = db.query(Follow).filter(
        Follow.follower_id == req.requester_id,
        Follow.following_id == uid
    ).first()
    if not already:
        db.add(Follow(follower_id=req.requester_id, following_id=uid))

    req.status = "accepted"
    db.commit()
    return {"message": "Follow request accepted"}


@router.delete("/follow-request/{request_id}")
def decline_or_cancel_request(request_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Decline (by the recipient) OR cancel (by the requester).
    Both sides can delete the request.
    After decline the requester can re-send.
    """
    uid = _current_user_id(request)

    req = db.query(FollowRequest).filter(
        FollowRequest.id == request_id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Follow request not found")

    # Only the requester or the recipient may delete it
    if req.requester_id != uid and req.requested_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(req)
    db.commit()
    return {"message": "Follow request removed"}


@router.delete("/follow-request/cancel/{target_id}")
def cancel_my_request(target_id: int, request: Request, db: Session = Depends(get_db)):
    """Cancel a pending follow request that the current user sent."""
    uid = _current_user_id(request)

    req = db.query(FollowRequest).filter(
        FollowRequest.requester_id == uid,
        FollowRequest.requested_id == target_id,
        FollowRequest.status == "pending"
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="No pending request found")

    db.delete(req)
    db.commit()
    return {"message": "Request cancelled"}