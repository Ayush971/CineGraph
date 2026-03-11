from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FollowUserInfo(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class FollowResponse(BaseModel):
    id: int
    follower: FollowUserInfo
    following: FollowUserInfo
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False
    total_movies_watched: int = 0
    total_lists: int = 0

    class Config:
        from_attributes = True


class ActivityItem(BaseModel):
    type: str  # "watched", "reviewed", "listed", "commented"
    user: FollowUserInfo
    movie_title: str
    movie_id: int  # tmdb_id
    movie_poster: Optional[str] = None
    detail: Optional[str] = None  # rating, review snippet, list name, comment snippet
    timestamp: datetime


class ActivityFeedResponse(BaseModel):
    items: List[ActivityItem]
    has_more: bool = False
