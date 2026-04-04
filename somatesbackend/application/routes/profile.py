"""
profile.py  –  updated to respect is_private on the User model.

Changes vs original:
  • /userprofilebyid/{user_id}  now returns is_private + is_locked fields.
    When the target is private and the viewer is neither the owner nor a
    follower, posts are hidden and is_locked=True is returned so the
    frontend can show the Instagram-style "This account is private" wall.
  • /me  now returns is_private so the frontend can show the lock badge
    and the privacy toggle in the correct initial state.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from application.db import get_db
from application.models.users import User
from application.models.post import Post
from application.models.follow import Follow
from application.models.likes import Like
from application.models.comments import Comment
from application.utils.cloudnary import upload_image

router = APIRouter()


def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    try:
        return int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")


def get_pic(user):
    return getattr(user, "profile_picture", None) or getattr(user, "profile_pic", None)


# ── GET /me ────────────────────────────────────────────────────────────────
@router.get("/me")
def my_profile(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    followers_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()

    posts = db.query(Post).filter(Post.user_id == user_id)\
        .order_by(Post.created_at.desc()).all()

    post_ids = [p.id for p in posts]

    like_counts = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_(post_ids))
        .group_by(Like.post_id).all()
    ) if post_ids else {}

    comment_counts = dict(
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id).all()
    ) if post_ids else {}

    return {
        "id":         user.id,
        "profilepic": get_pic(user),
        "name":       user.name,
        "email":      user.email,
        "bio":        getattr(user, "bio", "") or "",
        "is_private": bool(getattr(user, "is_private", False)),   # ← NEW
        "followers":  followers_count,
        "following":  following_count,
        "posts": [
            {
                "id":         p.id,
                "content":    p.content,
                "image_url":  p.image_url,
                "created_at": p.created_at,
                "likes":      like_counts.get(p.id, 0),
                "comments":   comment_counts.get(p.id, 0),
            }
            for p in posts
        ]
    }


# ── GET /userprofilebyid/{user_id} ─────────────────────────────────────────
@router.get("/userprofilebyid/{user_id}")
def user_profile(user_id: int, request: Request, db: Session = Depends(get_db),
                 page: int = 1, limit: int = 10):
    current_user_id = get_current_user_id(request)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    followers_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == user_id
    ).first() is not None

    is_private  = bool(getattr(user, "is_private", False))
    is_owner    = current_user_id == user_id
    is_locked   = is_private and not is_following and not is_owner

    # ── Locked profile: hide posts (Instagram behaviour) ──────────────────
    if is_locked:
        return {
            "id":           user.id,
            "profilepic":   get_pic(user),
            "name":         user.name,
            "email":        user.email,
            "bio":          getattr(user, "bio", "") or "",
            "is_private":   True,
            "is_locked":    True,          # ← frontend uses this flag
            "is_following": False,
            "followers":    followers_count,
            "following":    following_count,
            "posts":        [],
        }

    # ── Normal (public or already-following) ──────────────────────────────
    offset = (page - 1) * limit
    posts = db.query(Post).filter(Post.user_id == user_id)\
        .order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    post_ids = [p.id for p in posts]
    like_counts = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_(post_ids))
        .group_by(Like.post_id).all()
    ) if post_ids else {}
    comment_counts = dict(
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id).all()
    ) if post_ids else {}

    return {
        "id":           user.id,
        "profilepic":   get_pic(user),
        "name":         user.name,
        "email":        user.email,
        "bio":          getattr(user, "bio", "") or "",
        "is_private":   is_private,
        "is_locked":    False,
        "followers":    followers_count,
        "following":    following_count,
        "is_following": is_following,
        "page":         page,
        "limit":        limit,
        "posts": [
            {
                "id":         p.id,
                "content":    p.content,
                "image_url":  p.image_url,
                "created_at": p.created_at,
                "likes":      like_counts.get(p.id, 0),
                "comments":   comment_counts.get(p.id, 0),
            }
            for p in posts
        ]
    }


# ── GET /allusersprofile ───────────────────────────────────────────────────
@router.get("/allusersprofile")
def get_all_users(request: Request, db: Session = Depends(get_db)):
    current_user_id = get_current_user_id(request)
    users = db.query(User).filter(User.id != current_user_id).all()
    result = []
    for user in users:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user_id,
            Follow.following_id == user.id
        ).first() is not None
        result.append({
            "id":           user.id,
            "name":         user.name,
            "email":        user.email,
            "is_following": is_following,
            "is_private":   bool(getattr(user, "is_private", False)),
            "photo":        user.profile_picture
        })
    return result


# ── PUT /edituser ──────────────────────────────────────────────────────────
@router.put("/edituser")
def edit_profile(
    request: Request,
    name: str = Form(...),
    bio: str = Form(""),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = name
    user.bio = bio

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id":         user.id,
            "name":       user.name,
            "bio":        user.bio,
            "profilepic": get_pic(user),
        }
    }


# ── POST /profile/upload-picture ──────────────────────────────────────────
# @router.post("/profile/upload-picture")
# def upload_profile_picture(
#     request: Request,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     user_id = get_current_user_id(request)

#     try:
#         image_url = upload_image(file, folder="profiles")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     if hasattr(user, "profile_picture"):
#         user.profile_picture = image_url
#     if hasattr(user, "profile_pic"):
#         user.profile_pic = image_url

#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return {"profilepic": get_pic(user)}

@router.post("/profile/upload-picture")
def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Step 1: Auth check
    user_id = get_current_user_id(request)

    # Step 2: Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Step 3: Upload to Cloudinary
    try:
        image_url = upload_image(file, folder="somates_profiles")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    # Step 4: Save URL to DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update whichever column exists in your User model
    if hasattr(user, "profile_pic"):
        user.profile_pic = image_url
    elif hasattr(user, "profile_picture"):
        user.profile_picture = image_url

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile picture updated successfully",
        "profilepic": get_pic(user)
    }
