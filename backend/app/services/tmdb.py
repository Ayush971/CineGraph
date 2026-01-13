import requests
import os
from typing import Optional, Dict, List
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = os.getenv("TMDB_BASE_URL")
TMDB_IMAGE_BASE_URL = os.getenv("TMDB_IMAGE_BASE_URL")


class TMDBService:
    def __init__(self):
        self.api_key = TMDB_API_KEY
        self.base_url = TMDB_BASE_URL
        self.image_base_url = TMDB_IMAGE_BASE_URL

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make request to TMDB API"""
        if params is None:
            params = {}

        params["api_key"] = self.api_key

        url = f"{self.base_url}/{endpoint}"

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"TMDB API error: {str(e)}")

    def get_popular_movies(self, page: int = 1) -> Dict:
        """Get popular movies"""
        return self._make_request("movie/popular", {"page": page})

    def get_now_playing(self, page: int = 1) -> Dict:
        """Get movies now playing in theaters"""
        return self._make_request("movie/now_playing", {"page": page})

    def get_upcoming_movies(self, page: int = 1) -> Dict:
        """Get upcoming movies"""
        return self._make_request("movie/upcoming", {"page": page})

    def get_top_rated(self, page: int = 1) -> Dict:
        """Get top rated movies"""
        return self._make_request("movie/top_rated", {"page": page})

    def get_movie_details(self, movie_id: int) -> Dict:
        """Get detailed information about a movie"""
        return self._make_request(f"movie/{movie_id}")

    def search_movies(self, query: str, page: int = 1) -> Dict:
        """Search for movies"""
        return self._make_request("search/movie", {"query": query, "page": page})

    def get_movie_credits(self, movie_id: int) -> Dict:
        """Get cast and crew for a movie"""
        return self._make_request(f"movie/{movie_id}/credits")

    def get_watch_providers(self, movie_id: int) -> Dict:
        """Get watch providers for a movie"""
        return self._make_request(f"movie/{movie_id}/watch/providers")

    def get_image_url(self, path: str, size: str = "original") -> str:
        """Generate full image URL from path"""
        if not path:
            return None
        return f"{self.image_base_url}/{size}{path}"


# Create singleton instance
tmdb_service = TMDBService()
