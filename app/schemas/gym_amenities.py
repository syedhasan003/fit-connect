from pydantic import BaseModel
from typing import Optional


class GymAmenitiesOut(BaseModel):
    """
    Output schema for gym amenities.
    """
    id: int
    gym_id: int
    
    # Core amenities
    is_24_7: bool = False
    has_trainers: bool = False
    has_sauna: bool = False
    has_pool: bool = False
    has_parking: bool = False
    has_lockers: bool = False
    has_showers: bool = False
    has_wifi: bool = False
    
    # Premium features
    is_premium: bool = False
    has_spa: bool = False
    has_juice_bar: bool = False
    has_childcare: bool = False
    
    # Equipment
    has_cardio: bool = True
    has_strength: bool = True
    has_free_weights: bool = True
    has_functional: bool = False
    
    # Classes
    has_group_classes: bool = False
    has_yoga: bool = False
    has_pilates: bool = False
    has_spinning: bool = False
    
    # Accessibility
    wheelchair_accessible: bool = False

    class Config:
        from_attributes = True


class GymAmenitiesCreate(BaseModel):
    """
    Input schema for creating gym amenities.
    """
    is_24_7: bool = False
    has_trainers: bool = False
    has_sauna: bool = False
    has_pool: bool = False
    has_parking: bool = False
    has_lockers: bool = False
    has_showers: bool = False
    has_wifi: bool = False
    is_premium: bool = False
    has_spa: bool = False
    has_juice_bar: bool = False
    has_childcare: bool = False
    has_cardio: bool = True
    has_strength: bool = True
    has_free_weights: bool = True
    has_functional: bool = False
    has_group_classes: bool = False
    has_yoga: bool = False
    has_pilates: bool = False
    has_spinning: bool = False
    wheelchair_accessible: bool = False


class GymAmenitiesUpdate(BaseModel):
    """
    Input schema for updating gym amenities (all fields optional).
    """
    is_24_7: Optional[bool] = None
    has_trainers: Optional[bool] = None
    has_sauna: Optional[bool] = None
    has_pool: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_lockers: Optional[bool] = None
    has_showers: Optional[bool] = None
    has_wifi: Optional[bool] = None
    is_premium: Optional[bool] = None
    has_spa: Optional[bool] = None
    has_juice_bar: Optional[bool] = None
    has_childcare: Optional[bool] = None
    has_cardio: Optional[bool] = None
    has_strength: Optional[bool] = None
    has_free_weights: Optional[bool] = None
    has_functional: Optional[bool] = None
    has_group_classes: Optional[bool] = None
    has_yoga: Optional[bool] = None
    has_pilates: Optional[bool] = None
    has_spinning: Optional[bool] = None
    wheelchair_accessible: Optional[bool] = None