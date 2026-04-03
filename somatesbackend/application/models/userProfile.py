from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from application.db import Base
from sqlalchemy.orm import relationship

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)  # link to User
    username = Column(String, unique=True, index=True)
    bio = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    followers = Column(JSON, default=[])  
    following = Column(JSON, default=[])
        
    user = relationship("User", back_populates="profile")