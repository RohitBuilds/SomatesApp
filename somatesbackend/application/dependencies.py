from fastapi import HTTPException, Request, Depends
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.users import User


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    session_user_id = request.cookies.get("session_id")
    
    if not session_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_id = int(session_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user