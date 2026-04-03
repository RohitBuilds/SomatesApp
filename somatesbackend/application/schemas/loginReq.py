from pydantic import BaseModel
from fastapi import Response, HTTPException, Depends
from sqlalchemy.orm import Session
class LoginRequest(BaseModel):
    email: str
    password: str