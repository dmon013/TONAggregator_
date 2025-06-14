# backend/models/user_model.py
from dataclasses import dataclass, field
from typing import Dict

@dataclass
class User:
    id: str
    telegram_id: int
    username: str
    photo_url: str
    # Заменяем 'favorites' на 'my_apps' со структурой { "slot_index": "app_id" }
    my_apps: Dict[str, str] = field(default_factory=dict)
    is_admin: bool = False