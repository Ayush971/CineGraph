from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class MovieBase(BaseModel):
    tmdb_id: int
    title: str
    overview: Optional[str] = None
    release_date: Optional[date] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    runtime: Optional[int] = None

class MovieResponse(MovieBase):
    id: int
    
    class Config:
        from_attributes = True

class MovieDetail(MovieBase):
    genres: List[dict] = []
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    popularity: Optional[float] = None
    
    class Config:
        from_attributes = True

class MovieListResponse(BaseModel):
    page: int
    results: List[dict]
    total_pages: int
    total_results: int