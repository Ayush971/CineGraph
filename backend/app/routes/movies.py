from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.movie import Movie
from app.schemas.movie import MovieResponse, MovieDetail, MovieListResponse
from app.services.tmdb import tmdb_service
from functools import lru_cache
from typing import Optional
import json
import re
import requests

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


# CORS-friendly poster proxy.
# TMDB's image CDN sends no CORS headers, which blocks WebGL textures and
# canvas color extraction on the frontend — so we relay the bytes ourselves.
TMDB_IMG_SIZES = {"w92", "w154", "w185", "w342", "w500", "w780", "original"}


@lru_cache(maxsize=256)
def _fetch_poster(size: str, file_name: str) -> tuple:
    resp = requests.get(
        f"https://image.tmdb.org/t/p/{size}/{file_name}", timeout=10
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("content-type", "image/jpeg")


@router.get("/poster-img/{size}/{file_name}")
def poster_image(size: str, file_name: str):
    """Proxy a TMDB poster with CORS + caching headers."""
    if size not in TMDB_IMG_SIZES or not re.fullmatch(
        r"[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)", file_name
    ):
        raise HTTPException(status_code=400, detail="Invalid poster request")
    try:
        content, media_type = _fetch_poster(size, file_name)
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Poster fetch failed")
    return Response(
        content=content,
        media_type=media_type,
        # TMDB poster filenames are content-addressed and never change, so this
        # can be cached hard — repeat visits then skip the proxy entirely.
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# Get related films (TMDB recommendations)
@router.get("/{movie_id}/recommendations", response_model=MovieListResponse)
def get_movie_recommendations(movie_id: int, page: int = Query(1, ge=1, le=500)):
    """Get related films for a movie, powered by TMDB recommendations"""
    data = tmdb_service.get_recommendations(movie_id, page)
    return data


def _extract_cache_data(movie_data: dict, credits_data: dict) -> tuple:
    """Extract genres, top cast, and directors for DB caching."""
    genres = movie_data.get("genres", [])
    genres_json = json.dumps(genres) if genres else None

    cast = credits_data.get("cast", [])[:10]
    cast_slim = [
        {
            "id": c.get("id"),
            "name": c.get("name"),
            "character": c.get("character"),
            "profile_path": c.get("profile_path"),
        }
        for c in cast
    ]
    cast_json = json.dumps(cast_slim) if cast_slim else None

    crew = credits_data.get("crew", [])
    directors = [c for c in crew if c.get("job") == "Director"]
    directors_slim = [
        {
            "id": d.get("id"),
            "name": d.get("name"),
            "profile_path": d.get("profile_path"),
        }
        for d in directors
    ]
    directors_json = json.dumps(directors_slim) if directors_slim else None

    return genres_json, cast_json, directors_json


# Get movie details
@router.get("/{movie_id}")
def get_movie_details(movie_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific movie"""

    # Check if movie is cached in our database
    cached_movie = db.query(Movie).filter(Movie.tmdb_id == movie_id).first()

    # Get fresh data from TMDB
    movie_data = tmdb_service.get_movie_details(movie_id)
    credits_data = tmdb_service.get_movie_credits(movie_id)

    # Extract cache data
    genres_json, cast_json, directors_json = _extract_cache_data(movie_data, credits_data)

    # Cache or update movie in database
    if cached_movie:
        # Update existing cache
        cached_movie.title = movie_data.get("title")
        cached_movie.overview = movie_data.get("overview")
        cached_movie.release_date = movie_data.get("release_date")
        cached_movie.poster_path = movie_data.get("poster_path")
        cached_movie.backdrop_path = movie_data.get("backdrop_path")
        cached_movie.runtime = movie_data.get("runtime")
        cached_movie.genres_json = genres_json
        cached_movie.cast_json = cast_json
        cached_movie.directors_json = directors_json
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
            genres_json=genres_json,
            cast_json=cast_json,
            directors_json=directors_json,
        )
        db.add(new_movie)
        db.commit()

    # Combine movie data with credits
    response = {**movie_data, "credits": credits_data}

    return response
