from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from langchain_mistralai import ChatMistralAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict
import os

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "your-mistral-api-key-here")


try:
    llm = ChatMistralAI(
        model="mistral-small-latest",  
        mistral_api_key=MISTRAL_API_KEY,
        temperature=0.7,
        max_tokens=500
    )
except Exception as e:
    print(f"Failed to initialize Mistral AI: {e}")
    llm = None


SYSTEM_PROMPT = """You are SomatesBot, a friendly and helpful AI assistant for the Somates social media platform. 
You help users with:
- General conversations and companionship
- Advice about social interactions
- Questions about the platform
- Creative ideas and brainstorming
- Emotional support and motivation

Be warm, friendly, and conversational. Keep responses concise (2-3 sentences typically) unless the user asks for detailed information.
Use emojis occasionally to be more expressive! 😊"""

# In-memory chat history (in production, use a database)
# Format: {user_id: [messages]}
chat_history: Dict[int, List[Dict]] = {}


# ── Request Models ────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str


# ── Helper Functions ──────────────────────────────────────────────────────
def get_current_user_id(request: Request) -> int:
    """Get user ID from session cookie"""
    user_id = request.cookies.get("session_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return int(user_id)


def get_chat_history(user_id: int) -> List[Dict]:
    """Get chat history for a user"""
    if user_id not in chat_history:
        chat_history[user_id] = []
    return chat_history[user_id]


def add_to_history(user_id: int, role: str, content: str):
    """Add message to chat history"""
    if user_id not in chat_history:
        chat_history[user_id] = []
    
    chat_history[user_id].append({
        "role": role,
        "content": content
    })
    
    # Keep only last 20 messages to avoid token limits
    if len(chat_history[user_id]) > 20:
        chat_history[user_id] = chat_history[user_id][-20:]


# ── API Endpoints ─────────────────────────────────────────────────────────
@router.post("/chat")
async def chat_with_bot(
    chat_request: ChatRequest,
    request: Request
):
    """
    Chat with the AI bot
    Returns bot's response
    """
    if not llm:
        return {
            "response": "Sorry, the AI chatbot is currently unavailable. Please check your Mistral API key configuration."
        }
    
    try:
        user_id = get_current_user_id(request)
        user_message = chat_request.message.strip()
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get conversation history
        history = get_chat_history(user_id)
        
        # Build messages for LangChain
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        # Add conversation history
        for msg in history[-10:]:  # Last 10 messages for context
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current user message
        messages.append(HumanMessage(content=user_message))
        
        # Get response from Mistral
        response = llm.invoke(messages)
        bot_response = response.content
        
        # Save to history
        add_to_history(user_id, "user", user_message)
        add_to_history(user_id, "assistant", bot_response)
        
        return {
            "response": bot_response,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chatbot error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chatbot response: {str(e)}")


@router.get("/history")
async def get_chat_history_endpoint(request: Request):
    """
    Get chat history with the bot
    """
    try:
        user_id = get_current_user_id(request)
        history = get_chat_history(user_id)
        
        # Format for frontend (similar to message format)
        formatted_history = []
        for i, msg in enumerate(history):
            formatted_history.append({
                "id": f"chatbot_{i}",
                "sender_id": "chatbot" if msg["role"] == "assistant" else "me",
                "content": msg["content"],
                "created_at": "2024-01-01T00:00:00Z",  # Placeholder
                "is_read": True
            })
        
        return formatted_history
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to get chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat history")


@router.delete("/history")
async def clear_chat_history(request: Request):
    """
    Clear chat history with the bot
    """
    try:
        user_id = get_current_user_id(request)
        if user_id in chat_history:
            chat_history[user_id] = []
        
        return {"message": "Chat history cleared"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to clear history")


