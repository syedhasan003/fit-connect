from pydantic import BaseModel

class GymAmenitiesOut(BaseModel):
    sauna: bool
    steam: bool
    ice_bath: bool
    recovery_room: bool
    pool: bool
    parking: bool
    showers: bool
    locker: bool

    class Config:
        from_attributes = True
