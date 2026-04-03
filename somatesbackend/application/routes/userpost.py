from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from application.db import SessionLocal,get_db
from sqlalchemy import func
from application.models.post import Post
from application.models.follow import Follow
from application.models.post import Post
from application.models.users import User
from application.models.follow import Follow
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from application.db import SessionLocal
from application.utils.cloudnary import upload_image
from application.models.post import Post
import shutil
import os
from fastapi import HTTPException
from application.models.comments import Comment
from application.models.likes import Like
from fastapi import HTTPException
from application.utils.cloudnary import upload_image


router = APIRouter(prefix="/posts", tags=["Posts"])


def get_current_user_id(request: Request) -> int:
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return int(session_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid session")


@router.post("/createpost")
def create_post(
    request: Request,
    content: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)

    image_url = None
    if file:
        try:
            image_url = upload_image(file, folder="posts")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    post = Post(
        user_id=user_id,
        content=content,
        image_url=image_url
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return {
        "message": "Post created successfully",
        "post": {
            "id": post.id,
            "user_id": post.user_id,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at
        }
    }


@router.get("/my-posts")
def get_my_posts(request: Request, db: Session = Depends(get_db)):

    user_id = int(request.cookies.get("session_id"))

    posts = db.query(Post).filter(
        Post.user_id == user_id
    ).order_by(Post.created_at.desc()).all()

    return posts

@router.get("/feed")
def get_feed(request: Request, db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    user_id = get_current_user_id(request)  # ✅ use helper

    # Get list of users the current user is following
    following_ids = db.query(Follow.following_id).filter(Follow.follower_id == user_id).all()
    following_ids = [fid[0] for fid in following_ids]
    following_ids.append(user_id)  # include own posts

    # Pagination
    offset = (page - 1) * limit

    # Get posts joined with user info
    posts = (
        db.query(Post, User)
        .join(User, Post.user_id == User.id)
        .filter(Post.user_id.in_(following_ids))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    post_ids = [post.id for post, _ in posts]

    # Count likes per post
    like_counts = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_(post_ids))
        .group_by(Like.post_id)
        .all()
    )

    # Count comments per post
    comment_counts = dict(
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id)
        .all()
    )

    # Posts liked by current user
    liked_posts = set(
        post_id for (post_id,) in db.query(Like.post_id).filter(
            Like.user_id == user_id,
            Like.post_id.in_(post_ids)
        ).all()
    )

    # Build response
    result = []
    for post, user in posts:
        result.append({
            "post_id": post.id,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "likes": like_counts.get(post.id, 0),
            "comments": comment_counts.get(post.id, 0),
            "is_liked": post.id in liked_posts,
            "user": {
                "id": user.id,
                "name": user.name,
                'profile_picture': getattr(user, "profile_picture", None)
            }
        })

    return {
        "page": page,
        "limit": limit,
        "posts": result
    }



@router.delete("/{post_id}")
def delete_post(post_id: int, request: Request, db: Session = Depends(get_db)):

    user_id = get_current_user_id(request)

    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    
    db.query(Like).filter(Like.post_id == post_id).delete()
    db.query(Comment).filter(Comment.post_id == post_id).delete()

    
    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}
