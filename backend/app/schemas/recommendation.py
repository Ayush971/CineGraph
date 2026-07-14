from pydantic import BaseModel
from typing import Optional, List


class RecommendationItem(BaseModel):
    tmdb_id: int
    title: str
    poster_path: Optional[str] = None
    release_date: Optional[str] = None
    vote_average: Optional[float] = None
    score: float
    reason: Optional[str] = None


class RecommendationResponse(BaseModel):
    items: List[RecommendationItem]
