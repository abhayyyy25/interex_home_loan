"""AI Chat advisor endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
import json

from openai import OpenAI   # ✅ FIXED IMPORT

from ...database import get_db
from ...models import User, ChatSession, Loan
from ...schemas import ChatRequest, ChatResponse
from ...security import get_current_user
from ...config import settings

router = APIRouter()

client = OpenAI(api_key=settings.OPENAI_API_KEY)   # ✅ FIXED: initialize client ONCE


@router.get("/session/{session_id}")
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat session history"""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return {
        "session_id": session.id,
        "messages": session.messages or []
    }


async def get_ai_response(message: str, user_context: dict, conversation_history: list = None) -> str:
    """Get AI response from OpenAI with conversation history"""

    if not settings.OPENAI_API_KEY:
        return "AI advisor is not configured. Please set OPENAI_API_KEY."

    try:
        # Build system message
        system_message = f"""
You are an expert AI financial advisor specializing in Indian home loans.

User Context:
{json.dumps(user_context, indent=2)}
"""

        # Build conversation messages
        messages = [{"role": "system", "content": system_message}]

        if conversation_history:
            for m in conversation_history[-10:]:
                messages.append({"role": m["role"], "content": m["content"]})

        messages.append({"role": "user", "content": message})

        # NEW OPENAI SDK CALL
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        return response.choices[0].message.content

    except Exception as e:
        print("OpenAI API error:", e)
        return "Sorry, I am unable to respond right now."


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send message to AI advisor"""

    # Fetch user loans for context
    result = await db.execute(
        select(Loan).where(
            Loan.user_id == current_user.id,
            Loan.is_active == True
        )
    )
    loans = result.scalars().all()

    user_context = {
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "subscription_tier": current_user.subscription_tier,
        "loans": [
            {
                "bank": loan.bank_name,
                "outstanding": loan.outstanding_principal,
                "interest_rate": loan.interest_rate,
                "emi": loan.emi_amount,
                "remaining_months": loan.remaining_tenure_months,
            }
            for loan in loans
        ]
    }

    # Get or create session
    if request.session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id
            )
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

    else:
        session = ChatSession(user_id=current_user.id, messages=[])
        db.add(session)
        await db.commit()
        await db.refresh(session)

    # AI response
    history = session.messages or []
    ai_text = await get_ai_response(request.message, user_context, history)

    # Save messages
    history.append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now().isoformat()
    })

    history.append({
        "role": "assistant",
        "content": ai_text,
        "timestamp": datetime.now().isoformat()
    })

    session.messages = history
    await db.commit()

    return ChatResponse(message=ai_text, session_id=session.id)
