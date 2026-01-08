from enum import Enum

class Role(str, Enum):
    admin = "admin"
    gym_owner = "gym_owner"
    user = "user"
