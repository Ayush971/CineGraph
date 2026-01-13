from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.movie import Movie
from app.schemas.movie import MovieResponse, MovieDetail, MovieListResponse
from app.services.tmdb import tmdb_service
from typing import Optional

router = APIRouter(prefix="/movies", tags=["Movies"])


# Get popular movies
@router.get("/popular", response_model=MovieListResponse)
def get_popular_movies(page: int = Query(1, ge=1, le=500)):
    """Get popular movies from TMDB"""
    data = tmdb_service.get_popular_movies(page)
    return data


# Get now playing movies
@router.get("/now-playing", response_model=MovieListResponse)
def get_now_playing(page: int = Query(1, ge=1, le=500)):
    """Get movies currently in theaters"""
    data = tmdb_service.get_now_playing(page)
    return data


# Get upcoming movies
@router.get("/upcoming", response_model=MovieListResponse)
def get_upcoming_movies(page: int = Query(1, ge=1, le=500)):
    """Get upcoming movies"""
    data = tmdb_service.get_upcoming_movies(page)
    return data


# Get top rated movies
@router.get("/top-rated", response_model=MovieListResponse)
def get_top_rated(page: int = Query(1, ge=1, le=500)):
    """Get top rated movies"""
    data = tmdb_service.get_top_rated(page)
    return data


# Search movies
@router.get("/search")
def search_movies(
    query: str = Query(..., min_length=1), page: int = Query(1, ge=1, le=500)
):
    """Search for movies"""
    data = tmdb_service.search_movies(query, page)
    return data


# Get movie watch providers
@router.get("/{movie_id}/watch-providers")
def get_movie_watch_providers(movie_id: int):
    """Get watch providers for a movie"""
    data = tmdb_service.get_watch_providers(movie_id)
    return data


# Get movie details
@router.get("/{movie_id}")
def get_movie_details(movie_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific movie"""

    # Check if movie is cached in our database
    cached_movie = db.query(Movie).filter(Movie.tmdb_id == movie_id).first()

    # Get fresh data from TMDB
    movie_data = tmdb_service.get_movie_details(movie_id)
    credits_data = tmdb_service.get_movie_credits(movie_id)

    # Cache or update movie in database
    if cached_movie:
        # Update existing cache
        cached_movie.title = movie_data.get("title")
        cached_movie.overview = movie_data.get("overview")
        cached_movie.release_date = movie_data.get("release_date")
        cached_movie.poster_path = movie_data.get("poster_path")
        cached_movie.backdrop_path = movie_data.get("backdrop_path")
        cached_movie.runtime = movie_data.get("runtime")
        db.commit()
    else:
        # Create new cache entry
        new_movie = Movie(
            tmdb_id=movie_id,
            title=movie_data.get("title"),
            overview=movie_data.get("overview"),
            release_date=movie_data.get("release_date"),
            poster_path=movie_data.get("poster_path"),
            backdrop_path=movie_data.get("backdrop_path"),
            runtime=movie_data.get("runtime"),
        )
        db.add(new_movie)
        db.commit()

    # Combine movie data with credits
    response = {**movie_data, "credits": credits_data}

    return response
