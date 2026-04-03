from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.users import User
from application.models.follow import Follow
from application.models.post import Post
from sqlalchemy import or_

router = APIRouter(prefix="/search", tags=["Search"])

def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)



@router.get("/users")
def search_users(
    request: Request,
    query: str,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    offset = (page - 1) * limit

    # 🔹 Proper OR condition
    users = db.query(User).filter(
        User.id != current_user_id,
        or_(
            User.name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%")
        )
    ).offset(offset).limit(limit).all()

    result = []

    for user in users:
        # Check follow status
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user_id,
            Follow.following_id == user.id
        ).first() is not None

        result.append({
            "id": user.id,
            "name": user.name,
            "photo":user.profile_picture,
            "email": user.email,
            "is_following": is_following
        })

    return {
        "query": query,
        "page": page,
        "limit": limit,
        "users": result
    }


@router.get("/posts")
def search_posts(
    request: Request,
    query: str = Query(..., min_length=1, description="Search keyword in post content"),
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)

    offset = (page - 1) * limit

    # 🔹 Search posts by content
    posts = db.query(Post, User).join(User, Post.user_id == User.id).filter(
        Post.content.ilike(f"%{query}%")
    ).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    result = []

    for post, user in posts:
        result.append({
            "post_id": post.id,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "user": {
                "id": user.id,
                "name": user.name
            }
        })

    return {
        "query": query,
        "page": page,
        "limit": limit,
        "posts": result
    }
