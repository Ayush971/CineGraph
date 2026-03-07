from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# --- List Schemas ---


class ListCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    is_public: bool = False


class ListUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    is_public: Optional[bool] = None


class ListResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime]
    item_count: int = 0
    owner_username: str = ""

    class Config:
        from_attributes = True


# --- List Item Schemas ---


class ListItemCreate(BaseModel):
    movie_id: int  # This is tmdb_id
    rank: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=2000)


class ListItemMovieData(BaseModel):
    id: int
    tmdb_id: int
    title: str
    poster_path: Optional[str]
    release_date: Optional[str]
    backdrop_path: Optional[str] = None
    runtime: Optional[int] = None


class ListItemResponse(BaseModel):
    id: int
    list_id: int
    movie_id: int
    rank: int
    notes: Optional[str]
    added_at: datetime
    movie: ListItemMovieData

    class Config:
        from_attributes = True


class ListDetailResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime]
    owner_username: str = ""
    items: List[ListItemResponse] = []

    class Config:
        from_attributes = True


class ListReorderItem(BaseModel):
    item_id: int
    rank: int


class ListReorderRequest(BaseModel):
    items: List[ListReorderItem]
