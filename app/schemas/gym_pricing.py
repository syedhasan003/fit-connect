from pydantic import BaseModel

class GymPricingOut(BaseModel):
    id: int
    plan_name: str
    price: float
    duration: str

    class Config:
        from_attributes = True
