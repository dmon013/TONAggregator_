from dataclasses import dataclass, field
from typing import List

@dataclass
class User:
    id: str  # В Firestore это будет ID документа, равный telegram_id
    telegram_id: int
    username: str
    photo_url: str
    favorites: List[str] = field(default_factory=list) # Список ID приложений
    is_admin: bool = False