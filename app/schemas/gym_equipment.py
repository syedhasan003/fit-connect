from pydantic import BaseModel

class GymEquipmentOut(BaseModel):
    id: int
    equipment_name: str
    category: str
    quantity: int

    class Config:
        from_attributes = True
