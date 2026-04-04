from fastapi import FastAPI
from application.routes.signup import router as signup_router
from application.routes.profile import router as profile_router
from application.routes.followers import router as follower_router
from application.routes.userpost import router as post_route
from application.routes.like import router as like_route
from application.routes.comments import router as comment_route
from application.routes.notificationroute import router as notification_route
from application.routes.searchuser import router as searching_route
from application.routes.storyroute import router as story_route
from application.routes.messageroute import router as message_route
from application.routes.websocket import router as websocket_router
from application.routes.somateChatbot import router as somatebot
from application.routes.privacy_req import router as privacy_router
from application.models import follow_request
from application.db import Base, sync_engine 
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=sync_engine )

app=FastAPI()

origins = [
    "http://localhost:5173",  
    "https://somates-app.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],  
    allow_headers=["*"],
)

app.include_router(signup_router)
app.include_router(profile_router)
app.include_router(follower_router)
app.include_router(post_route)
app.include_router(like_route)
app.include_router(comment_route)
app.include_router(notification_route)
app.include_router(searching_route)
app.include_router(story_route)
app.include_router(message_route)
app.include_router(websocket_router)
app.include_router(somatebot)
app.include_router(privacy_router)

@app.get('/home')
def homeroute():
    return {'Welcome to somates app'}

