# backend/models/news_model.py
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class News:
    id: str
    title: str
    excerpt: str  # <--- НАШЕ НОВОЕ ПОЛЕ
    content: str  # HTML-контент
    preview_url: str
    created_at: datetime = field(default_factory=datetime.utcnow)