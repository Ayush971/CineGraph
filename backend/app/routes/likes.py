from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.config.database import get_db
from app.models.user import User
from app.models.like import Like
from app.schemas.like import LikeToggleRequest, LikeResponse
from app.utils.dependencies import get_current_user
from app.utils.auth import decode_access_token

router = APIRouter(prefix="/likes", tags=["Likes"])
security = HTTPBearer(auto_error=False)

VALID_TARGET_TYPES = {"comment", "review", "list"}


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        return None
    user_id = payload.get("user_id")
    if user_id is None:
        return None
    return db.query(User).filter(User.id == user_id).first()


def _get_like_count(db: Session, target_type: str, target_id: int) -> int:
    return (
        db.query(func.count(Like.id))
        .filter(Like.target_type == target_type, Like.target_id == target_id)
        .scalar()
        or 0
    )


@router.post("/toggle", response_model=LikeResponse)
def toggle_like(
    data: LikeToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle like on a target (comment, review, list). Returns new like state."""
    if data.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target type. Must be one of: {', '.join(VALID_TARGET_TYPES)}",
        )

    existing = (
        db.query(Like)
        .filter(
            Like.user_id == current_user.id,
            Like.target_type == data.target_type,
            Like.target_id == data.target_id,
        )
        .first()
    )

    if existing:
        # Unlike
        db.delete(existing)
        db.commit()
        return LikeResponse(
            liked=False,
            like_count=_get_like_count(db, data.target_type, data.target_id),
        )
    else:
        # Like
        new_like = Like(
            user_id=current_user.id,
            target_type=data.target_type,
            target_id=data.target_id,
        )
        db.add(new_like)
        db.commit()
        return LikeResponse(
            liked=True,
            like_count=_get_like_count(db, data.target_type, data.target_id),
        )


@router.get("/status/{target_type}/{target_id}", response_model=LikeResponse)
def get_like_status(
    target_type: str,
    target_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Check if current user liked a target and get total count."""
    if target_type not in VALID_TARGET_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target type.",
        )

    liked = False
    if current_user:
        liked = (
            db.query(Like)
            .filter(
                Like.user_id == current_user.id,
                Like.target_type == target_type,
                Like.target_id == target_id,
            )
            .first()
            is not None
        )

    return LikeResponse(
        liked=liked,
        like_count=_get_like_count(db, target_type, target_id),
    )
