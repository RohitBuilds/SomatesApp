from application.services.auth import hash_password
from application.services.auth import verify_password
from fastapi import Depends,HTTPException,Request
from sqlalchemy.orm import Session
from application.db import get_db
from application.schemas.userCreate import UserCreate
from application.models.users import User
from fastapi import APIRouter
from application.schemas import userCreate
from application.schemas.loginReq import LoginRequest
from fastapi import Response
from application.services.auth import verify_password 
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        phoneNum=user.phoneNum
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created"}


#New login code 
@router.post("/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    response.set_cookie(
        key="session_id",
        value=str(user.id),
        httponly=True,
        samesite="none",
        secure=True,
        path="/",
        max_age=60*60*24*7   
    )
    return {"message": "Login successful", "user_id": str(user.id)}

#New code
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session_id",
        httponly=True,
        samesite="none",  
        secure=True,       
        path="/",
    )
    return {"message": "Logged out successfully"}


@router.get("/getalluser")
def get_all_users(request: Request, db: Session = Depends(get_db)):
    
    current_user_id = int(request.cookies.get("session_id"))

    users = db.query(User).filter(User.id != current_user_id).all()

    return users

@router.get("/all-usersDB")
def get_all_users_db(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user = db.query(User).filter(User.id == int(session_id)).first()
    except (ValueError, Exception):
        raise HTTPException(status_code=401, detail="Invalid session")
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email}
