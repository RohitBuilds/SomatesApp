from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from application.db import SessionLocal,get_db
from application.services.likeservices import like_post, unlike_post
from application.models.likes import Like
from application.services.notificationservice import create_notification
from application.models.post import Post
from application.models.users import User

router = APIRouter(prefix="/like", tags=["Like"])


def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)



@router.post("/{post_id}")
def like(post_id: int, request: Request, db: Session = Depends(get_db)):

    user_id = get_current_user_id(request)

    # 🔥 Call existing like logic
    result = like_post(db, user_id, post_id)

    if result is None:
        return {"message": "Already liked"}

    # 🔥 Get current user
    current_user = db.query(User).filter(User.id == user_id).first()

    # 🔥 Get post
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # 🔔 CREATE NOTIFICATION
    if post.user_id != user_id:  # avoid self notification
        create_notification(
            db,
            user_id=post.user_id,
            message=f"{current_user.name} liked your post"
        )

    return {"message": "Post liked"}
@router.delete("/{post_id}")
def unlike(post_id: int, request: Request, db: Session = Depends(get_db)):

    user_id = get_current_user_id(request)

    result = unlike_post(db, user_id, post_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Like not found")

    return {"message": "Post unliked"}

@router.get("/count/{post_id}")
def like_count(post_id: int, db: Session = Depends(get_db)):

    count = db.query(Like).filter(
        Like.post_id == post_id
    ).count()

    return {"likes": count}

@router.post("/like/{post_id}")
def toggle_like(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = int(request.cookies.get("session_id"))

    existing = db.query(Like).filter(
        Like.user_id == user_id,
        Like.post_id == post_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Unliked"}
    else:
        like = Like(user_id=user_id, post_id=post_id)
        db.add(like)
        db.commit()
        return {"message": "Liked"}

