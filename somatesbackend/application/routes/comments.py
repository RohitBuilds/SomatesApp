from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from application.db import SessionLocal,get_db
from application.services.commentservices import add_comment, delete_comment
from application.models.comments import Comment
from application.models.users import User
from application.models.post import Post
from application.services.notificationservice import create_notification

router = APIRouter(prefix="/comment", tags=["Comment"])



def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)

@router.post("/{post_id}")
def create_comment(post_id: int, content: str, request: Request, db: Session = Depends(get_db)):

    user_id = get_current_user_id(request)

    # 🔥 Get current user
    current_user = db.query(User).filter(User.id == user_id).first()

    # 🔥 Get post
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # ✅ Create comment
    comment = add_comment(db, user_id, post_id, content)

    # 🔔 CREATE NOTIFICATION
    if post.user_id != user_id:  # avoid self notification
        create_notification(
            db,
            user_id=post.user_id,
            message=f"{current_user.name} commented on your post"
        )

    return {
        "id": comment.id,
        "content": comment.content,
        "post_id": comment.post_id,
        "user_id": comment.user_id,
        "created_at": comment.created_at,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "profile_picture": getattr(current_user, "profile_picture", None)
        }
    }

@router.get("/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):

    comments = db.query(Comment, User).join(
        User, Comment.user_id == User.id
    ).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.desc()).all()

    result = []

    for comment, user in comments:
        result.append({
            "comment_id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "user": {
                "id": user.id,
                "name": user.name,
                "profile_picture": getattr(user, "profile_picture", None)
            }
        })

    return result

@router.delete("/{comment_id}")
def remove_comment(comment_id: int, request: Request, db: Session = Depends(get_db)):

    user_id = get_current_user_id(request)

    result = delete_comment(db, comment_id, user_id)

    if not result:
        raise HTTPException(status_code=404, detail="Comment not found")

    return {"message": "Comment deleted"}

@router.get("/count/{post_id}")
def comment_count(post_id: int, db: Session = Depends(get_db)):

    count = db.query(Comment).filter(
        Comment.post_id == post_id
    ).count()

    return {"comments": count}
