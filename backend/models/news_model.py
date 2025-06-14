from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class News:
    id: str
    title: str
    content: str # HTML-контент
    preview_url: str
    created_at: datetime = field(default_factory=datetime.utcnow)