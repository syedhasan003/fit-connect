import os
import base64
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.library_item import LibraryItem
from app.models.health_memory import HealthMemory

from openai import OpenAI

client = OpenAI()

router = APIRouter(prefix="/ai", tags=["AI Image Analysis"])


def image_to_data_url(path: str) -> str:
    with open(path, "rb") as img:
        b64 = base64.b64encode(img.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"


@router.post("/analyze-image/{library_item_id}")
def analyze_image(
    library_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------
    # Fetch library item
    # -----------------------------
    item = (
        db.query(LibraryItem)
        .filter(
            LibraryItem.id == library_item_id,
            LibraryItem.user_id == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.exists(item.file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    # -----------------------------
    # Convert image
    # -----------------------------
    image_data_url = image_to_data_url(item.file_path)

    # -----------------------------
    # Prompt
    # -----------------------------
    prompt = """
You are a medical analysis assistant.

Analyze the uploaded medical document image and extract:
1. Medical condition(s)
2. Injury or diagnosis
3. Medications (if any)
4. Restrictions (workout / diet)
5. Recovery considerations
6. Red flags or warnings

Respond in STRICT JSON with keys:
condition, diagnosis, medications, restrictions, recovery, warnings
"""

    # -----------------------------
    # OpenAI Vision Call (CORRECT)
    # -----------------------------
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {
                        "type": "input_image",
                        "image_url": image_data_url,
                    },
                ],
            }
        ],
    )

    ai_output = response.output_text

    # -----------------------------
    # Persist to Health Memory
    # -----------------------------
    memory = HealthMemory(
        user_id=current_user.id,
        category="medical_analysis",
        content=ai_output,
    )

    db.add(memory)
    db.commit()

    return {
        "status": "analyzed",
        "analysis": ai_output,
    }
