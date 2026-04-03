from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from application.db import get_db
from application.models.message import Message
from application.models.users import User
from application.routes.websocket import active_connections,websocket_endpoint,WebSocketDisconnect,WebSocket
import asyncio
from sqlalchemy import desc, or_
from application.dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

def get_current_user_id(request: Request):
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)

@router.post("/send")
def send_message(
    receiver_id: int,
    content: str,
    request: Request,
    db: Session = Depends(get_db)
):
    sender_id = get_current_user_id(request)

    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    # 🔥 REAL-TIME SEND
    if receiver_id in active_connections:
        websocket = active_connections[receiver_id]

        asyncio.create_task(
            websocket.send_json({
                "type": "new_message",
                "message": {
                    "id": message.id,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "created_at": str(message.created_at)
                }
            })
        )

    return {"message": "Message sent", "id": message.id}


@router.get("/with/{user_id}")
def get_conversation(user_id: int, request: Request, db: Session = Depends(get_db)):
    current_user_id = get_current_user_id(request)

    messages = db.query(Message).filter(
        ((Message.sender_id == current_user_id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user_id))
    ).order_by(Message.created_at.asc()).all()

    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "created_at": msg.created_at,
            "is_read": msg.is_read
        })

    return result


@router.post("/mark-read/{sender_id}")
def mark_read(sender_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    
    messages = db.query(Message).filter(
        Message.sender_id == sender_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).all()

    for msg in messages:
        msg.is_read = True

    db.commit()

    return {"message": "Messages marked as read"}

@router.get("/conversations")
def get_conversations(request: Request, db: Session = Depends(get_db)):
    current_user_id = get_current_user_id(request)

    users = db.query(User).join(Message, ((Message.sender_id == User.id) | (Message.receiver_id == User.id)))\
        .filter((Message.sender_id == current_user_id) | (Message.receiver_id == current_user_id))\
        .distinct().all()

    result = [{"id": u.id, "name": u.name} for u in users]
    return result


@router.get("/users")
def get_all_users_for_chat(request: Request, db: Session = Depends(get_db)):
    current_user_id = get_current_user_id(request)

    users = db.query(User).filter(User.id != current_user_id).all()

    result = []
    for user in users:
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_picture": user.profile_picture  
        })

    return {"users": result}

@router.get("/unread")
def get_unread_messages(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)

    messages = db.query(Message).filter(
        Message.receiver_id == user_id,
        Message.is_read == False
    ).order_by(Message.created_at.desc()).all()

    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": msg.created_at
        })

    return {"unread_messages": result}

@router.get("/unread/count")
def unread_count(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)

    count = db.query(Message).filter(
        Message.receiver_id == user_id,
        Message.is_read == False
    ).count()

    return {"unread_count": count}

@router.get("/chats")
def get_chats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).order_by(desc(Message.created_at)).all()

    chats = {}

    for msg in messages:
        other_user = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id

        if other_user not in chats:
            chats[other_user] = {
                "last_message": msg.content,
                "timestamp": msg.created_at
            }

    return chats
