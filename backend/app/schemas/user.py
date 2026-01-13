from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# User Registration
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

# User Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# User Response (what we send back, no password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse