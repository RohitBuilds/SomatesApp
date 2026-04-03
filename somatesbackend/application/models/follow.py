from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from application.db import Base
from sqlalchemy.orm import relationship

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"))
    following_id = Column(Integer, ForeignKey("users.id"))
