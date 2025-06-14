from dataclasses import dataclass, field
from typing import List

@dataclass
class Collection:
    id: str # например, 'new', 'trending', 'top3'
    name: str # например, 'Новое', 'В тренде', 'Топ 3'
    apps: List[str] = field(default_factory=list) # Список ID приложений