from sqlalchemy.orm import Session
from application.models.userProfile import UserProfile

def get_user_by_username(db: Session, username: str):
    return db.query(UserProfile).filter(UserProfile.username == username).first()

def create_user_profile(db: Session, user: UserProfile):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_profile(db: Session, user: UserProfile):
    db.commit()
    db.refresh(user)
    return user
