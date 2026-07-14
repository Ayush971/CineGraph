import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { moviesAPI, diaryAPI, API_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAmbientColor } from "../hooks/useAmbientColor";
import LoadingSpinner from "../components/LoadingSpinner";
import StarRating from "../components/StarRating";
import CastList from "../components/CastList";
import CrewList from "../components/CrewList";
import OTTSection from "../components/OTTSection";
import DiaryEntryModal from "../components/DiaryEntryModal";
import CommentSection from "../components/CommentSection";
import MovieCard from "../components/MovieCard";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import type { MovieDetail, MovieLogStatus, Movie } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** Slate-style section header: mono scene label + display title */
const SectionSlate: React.FC<{ label: string; title: string }> = ({
  label,
  title,
}) => (
  <div className="mb-6">
    <p className="meta !text-tungsten-300 mb-1.5">{label}</p>
    <h2 className="font-display font-semibold text-2xl">{title}</h2>
  </div>
);

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  // Diary State
  const [logStatus, setLogStatus] = useState<MovieLogStatus | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Ambient: sample the poster through the CORS-clean proxy
  const ambient = useAmbientColor(
    movie?.poster_path
      ? `${API_BASE_URL}/movies/poster-img/w92/${movie.poster_path.replace("/", "")}`
      : null
  );

  // Parallax backdrop
  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 600], [0, 160]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Fetch movie details
      const movieRes = await moviesAPI.getDetails(Number(id));
      setMovie(movieRes.data);

      // Fetch related films (non-blocking — failure shouldn't break the page)
      moviesAPI
        .getRecommendations(Number(id))
        .then((res) => setRecommendations(res.data.results as Movie[]))
        .catch(() => setRecommendations([]));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <p className="meta !text-danger">Reel Missing</p>
        <p className="text-ink-mute text-lg">{error || "Movie not found"}</p>
      </div>
    );
  }

  // w1280 is visually identical in a 44vh hero and several MB lighter than /original
  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "TBA";

  return (
    <div
      className="min-h-screen"
      style={
        ambient
          ? ({ "--color-ambient": ambient } as React.CSSProperties)
          : undefined
      }
    >
      {/* ====================== Parallax backdrop ====================== */}
      <div className="relative h-[44vh] min-h-[320px] -mb-44 overflow-hidden">
        {backdropUrl ? (
          <motion.div
            style={{ y: backdropY }}
            className="absolute inset-0 scale-110"
          >
            <img
              src={backdropUrl}
              alt=""
              className="w-full h-full object-cover object-top"
              aria-hidden="true"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-ambient)]" />
        )}
        {/* Ambient tint — the room takes the film's color */}
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--color-ambient) 100%)",
          }}
        />
        {/* Fade into the void */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/30 to-void" />
      </div>

      {/* ========================== Content ========================== */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col md:flex-row gap-10">
          {/* ---- Poster + actions column ---- */}
          <div className="shrink-0 w-64 mx-auto md:w-72 md:mx-0">
            <div className="relative">
              {/* Ambient glow behind the poster */}
              <div
                className="absolute -inset-4 rounded-[24px] blur-2xl opacity-50"
                style={{ background: "var(--color-ambient)" }}
                aria-hidden="true"
              />
              <motion.img
                layoutId={`poster-${movie.id}`}
                src={posterUrl}
                alt={movie.title}
                className="relative w-full rounded-[10px] shadow-[var(--shadow-lift)] ring-1 ring-line-strong"
              />
            </div>

            {/* Log action */}
            {user && (
              <Button
                size="lg"
                magnetic
                className="w-full mt-6"
                onClick={() => {
                  setSelectedEntry(null); // Clear selection for new entry
                  setShowLogModal(true);
                }}
              >
                {logStatus?.logged ? "Log Another Watch" : "Log This Film"}
              </Button>
            )}

            {/* Where to watch */}
            <div className="mt-6">{id && <OTTSection movieId={Number(id)} />}</div>
          </div>

          {/* ---- Info column ---- */}
          <div className="flex-1 md:pt-32">
            {/* Slate line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="meta !text-ink-mute mb-3"
            >
              {year}
              {movie.runtime ? ` · ${movie.runtime} MIN` : ""}
              {movie.vote_average
                ? ` · TMDB ${movie.vote_average.toFixed(1)}`
                : ""}
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-bold text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.015em] mb-5"
            >
              {movie.title}
            </motion.h1>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {movie.genres.map((genre) => (
                  <Badge key={genre.id} variant="genre">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Ratings */}
            <div className="flex flex-col sm:flex-row gap-8 mb-8 p-5 bg-surface/70 border border-line rounded-2xl backdrop-blur-sm">
              {movie.vote_average ? (
                <div>
                  <p className="meta mb-2">Official Rating</p>
                  <StarRating
                    rating={movie.vote_average}
                    maxRating={10}
                    size="medium"
                    interactive={false}
                  />
                </div>
              ) : null}

              <div>
                <p className="meta mb-2">Your Rating</p>
                <div onClick={() => !user && alert("Please login to rate")}>
                  <StarRating
                    rating={userRating}
                    maxRating={10}
                    size="medium"
                    interactive={!!user}
                    onRate={handleRating}
                  />
                </div>
              </div>
            </div>

            {/* Overview */}
            {movie.overview && (
              <div className="mb-10">
                <p className="meta mb-2">Synopsis</p>
                <p className="text-ink-mute text-lg leading-relaxed max-w-3xl">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Your Activity */}
            {user && logStatus && logStatus.entries.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-end mb-5">
                  <SectionSlate label="Log Sheet" title="Your Activity" />
                  <span className="meta mb-6">
                    {logStatus.entries.length}{" "}
                    {logStatus.entries.length === 1 ? "Entry" : "Entries"}
                  </span>
                </div>

                <div className="space-y-3 -mt-4">
                  {logStatus.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-line-strong transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="meta !text-ink">
                            {new Date(entry.watched_date).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          {entry.is_rewatch && (
                            <Badge variant="daylight">Rewatch</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="px-2.5 py-1 text-xs rounded-md text-ink-mute hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="px-2.5 py-1 text-xs rounded-md text-ink-mute hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* User's Rating for this entry */}
                      {entry.rating && (
                        <StarRating
                          rating={entry.rating}
                          maxRating={10}
                          size="small"
                          interactive={false}
                        />
                      )}

                      {/* User's Review */}
                      {entry.review && (
                        <p className="text-ink-mute italic text-sm border-l-2 border-tungsten-400/40 pl-3">
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

        {/* Comments / Discussion Section */}
        {id && <CommentSection movieTmdbId={Number(id)} />}

        {/* Related Films */}
        {recommendations.length > 0 && (
          <div className="mt-14">
            <SectionSlate label="Double Feature" title="Related Films" />
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {recommendations.map((rec) => (
                <div key={rec.id} className="shrink-0 w-36">
                  <MovieCard movie={rec} />
                </div>
              ))}
            </div>
          </div>
        )}
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
