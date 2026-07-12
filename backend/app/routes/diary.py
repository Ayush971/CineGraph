from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, datetime
from app.config.database import get_db
from app.models.diary_entry import DiaryEntry
from app.models.movie import Movie
from app.models.user import User
from app.schemas.diary import (
    DiaryEntryCreate,
    DiaryEntryUpdate,
    DiaryEntryResponse,
    DiaryStats
)
from app.utils.dependencies import get_current_user
from app.services.achievement_engine import check_achievements

router = APIRouter(prefix="/diary", tags=["Diary"])

# Create diary entry
@router.post("/entries", response_model=DiaryEntryResponse, status_code=status.HTTP_201_CREATED)
def create_diary_entry(
    entry_data: DiaryEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if movie exists in our database, if not fetch from TMDB
    movie = db.query(Movie).filter(Movie.tmdb_id == entry_data.movie_id).first()
    
    if not movie:
        # We'll need to fetch and cache this movie first
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found. Please view movie details page first to cache it."
        )
    
    # Create diary entry
    new_entry = DiaryEntry(
        user_id=current_user.id,
        movie_id=movie.id,
        watched_date=entry_data.watched_date,
        rating=entry_data.rating,
        review=entry_data.review,
        is_rewatch=entry_data.is_rewatch
    )
    
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    # Check and award any newly earned achievements
    try:
        check_achievements(current_user.id, db)
    except Exception:
        pass  # Don't fail diary entry creation if achievement check fails
    
    # Prepare response with movie details
    response = DiaryEntryResponse(
        id=new_entry.id,
        user_id=new_entry.user_id,
        movie_id=new_entry.movie_id,
        watched_date=new_entry.watched_date,
        rating=new_entry.rating,
        review=new_entry.review,
        is_rewatch=new_entry.is_rewatch,
        created_at=new_entry.created_at,
        updated_at=new_entry.updated_at,
        movie={
            "id": movie.id,
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "poster_path": movie.poster_path,
            "release_date": str(movie.release_date) if movie.release_date else None
        }
    )
    
    return response

# Get all diary entries for current user
@router.get("/entries", response_model=List[DiaryEntryResponse])
def get_diary_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    sort_by: str = Query("date_desc", regex="^(date_asc|date_desc|rating_asc|rating_desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DiaryEntry).filter(DiaryEntry.user_id == current_user.id)
    
    # Sorting
    if sort_by == "date_desc":
        query = query.order_by(DiaryEntry.watched_date.desc())
    elif sort_by == "date_asc":
        query = query.order_by(DiaryEntry.watched_date.asc())
    elif sort_by == "rating_desc":
        query = query.order_by(DiaryEntry.rating.desc().nullslast())
    elif sort_by == "rating_asc":
        query = query.order_by(DiaryEntry.rating.asc().nullsfirst())
    
    entries = query.offset(skip).limit(limit).all()
    
    # Build response with movie details
    response = []
    for entry in entries:
        movie = db.query(Movie).filter(Movie.id == entry.movie_id).first()
        response.append(DiaryEntryResponse(
            id=entry.id,
            user_id=entry.user_id,
            movie_id=entry.movie_id,
            watched_date=entry.watched_date,
            rating=entry.rating,
            review=entry.review,
            is_rewatch=entry.is_rewatch,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            movie={
                "id": movie.id,
                "tmdb_id": movie.tmdb_id,
                "title": movie.title,
                "poster_path": movie.poster_path,
                "release_date": str(movie.release_date) if movie.release_date else None
            }
        ))
    
    return response

# Get specific diary entry
@router.get("/entries/{entry_id}", response_model=DiaryEntryResponse)
def get_diary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diary entry not found"
        )
    
    movie = db.query(Movie).filter(Movie.id == entry.movie_id).first()
    
    return DiaryEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        movie_id=entry.movie_id,
        watched_date=entry.watched_date,
        rating=entry.rating,
        review=entry.review,
        is_rewatch=entry.is_rewatch,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        movie={
            "id": movie.id,
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "poster_path": movie.poster_path,
            "release_date": str(movie.release_date) if movie.release_date else None
        }
    )

