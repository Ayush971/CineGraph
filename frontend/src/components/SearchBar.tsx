import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { moviesAPI } from "../services/api";
import type { Movie } from "../types";

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Movie[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        try {
          const response = await moviesAPI.search(query);
          setPredictions(response.data.results.slice(0, 5)); // Limit to 5 predictions
          setShowPredictions(true);
        } catch (error) {
          console.error("Error fetching predictions:", error);
        }
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowPredictions(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePredictionClick = (movieId: number) => {
    setQuery("");
    setShowPredictions(false);
    navigate(`/movie/${movieId}`);
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-xl relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setShowPredictions(true);
            }}
            placeholder="Search movies..."
            className="w-full px-4 py-2 pl-10 bg-surface-light border border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors text-white text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setShowPredictions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Predictions Dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {predictions.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handlePredictionClick(movie.id)}
              className="flex items-center gap-3 p-3 hover:bg-surface-light cursor-pointer transition-colors border-b border-gray-800 last:border-none"
            >
              {/* Poster */}
              <div className="w-12 h-16 shrink-0 bg-gray-800 rounded overflow-hidden">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <span className="text-xs">No Img</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">
                  {movie.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <span>
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : "TBA"}
                  </span>
                  <span>•</span>
                  <div className="flex items-center text-yellow-500">
                    <span className="mr-1">★</span>
                    {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
