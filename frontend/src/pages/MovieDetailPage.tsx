import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { moviesAPI, diaryAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import StarRating from "../components/StarRating";
import CastList from "../components/CastList";
import CrewList from "../components/CrewList";
import OTTSection from "../components/OTTSection";
import DiaryEntryModal from "../components/DiaryEntryModal";
import type { MovieDetail, MovieLogStatus } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(0);

  // Diary State
  const [logStatus, setLogStatus] = useState<MovieLogStatus | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Fetch movie details
      const movieRes = await moviesAPI.getDetails(Number(id));
      setMovie(movieRes.data);

      // Fetch log status if user is logged in
      if (user) {
        const logRes = await diaryAPI.getForMovie(Number(id));
        setLogStatus(logRes.data);
        // Update user rating if there's a latest rating
        if (logRes.data.latest && logRes.data.latest.rating) {
          setUserRating(logRes.data.latest.rating);
        }
      }
    } catch (err) {
      setError("Failed to fetch movie details");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleLogSuccess = () => {
    // Refresh log status
    if (id && user) {
      diaryAPI.getForMovie(Number(id)).then((res) => {
        setLogStatus(res.data);
        // Update user rating locally
        if (res.data.latest && res.data.latest.rating) {
          setUserRating(res.data.latest.rating);
        }
      });
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await diaryAPI.delete(entryId);
        handleLogSuccess();
      } catch (err) {
        console.error("Failed to delete entry:", err);
      }
    }
  };

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setShowLogModal(true);
  };

  const handleRating = (rating: number) => {
    // Open modal with this rating pre-selected
    setUserRating(rating);
    setSelectedEntry({ rating: rating }); // Pass initial rating
    setShowLogModal(true);
  };

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
                      <div
                        onClick={() => !user && alert("Please login to rate")}
                      >
                        <StarRating
                          rating={userRating}
                          maxRating={10}
                          size="large"
                          interactive={!!user}
                          onRate={handleRating}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* OTT Platforms & Log Button */}
              <div className="shrink-0 max-w-[300px] flex flex-col gap-4">
                {id && <OTTSection movieId={Number(id)} />}

                {/* Log Button */}
                {user && (
                  <button
                    onClick={() => {
                      setSelectedEntry(null); // Clear selection for new entry
                      setShowLogModal(true);
                    }}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>📝</span>
                    {logStatus?.logged ? "Log Another Watch" : "Log Movie"}
                  </button>
                )}
              </div>
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

            {/* Your Logs Section */}
            {user && logStatus && logStatus.entries.length > 0 && (
              <div className="mb-8 p-6 bg-surface-light/50 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Your Activity</h2>
                  <div className="text-sm text-gray-400">
                    {logStatus.entries.length}{" "}
                    {logStatus.entries.length === 1 ? "entry" : "entries"}
                  </div>
                </div>

                <div className="space-y-4">
                  {logStatus.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-surface p-4 rounded-lg flex flex-col gap-3 border border-white/5"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">
                            {new Date(entry.watched_date).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                          {entry.is_rewatch && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                              Rewatch
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-gray-400 hover:text-red-400 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* User's Rating for this entry */}
                      {entry.rating && (
                        <div className="flex items-center gap-1">
                          <StarRating
                            rating={entry.rating}
                            maxRating={10}
                            size="small"
                            interactive={false}
                          />
                        </div>
                      )}

                      {/* User's Review */}
                      {entry.review && (
                        <p className="text-gray-300 italic text-sm border-l-2 border-gray-600 pl-3">
                          "{entry.review}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cast Section */}
        {movie.credits?.cast && <CastList cast={movie.credits.cast} />}

        {/* Crew Section */}
        {movie.credits?.crew && <CrewList crew={movie.credits.crew} />}
      </div>

      {/* Diary Modal */}
      {movie && (
        <DiaryEntryModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          movieId={movie.id}
          movieTitle={movie.title}
          existingEntry={selectedEntry}
          onSuccess={handleLogSuccess}
        />
      )}
    </div>
  );
};

export default MovieDetailPage;