# Check if user has logged a specific movie
@router.get("/entries/movie/{movie_id}")
def get_entry_for_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # movie_id here is tmdb_id
    movie = db.query(Movie).filter(Movie.tmdb_id == movie_id).first()
    
    if not movie:
        return {"logged": False, "entries": []}
    
    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.movie_id == movie.id
    ).order_by(DiaryEntry.watched_date.desc()).all()
    
    if not entries:
        return {"logged": False, "entries": []}
    
    entry_list = []
    for entry in entries:
        entry_list.append({
            "id": entry.id,
            "watched_date": str(entry.watched_date),
            "rating": float(entry.rating) if entry.rating else None,
            "review": entry.review,
            "is_rewatch": entry.is_rewatch
        })
    
    return {
        "logged": True,
        "entries": entry_list,
        "latest": entry_list[0] if entry_list else None
    }

# Update diary entry
@router.put("/entries/{entry_id}", response_model=DiaryEntryResponse)
def update_diary_entry(
    entry_id: int,
    entry_data: DiaryEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diary entry not found"
        )
    
    # Update fields
    if entry_data.watched_date is not None:
        entry.watched_date = entry_data.watched_date
    if entry_data.rating is not None:
        entry.rating = entry_data.rating
    if entry_data.review is not None:
        entry.review = entry_data.review
    if entry_data.is_rewatch is not None:
        entry.is_rewatch = entry_data.is_rewatch
    
    entry.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(entry)
    
    movie = db.query(Movie).filter(Movie.id == entry.movie_id).first()
    
    return DiaryEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        movie_id=entry.movie_id,
        watched_date=entry.watched_date,
        rating=entry.rating,
        review=entry.review,
        is_rewatch=entry.is_rewatch,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        movie={
            "id": movie.id,
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "poster_path": movie.poster_path,
            "release_date": str(movie.release_date) if movie.release_date else None
        }
    )

# Delete diary entry
@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diary entry not found"
        )
    
    db.delete(entry)
    db.commit()
    
    return None

# Get user statistics
@router.get("/stats", response_model=DiaryStats)
def get_diary_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total entries
    total_entries = db.query(func.count(DiaryEntry.id)).filter(
        DiaryEntry.user_id == current_user.id
    ).scalar()
    
    # Total unique movies
    total_movies = db.query(func.count(func.distinct(DiaryEntry.movie_id))).filter(
        DiaryEntry.user_id == current_user.id
    ).scalar()
    
    # Average rating
    avg_rating = db.query(func.avg(DiaryEntry.rating)).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.rating.isnot(None)
    ).scalar()
    
    # Total rewatches
    total_rewatches = db.query(func.count(DiaryEntry.id)).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.is_rewatch == True
    ).scalar()
    
    # Films this year
    current_year = datetime.now().year
    films_this_year = db.query(func.count(DiaryEntry.id)).filter(
        DiaryEntry.user_id == current_user.id,
        extract('year', DiaryEntry.watched_date) == current_year
    ).scalar()
    
    # Films this month
    current_month = datetime.now().month
    films_this_month = db.query(func.count(DiaryEntry.id)).filter(
        DiaryEntry.user_id == current_user.id,
        extract('year', DiaryEntry.watched_date) == current_year,
        extract('month', DiaryEntry.watched_date) == current_month
    ).scalar()
    
    return DiaryStats(
        total_movies=total_movies or 0,
        total_entries=total_entries or 0,
        average_rating=round(float(avg_rating), 1) if avg_rating else None,
        total_rewatches=total_rewatches or 0,
        films_this_year=films_this_year or 0,
        films_this_month=films_this_month or 0
    )