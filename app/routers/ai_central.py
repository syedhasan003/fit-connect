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


def format_agent_response(agent_result) -> str:
    """
    Convert structured agent response to beautiful markdown.
    Handles both dict responses and string responses.
    """
    if isinstance(agent_result, str):
        return agent_result
    
    if not isinstance(agent_result, dict):
        return str(agent_result)
    
    # Extract fields
    title = agent_result.get("title", "")
    message = agent_result.get("message", "")
    summary = agent_result.get("summary", "")
    mindset_reframe = agent_result.get("mindset_reframe", "")
    suggestions = agent_result.get("suggestions", [])
    actions = agent_result.get("actions", [])
    next_steps = agent_result.get("next_steps", "")
    safety_notes = agent_result.get("safety_notes", "")
    exercises = agent_result.get("exercises", [])
    meals = agent_result.get("meals", [])
    
    # Build markdown
    parts = []
    
    # Title (bold and prominent)
    if title:
        parts.append(f"**{title}**\n")
    
    # Main message/summary
    if message:
        parts.append(message)
    elif summary:
        parts.append(summary)
    
    # Exercises (for workout plans)
    if exercises:
        parts.append("\n### 🏋️ Your Workout")
        for i, ex in enumerate(exercises, 1):
            if isinstance(ex, dict):
                name = ex.get("name", "Exercise")
                sets = ex.get("sets", "")
                reps = ex.get("reps", "")
                rest = ex.get("rest", "")
                notes = ex.get("notes", "")
                parts.append(f"{i}. **{name}**")
                if sets and reps:
                    parts.append(f"   - {sets} sets × {reps} reps" + (f" • Rest: {rest}" if rest else ""))
                if notes:
                    parts.append(f"   - {notes}")
            else:
                parts.append(f"{i}. {ex}")
    
    # Meals (for diet plans)
    if meals:
        parts.append("\n### 🍽️ Your Meal Plan")
        for i, meal in enumerate(meals, 1):
            if isinstance(meal, dict):
                name = meal.get("name", "Meal")
                foods = meal.get("foods", [])
                parts.append(f"{i}. **{name}**")
                for food in foods:
                    parts.append(f"   - {food}")
            else:
                parts.append(f"{i}. {meal}")
    
    # Mindset reframe (special formatting)
    if mindset_reframe:
        parts.append(f"\n### 💭 Mindset Shift\n{mindset_reframe}")
    
    # Suggestions
    if suggestions:
        parts.append("\n### 💡 Tips")
        for suggestion in suggestions:
            if isinstance(suggestion, dict):
                parts.append(f"- {suggestion.get('text', suggestion.get('tip', str(suggestion)))}")
            else:
                parts.append(f"- {suggestion}")
    
    # Actions (actionable tips)
    if actions:
        parts.append("\n### ✅ Action Steps")
        for i, action in enumerate(actions, 1):
            if isinstance(action, dict):
                tip = action.get("tip", action.get("action", str(action)))
                parts.append(f"{i}. {tip}")
            else:
                parts.append(f"{i}. {action}")
    
    # Next steps
    if next_steps:
        parts.append(f"\n### 🎯 Next Steps\n{next_steps}")
    
    # Safety notes (always at the end)
    if safety_notes:
        parts.append(f"\n---\n\n*{safety_notes}*")
    
    return "\n".join(parts) if parts else "I'm here to help! What would you like to know?"


@router.post("/ask", response_model=CentralAnswer)
async def ask_central_ai(
    payload: CentralQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Central AI Brain (UNIFIED WITH ORCHESTRATOR)
    
    Flow:
    1. Build user context (memory, profile, vault items)
    2. Route through orchestrator for intent classification
    3. Select appropriate agent (Coach, Dietician, etc.)
    4. Generate response with full context awareness
    5. Format response as beautiful markdown
    6. Store AI insight in memory
    7. Run reflection loop for learning
    """

    question = payload.question

    try:
        # --------------------------------------------------
        # BUILD RICH CONTEXT
        # --------------------------------------------------
        context = ContextBuilder.build(user_id=current_user.id, db=db)
        
        # Add vault items
        vault_items = (
            db.query(VaultItem)
            .filter(VaultItem.user_id == current_user.id)
            .order_by(VaultItem.created_at.desc())
            .limit(10)
            .all()
        )
        
        context["vault"] = [
            {
                "type": getattr(item, "item_type", None) or getattr(item, "type", None) or "unknown",
                "category": getattr(item, "category", None),
                "title": getattr(item, "title", None) or getattr(item, "name", None),
                "created_at": item.created_at.isoformat() if getattr(item, "created_at", None) else None,
            }
            for item in vault_items
        ]
        
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
            # Fallback to direct OpenAI
            answer = await _fallback_openai_response(question, current_user, db)
        else:
            # Extract and format primary agent response
            primary_decision = decisions[0]
            agent_result = primary_decision.get("result", {})
            
            # Format response
            answer = format_agent_response(agent_result)

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

        # --------------------------------------------------
        # STORE AI INSIGHT IN MEMORY
        # --------------------------------------------------
        try:
            db.add(
                HealthMemory(
                    user_id=current_user.id,
                    category="ai_insight",
                    content=answer[:500],
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
        # Fallback to simple OpenAI
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
    """Fallback to direct OpenAI call if orchestrator fails."""
    
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

CRITICAL INSTRUCTIONS:
- Be SPECIFIC and ACTIONABLE, not just motivational
- When asked for workouts: provide ACTUAL exercises with sets, reps, rest times
- When asked for diet plans: provide ACTUAL meals with portions
- Focus on practical, concrete advice
- Include numbers, measurements, and specifics
- Format with markdown for clarity

USER CONTEXT:
{memory_text}

RESPONSE FORMAT:
For workouts, use this structure:
**[Title]**

[Brief intro]

### 🏋️ Your Workout
1. **[Exercise Name]**
   - [Sets] sets × [Reps] reps • Rest: [Time]
   - [Optional form notes]

For meal plans, use this structure:
**[Title]**

[Brief intro]

### 🍽️ Your Meals
1. **[Meal Name]** ([Calories]kcal)
   - [Food 1] - [Portion]
   - [Food 2] - [Portion]

### 💡 Tips
- [Practical tip 1]
- [Practical tip 2]

*[Safety note if relevant]*"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        max_tokens=1500,  # Increased for more detailed responses
        temperature=0.7,
    )
    
    return response.choices[0].message.content.strip()