import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { moviesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import StarRating from "../components/StarRating";
import CastList from "../components/CastList";
import CrewList from "../components/CrewList";
import OTTSection from "../components/OTTSection";
import type { MovieDetail } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;

      try {
        const response = await moviesAPI.getDetails(Number(id));
        setMovie(response.data);
      } catch (err) {
        setError("Failed to fetch movie details");
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !movie) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500 text-xl">{error || "Movie not found"}</p>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "TBA";

  const handleRating = (rating: number) => {
    setUserRating(rating);
    // TODO: Send rating to backend
    console.log("User rated:", rating);
  };

  return (
    <div className="min-h-screen relative">
      {/* Backdrop Image */}
      {backdropUrl && (
        <div
          className="absolute top-0 left-0 right-0 h-[600px] bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full md:w-80 rounded-lg shadow-2xl"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {movie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
                  <span>{year}</span>
                  {movie.runtime && <span>• {movie.runtime} min</span>}
                </div>

                {/* Rating Section */}
                <div className="mb-6">
                  <div className="flex flex-col gap-3">
                    {/* Official Rating */}
                    {movie.vote_average && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">
                          Official Rating
                        </p>
                        <StarRating
                          rating={movie.vote_average}
                          maxRating={10}
                          size="large"
                          interactive={false}
                        />
                      </div>
                    )}

                    {/* User Rating */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Your Rating</p>
                      <StarRating
                        rating={userRating}
                        maxRating={10}
                        size="large"
                        interactive={true}
                        onRate={handleRating}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* OTT Platforms - moved to right */}
              {id && (
                <div className="shrink-0 max-w-[300px]">
                  <OTTSection movieId={Number(id)} />
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-4 py-2 bg-surface-light rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3">Overview</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cast Section */}
        {movie.credits?.cast && <CastList cast={movie.credits.cast} />}

        {/* Crew Section */}
        {movie.credits?.crew && <CrewList crew={movie.credits.crew} />}
      </div>
    </div>
  );
};

export default MovieDetailPage;
