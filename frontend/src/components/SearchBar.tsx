import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
            placeholder="Search movies…"
            className="w-full px-4 py-2 pl-10 bg-surface-3 border border-line rounded-md text-ink text-sm placeholder:text-ink-faint focus:outline-none focus:border-daylight-400/60 focus:shadow-[var(--shadow-glow-cool)] transition-[border-color,box-shadow] duration-150"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors cursor-pointer"
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
      <AnimatePresence>
        {showPredictions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface-2 border border-line-strong rounded-lg shadow-[var(--shadow-lift)] z-50 overflow-hidden"
          >
            {predictions.map((movie) => (
              <div
                key={movie.id}
                onClick={() => handlePredictionClick(movie.id)}
                className="flex items-center gap-3 p-3 hover:bg-surface-3 cursor-pointer transition-colors duration-150 border-b border-line last:border-none"
              >
                {/* Poster */}
                <div className="w-10 h-[60px] shrink-0 bg-surface-3 rounded overflow-hidden">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="meta !text-[0.6rem]">N/A</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-ink truncate">
                    {movie.title}
                  </h4>
                  <div className="meta mt-1 flex items-center gap-2">
                    <span>
                      {movie.release_date
                        ? new Date(movie.release_date).getFullYear()
                        : "TBA"}
                    </span>
                    {movie.vote_average ? (
                      <span className="text-tungsten-300">
                        ★ {movie.vote_average.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
