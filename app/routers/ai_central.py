from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.vault_item import VaultItem
from app.models.user import User
from app.deps import get_current_user
from app.schemas.central import CentralQuestion, CentralAnswer

# Orchestrator components
from app.ai.memory.context_builder import ContextBuilder
from app.ai.agent_registry import AgentRegistry
from app.ai.orchestrator.collaboration_manager import CollaborationManager
from app.ai.orchestrator.state_manager import state_manager
from app.ai.orchestrator.central_agent import CentralAgent
from app.ai.orchestrator.reflection_engine import ReflectionEngine
from app.ai.agents.coach_agent import CoachAgent
from app.ai.agents.dietician_agent import DieticianAgent

router = APIRouter(prefix="/ai/central", tags=["Central AI"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize orchestrator components (singleton pattern)
_registry = None
_central_agent = None

def get_orchestrator():
    """Lazy initialization of orchestrator components"""
    global _registry, _central_agent
    
    if _registry is None:
        _registry = AgentRegistry()
        collab_manager = CollaborationManager(_registry, state_manager)
        _central_agent = CentralAgent(_registry, collab_manager)
        
        _registry.register("central", _central_agent)
        _registry.register("coach", CoachAgent())
        _registry.register("dietician", DieticianAgent())
    
    return _central_agent


@router.post("/ask", response_model=CentralAnswer)
async def ask_central_ai(
    payload: CentralQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Central AI Brain (UNIFIED WITH ORCHESTRATOR)
    
    This endpoint now routes through the orchestrator for intelligent
    multi-agent responses while maintaining backward compatibility.
    
    Flow:
    1. Build user context (memory, profile, vault items)
    2. Route through orchestrator for intent classification
    3. Select appropriate agent (Coach, Dietician, etc.)
    4. Generate response with full context awareness
    5. Store AI insight in memory
    6. Run reflection loop for learning
    """

    question = payload.question

    try:
        # --------------------------------------------------
        # BUILD RICH CONTEXT
        # --------------------------------------------------
        context = ContextBuilder.build(user_id=current_user.id, db=db)
        
        # Add vault items (uploaded documents, images, etc.)
        vault_items = (
            db.query(VaultItem)
            .filter(VaultItem.user_id == current_user.id)
            .order_by(VaultItem.created_at.desc())
            .limit(10)
            .all()
        )
        
        context["vault"] = [
            {
                "type": item.item_type,
                "category": item.category,
                "title": item.title,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in vault_items
        ]
        
        # Add database session to context
        context["db"] = db

        # --------------------------------------------------
        # ROUTE THROUGH ORCHESTRATOR
        # --------------------------------------------------
        central_agent = get_orchestrator()
        
        orchestrator_payload = {
            "type": "orchestrate",
            "input": {"goal_text": question},
            "context": context,
        }
        
        result = await central_agent.handle(orchestrator_payload)
        final = result.get("final", {})
        
        if not final:
            raise HTTPException(status_code=500, detail="Orchestrator returned no result")
        
        decisions = final.get("decisions", [])
        
        if not decisions:
            # Fallback to direct OpenAI if orchestrator returns nothing
            answer = await _fallback_openai_response(question, current_user, db)
        else:
            # Extract primary agent response
            primary_decision = decisions[0]
            agent_result = primary_decision.get("result", {})
            
            # Format response for frontend
            if isinstance(agent_result, dict):
                # Structured response from agent
                title = agent_result.get("title", "")
                summary = agent_result.get("summary", "")
                suggestions = agent_result.get("suggestions", [])
                next_steps = agent_result.get("next_steps", "")
                
                answer_parts = []
                if title:
                    answer_parts.append(f"**{title}**\n")
                if summary:
                    answer_parts.append(summary)
                if suggestions:
                    answer_parts.append("\n\n**Suggestions:**")
                    for suggestion in suggestions:
                        answer_parts.append(f"• {suggestion}")
                if next_steps:
                    answer_parts.append(f"\n\n**Next Steps:** {next_steps}")
                
                answer = "\n".join(answer_parts) if answer_parts else str(agent_result)
            else:
                answer = str(agent_result)

            # --------------------------------------------------
            # RUN REFLECTION LOOP (LEARNING)
            # --------------------------------------------------
            try:
                ReflectionEngine.reflect(
                    user_id=current_user.id,
                    intent=final.get("intent"),
                    decisions=decisions,
                    db=db,
                )
            except Exception as e:
                print(f"[REFLECTION ERROR] {e}")
                # Don't fail the request if reflection fails

        # --------------------------------------------------
        # STORE AI INSIGHT IN MEMORY
        # --------------------------------------------------
        try:
            db.add(
                HealthMemory(
                    user_id=current_user.id,
                    category="ai_insight",
                    content=answer,
                )
            )
            db.commit()
        except Exception as e:
            print(f"[MEMORY STORAGE ERROR] {e}")
            db.rollback()

        return CentralAnswer(
            question=question,
            answer=answer,
        )

    except Exception as e:
        print(f"[CENTRAL ERROR] {e}")
        # Fallback to simple OpenAI if orchestrator fails
        try:
            answer = await _fallback_openai_response(question, current_user, db)
            return CentralAnswer(question=question, answer=answer)
        except Exception as fallback_error:
            raise HTTPException(
                status_code=500,
                detail=f"Central AI failed: {str(e)}\nFallback also failed: {str(fallback_error)}"
            )


async def _fallback_openai_response(
    question: str,
    current_user: User,
    db: Session,
) -> str:
    """
    Fallback to direct OpenAI call if orchestrator fails.
    Uses correct OpenAI API format.
    """
    
    # Fetch recent memories
    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == current_user.id)
        .order_by(HealthMemory.created_at.desc())
        .limit(15)
        .all()
    )
    
    memory_text = "\n".join([
        f"[{m.category}] {m.content}"
        for m in memories
        if m.content
    ]) or "No previous context."
    
    system_prompt = f"""You are Central, the fitness AI assistant for FitConnect.

You help users with:
- Workout planning and advice
- Nutrition guidance
- Habit formation
- Progress tracking
- Motivation and mindset

SAFETY RULES:
- You are NOT a doctor
- Never diagnose medical conditions
- Never prescribe medications
- Always suggest consulting professionals for medical concerns
- Be supportive and encouraging

USER CONTEXT:
{memory_text}

Respond in a friendly, motivating, and practical way."""

    # FIXED: Correct OpenAI API call
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Correct model name
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        max_tokens=1000,
        temperature=0.7,
    )
    
    return response.choices[0].message.content.strip()