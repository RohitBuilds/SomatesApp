from sqlalchemy import Column, Integer, String,BigInteger,Boolean,DateTime
from application.db import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String,nullable=False)
    email = Column(String, unique=True, index=True)
    password=Column(String,nullable=False)
    phoneNum = Column(String, nullable=False, unique=True)
    bio = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    is_private = Column(Boolean, default=False, nullable=False)
    