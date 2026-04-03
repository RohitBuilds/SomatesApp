from fastapi import WebSocket
from sqlalchemy.orm import Session
from application.models.users import User
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}  # user_id -> websocket

    async def connect(self, user_id: int, websocket: WebSocket, db: Session):
        await websocket.accept()
        self.active_connections[user_id] = websocket

        # mark user online
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = True
            db.commit()

    async def disconnect(self, user_id: int, db: Session):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

        # mark offline + last seen
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.commit()

    async def send_message(self, receiver_id: int, message: dict):
        if receiver_id in self.active_connections:
            await self.active_connections[receiver_id].send_json(message)

manager = ConnectionManager()
