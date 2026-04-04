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


@router.post("/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Set cookie
    # response.set_cookie(
    #     key="session_id",
    #     value=str(user.id),
    #     httponly=True,
    #     samesite="lax",  
    #     path="/",        
    # )
    response.set_cookie(
        key="session_id",
        value=str(user.id),
        httponly=True,
        samesite="none",   # ✅ CHANGED from "lax" to "none" (cross-origin)
        secure=True,       # ✅ REQUIRED when samesite="none"
        path="/",
        max_age=60*60*24*7  # ✅ ADD: 7 days expiry
    )

    return {"message": "Login successful"}


# @router.post("/logout")
# def logout(response: Response):

#     response.delete_cookie("session_id")

#     return {"message": "Logged out successfully"}
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
