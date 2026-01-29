from sqlalchemy.orm import Session
from typing import Optional

from app.models.health_memory import HealthMemory
from app.models.vault_item import VaultItem
from app.models.user import User


class VaultMirrorService:
    """
    Responsible for mirroring HealthMemory entries into Vault.
    Vault is the long-term, user-facing health library.
    """

    def mirror_memory(
        self,
        db: Session,
        user: User,
        memory: HealthMemory,
    ) -> VaultItem:
        """
        Create a VaultItem from a HealthMemory entry.
        """

        item = VaultItem(
            user_id=user.id,
            type=memory.category,          # semantic type
            category=memory.category,      # UI grouping
            title=self._build_title(memory),
            summary=self._build_summary(memory),
            content=memory.content,
            source="health_memory",
            pinned=False,
        )

        db.add(item)
        db.commit()
        db.refresh(item)

        return item

    # -------------------------------------------------
    # Helpers
    # -------------------------------------------------
    def _build_title(self, memory: HealthMemory) -> str:
        """
        Generate a human-readable title.
        """
        return memory.category.replace("_", " ").title()

    def _build_summary(self, memory: HealthMemory) -> Optional[str]:
        """
        Generate a short summary from content if possible.
        """
        if not memory.content:
            return None

        text = str(memory.content)
        return text[:120] + "…" if len(text) > 120 else text
