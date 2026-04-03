from pydantic import BaseModel
from typing import Optional, List

class UserProfileOut(BaseModel):
    id: int
    username: str
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    followers: List[str] = []
    following: List[str] = []

    class Config:
        from_attributes = True  

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
