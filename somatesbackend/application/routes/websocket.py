from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from application.db import get_db
from application.routes.manager import manager
from application.models.message import Message


router = APIRouter()
active_connections = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(user_id, websocket, db)

    try:
        while True:
            data = await websocket.receive_json()

            receiver_id = data.get("receiver_id")
            message_type = data.get("type")

            # ✅ NORMAL MESSAGE
            if message_type == "message":
                content = data.get("content")

                msg = Message(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    content=content
                )

                db.add(msg)
                db.commit()
                db.refresh(msg)

                await manager.send_message(receiver_id, {
                    "type": "message",
                    "sender_id": user_id,
                    "content": content,
                    "timestamp": str(msg.timestamp)
                })

            # ✅ TYPING INDICATOR
            elif message_type == "typing":
                await manager.send_message(receiver_id, {
                    "type": "typing",
                    "sender_id": user_id
                })

            # ✅ STOP TYPING
            elif message_type == "stop_typing":
                await manager.send_message(receiver_id, {
                    "type": "stop_typing",
                    "sender_id": user_id
                })

    except WebSocketDisconnect:
        await manager.disconnect(user_id, db)
