from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.users import User

router = APIRouter()

@router.get("/status/{user_id}")
def get_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"error": "User not found"}

    return {
        "is_online": user.is_online,
        "last_seen": user.last_seen
    }


