from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.users import User
from application.models.notification import Notification
from application.services.notificationservice import get_user_notifications,mark_notification_as_read
from application.schemas.notificationschema import NotificationResponse
from typing import List

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)


@router.get("/")
def get_notifications(request: Request, db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    user_id = get_current_user_id(request)
    offset = (page - 1) * limit

    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at
        })

    return {
        "page": page,
        "limit": limit,
        "notifications": result
    }

@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)

    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return {"message": "Notification marked as read", "notification_id": notification.id}

@router.get("/unread/count")
def unread_count(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)

    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

    return {"unread_count": count}

