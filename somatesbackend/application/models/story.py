from sqlalchemy import Column, Integer, String, DateTime, ForeignKey 
from sqlalchemy.sql import func
from application.db import Base
from sqlalchemy.orm import relationship

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    user = relationship("User")