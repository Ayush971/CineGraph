from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

# Base schema
class DiaryEntryBase(BaseModel):
    movie_id: int
    watched_date: date
    rating: Optional[Decimal] = Field(None, ge=0, le=10)
    review: Optional[str] = Field(None, max_length=5000)
    is_rewatch: bool = False

    @field_validator('watched_date')
    @classmethod
    def validate_watched_date(cls, v):
        if v > date.today():
            raise ValueError('Watched date cannot be in the future')
        return v

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v is not None:
            # Round to nearest 0.1
            return round(float(v), 1)
        return v

# Create schema
class DiaryEntryCreate(DiaryEntryBase):
    pass

# Update schema
class DiaryEntryUpdate(BaseModel):
    watched_date: Optional[date] = None
    rating: Optional[Decimal] = Field(None, ge=0, le=10)
    review: Optional[str] = Field(None, max_length=5000)
    is_rewatch: Optional[bool] = None

    @field_validator('watched_date')
    @classmethod
    def validate_watched_date(cls, v):
        if v and v > date.today():
            raise ValueError('Watched date cannot be in the future')
        return v

# Response schema with movie details
class DiaryEntryResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    watched_date: date
    rating: Optional[Decimal]
    review: Optional[str]
    is_rewatch: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Nested movie data
    movie: dict  # We'll populate this with movie details

    class Config:
        from_attributes = True

# Stats schema
class DiaryStats(BaseModel):
    total_movies: int
    total_entries: int  # Including rewatches
    average_rating: Optional[float]
    total_rewatches: int
    films_this_year: int
    films_this_month: int