from pydantic import BaseModel


class LikeToggleRequest(BaseModel):
    target_type: str  # "comment", "review", "list"
    target_id: int


class LikeResponse(BaseModel):
    liked: bool
    like_count: int
