from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_engine import (
    get_recommendations,
    because_you_watched,
    invalidate_recommendations,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/for-you", response_model=RecommendationResponse)
def for_you(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Personalized recommendations based on the user's rated diary entries."""
    items = get_recommendations(current_user.id, db, limit)
    return {"items": items}


@router.get("/because-you-watched/{tmdb_id}", response_model=RecommendationResponse)
def because_watched(
    tmdb_id: int,
    limit: int = Query(12, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recommendations seeded from a single movie, scored against the user's taste."""
    items = because_you_watched(current_user.id, tmdb_id, db, limit)
    return {"items": items}


@router.post("/refresh", response_model=RecommendationResponse)
def refresh(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Force a recompute (clears the cache first)."""
    invalidate_recommendations(current_user.id)
    items = get_recommendations(current_user.id, db, limit)
    return {"items": items}
