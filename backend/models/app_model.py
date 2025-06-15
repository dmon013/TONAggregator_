from dataclasses import dataclass, field
from datetime import datetime
from typing import List

@dataclass
class App:
    id: str
    title: str
    title_lowercase: str # Поле для поиска
    short_description: str # Новое поле для карточек
    long_description: str  # Старое поле, переименованное для ясности
    icon_url: str
    app_url: str
    category_id: str
    screenshots: List[str] = field(default_factory=list) # <--- НОВОЕ ПОЛЕ ДЛЯ СКРИНШОТОВ
    collection_ids: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_approved: bool = False