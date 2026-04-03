from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.users import User
import traceback
from application.models.users import User
from application.models.follow import Follow


router = APIRouter()

@router.post("/following/{user_id}")
def follow(user_id: int, request: Request, db: Session = Depends(get_db)):

    session_user = request.cookies.get("session_id")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not logged in")

    current_user_id = int(session_user)

   
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == user_id
    ).first()

    if existing:
        return {"message": "Already following"}

    follow = Follow(
        follower_id=current_user_id,
        following_id=user_id
    )

    db.add(follow)
    db.commit()

    return {"message": "Followed successfully"}

@router.get("/followers/{user_id}")
def get_followers(user_id: int, db: Session = Depends(get_db)):

    followers = db.query(User).join(
        Follow, Follow.follower_id == User.id
    ).filter(
        Follow.following_id == user_id
    ).all()

    return followers

# @router.get("/followers/{user_id}")
# def get_user_followers(user_id: int, db: Session = Depends(get_db)):
#     """Get followers of a specific user"""
#     followers = db.query(User).join(
#         Follow, Follow.follower_id == User.id
#     ).filter(
#         Follow.following_id == user_id
#     ).all()
    
#     return followers

@router.get("/followers/{user_id}")
def get_user_followers(user_id: int, db: Session = Depends(get_db)):

    followers = db.query(User).join(
        Follow, Follow.follower_id == User.id
    ).filter(
        Follow.following_id == user_id
    ).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "profilepic": user.profile_picture
        }
        for user in followers
    ]



# @router.get("/following/{user_id}")
# def get_user_following(user_id: int, db: Session = Depends(get_db)):
#     """Get following of a specific user"""
#     following = db.query(User).join(
#         Follow, Follow.following_id == User.id
#     ).filter(
#         Follow.follower_id == user_id
#     ).all()
    
#     return following

@router.get("/following/{user_id}")
def get_user_following(user_id: int, db: Session = Depends(get_db)):

    following = db.query(User).join(
        Follow, Follow.following_id == User.id
    ).filter(
        Follow.follower_id == user_id
    ).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "profilepic": user.profile_picture
        }
        for user in following
    ]


@router.get("/followers")
def get_my_followers(request: Request, db: Session = Depends(get_db)):

    user_id = int(request.cookies.get("session_id"))

    followers = db.query(User).join(
        Follow, Follow.follower_id == User.id
    ).filter(
        Follow.following_id == user_id
    ).all()

    return followers


@router.get("/following")
def get_my_following(request: Request, db: Session = Depends(get_db)):

    user_id = int(request.cookies.get("session_id"))

    following = db.query(User).join(
        Follow, Follow.following_id == User.id
    ).filter(
        Follow.follower_id == user_id
    ).all()

    return following

@router.delete("/unfollow/{user_id}")
def unfollow(user_id: int, request: Request, db: Session = Depends(get_db)):

    session_user = request.cookies.get("session_id")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not logged in")

    current_user_id = int(session_user)

    follow = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == user_id
    ).first()

    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")

    db.delete(follow)
    db.commit()

    return {"message": "Unfollowed successfully"}

@router.delete("/followers/{user_id}")
def remove_follower(user_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Remove a follower - deletes the follow relationship where user_id follows current_user
    """
    session_user = request.cookies.get("session_id")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    current_user_id = int(session_user)
    
    
    follow = db.query(Follow).filter(
        Follow.follower_id == user_id,           
        Follow.following_id == current_user_id   
    ).first()
    
    if not follow:
        raise HTTPException(status_code=404, detail="This user is not following you")
    
    db.delete(follow)
    db.commit()
    
    return {"message": "Follower removed successfully"}

@router.get("/status/{user_id}")
def follow_status(user_id: int, request: Request, db: Session = Depends(get_db)):

    session_user = request.cookies.get("session_id")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not logged in")

    current_user_id = int(session_user)

    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.following_id == user_id
    ).first() is not None

    return {"is_following": is_following}


@router.get("/counts")
def get_counts(request: Request, db: Session = Depends(get_db)):

    user_id = int(request.cookies.get("session_id"))

    followers_count = db.query(Follow).filter(
        Follow.following_id == user_id
    ).count()

    following_count = db.query(Follow).filter(
        Follow.follower_id == user_id
    ).count()

    return {
        "followers": followers_count,
        "following": following_count
    }




