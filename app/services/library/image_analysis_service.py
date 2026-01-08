from app.ai.orchestrator.llm_engine import LLMEngine
from app.models.health_memory import HealthMemory

llm = LLMEngine()

async def analyze_image_and_store(
    db,
    user_id: int,
    image_description: str
):
    system_prompt = """
You are a medical fitness assistant.
Analyze medical information from images.
Detect injuries, conditions, restrictions.
Be language agnostic.
"""

    user_prompt = f"""
Analyze this medical document description:

{image_description}

Extract:
- condition
- restrictions
- warnings
"""

    ai_text = await llm.generate(system_prompt, user_prompt)

    memory = HealthMemory(
        user_id=user_id,
        category="medical",
        content=ai_text,
    )

    db.add(memory)
    db.commit()

    return ai_text
