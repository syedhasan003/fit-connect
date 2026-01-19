from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.user_gym import UserGymLink
from app.models.gym_equipment import GymEquipment


def resolve_gym_context(
    *,
    user_id: int,
    db: Session,
) -> Dict[str, Any]:
    """
    READ-ONLY.
    Resolves the user's active gym context and available equipment.
    """

    link = (
        db.query(UserGymLink)
        .filter(UserGymLink.user_id == user_id)
        .first()
    )

    if not link:
        return {}

    equipment_rows: List[GymEquipment] = (
        db.query(GymEquipment)
        .filter(GymEquipment.gym_id == link.gym_id)
        .all()
    )

    equipment = [
        {
            "name": e.equipment_name,
            "category": e.category,
            "quantity": e.quantity,
        }
        for e in equipment_rows
    ]

    return {
        "gym_id": link.gym_id,
        "equipment_available": equipment,
        "source": "user_linked_gym",
    }
