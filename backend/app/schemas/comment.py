from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentAuthor(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None


class CommentResponse(BaseModel):
    id: int
    movie_id: int
    user_id: int
    parent_id: Optional[int]
    content: str
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime]
    author: CommentAuthor
    like_count: int = 0
    user_liked: bool = False
    reply_count: int = 0

    class Config:
        from_attributes = True


class CommentTreeResponse(BaseModel):
    id: int
    movie_id: int
    user_id: int
    parent_id: Optional[int]
    content: str
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime]
    author: CommentAuthor
    like_count: int = 0
    user_liked: bool = False
    reply_count: int = 0
    replies: List["CommentTreeResponse"] = []

    class Config:
        from_attributes = True


# Allow self-referencing
CommentTreeResponse.model_rebuild()
