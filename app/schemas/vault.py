from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class VaultBase(BaseModel):
    type: str
    category: str
    title: str
    summary: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    source: Optional[str] = None
    pinned: bool = False


class VaultCreate(VaultBase):
    pass


class VaultResponse(VaultBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  
