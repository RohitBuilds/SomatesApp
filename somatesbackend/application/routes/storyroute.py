from fastapi import APIRouter, Request, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.story import Story
from application.models.users import User
import shutil, os
from datetime import datetime, timedelta
from application.utils.cloudnary import upload_image

router = APIRouter(prefix="/stories", tags=["Stories"])

def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)



@router.post("/create")
def create_story(
    request: Request,
    content: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)

    try:
        image_url = upload_image(file, folder="stories")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    story = Story(
        user_id=user_id,
        content=content,
        image_url=image_url,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=24) 
    )

    db.add(story)
    db.commit()
    db.refresh(story)

    return {
        "message": "Story created successfully",
        "story": {
            "id": story.id,
            "user_id": story.user_id,
            "content": story.content,
            "image_url": story.image_url,
            "created_at": story.created_at
        }
    }

@router.get("/feed")
def get_stories_feed(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    now = datetime.utcnow()

    # 1Get own stories
    
    my_stories = db.query(Story, User).join(User, Story.user_id == User.id)\
        .filter(Story.user_id == user_id)\
        .filter(Story.expires_at > now)\
        .order_by(Story.created_at.desc()).all()

    my_result = []
    for story, user in my_stories:
        my_result.append({
            "story_id": story.id,
            "content": story.content,
            "image_url": story.image_url,
            "created_at": story.created_at,
            "expires_at": story.expires_at,
            "user": {
                "id": user.id,
                "name": user.name,
                "profile_picture": getattr(user, "profile_picture", None)
            }
        })

    
    # 2Get following users' stories
    
    from application.models.follow import Follow
    following_ids = db.query(Follow.following_id)\
        .filter(Follow.follower_id == user_id).all()
    following_ids = [fid[0] for fid in following_ids]

    following_stories = db.query(Story, User).join(User, Story.user_id == User.id)\
        .filter(Story.user_id.in_(following_ids))\
        .filter(Story.expires_at > now)\
        .order_by(Story.created_at.desc()).all()

    following_result = []
    for story, user in following_stories:
        following_result.append({
            "story_id": story.id,
            "content": story.content,
            "image_url": story.image_url,
            "created_at": story.created_at,
            "expires_at": story.expires_at,
            "user": {
                "id": user.id,
                "name": user.name,
                "profile_picture": getattr(user, "profile_picture", None)
            }
        })

    return {
        "my_stories": my_result,
        "following_stories": following_result
    }


@router.delete("/{story_id}")
def delete_story(story_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)

    story = db.query(Story).filter(Story.id == story_id, Story.user_id == user_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    db.delete(story)
    db.commit()
    return {"message": "Story deleted successfully"}
