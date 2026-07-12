from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AchievementResponse(BaseModel):
    id: int
    title: str
    description: str
    icon: str
    criteria_type: str
    category: str
    tier: str

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    achievement: AchievementResponse
    earned_at: datetime


class AchievementProgress(BaseModel):
    achievement: AchievementResponse
    earned: bool
    earned_at: Optional[datetime] = None
    current: int = 0
    target: int = 0
    progress_text: str = ""
