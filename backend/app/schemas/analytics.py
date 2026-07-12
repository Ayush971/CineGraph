from pydantic import BaseModel
from typing import List, Optional


class GenreBreakdown(BaseModel):
    genre: str
    count: int
    percentage: float


class MonthlyCount(BaseModel):
    month: int
    year: int
    count: int
    label: str  # "Jan", "Feb", etc.


class DecadeCount(BaseModel):
    decade: str  # "1980s", "1990s", etc.
    count: int


class PersonCount(BaseModel):
    person_id: int
    name: str
    profile_path: Optional[str] = None
    count: int


class WatchStreak(BaseModel):
    current_streak: int
    longest_streak: int
    last_watched: Optional[str] = None


class RatingDistribution(BaseModel):
    rating: float
    count: int


class AnalyticsOverview(BaseModel):
    genres: List[GenreBreakdown]
    monthly: List[MonthlyCount]
    decades: List[DecadeCount]
    top_actors: List[PersonCount]
    top_directors: List[PersonCount]
    streaks: WatchStreak
    total_runtime_hours: float
    average_rating: Optional[float] = None
    total_movies: int


class YearInReviewResponse(BaseModel):
    year: int
    total_movies: int
    total_hours: float
    total_entries: int
    average_rating: Optional[float] = None
    top_genre: Optional[str] = None
    top_actor: Optional[PersonCount] = None
    top_director: Optional[PersonCount] = None
    top_rated_movie: Optional[dict] = None
    monthly: List[MonthlyCount]
    genres: List[GenreBreakdown]
    rating_distribution: List[RatingDistribution]
    most_watched_month: Optional[str] = None
    longest_streak: int = 0
