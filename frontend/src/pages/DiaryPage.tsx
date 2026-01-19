import React, { useState, useEffect } from "react";
import { diaryAPI } from "../services/api";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import StarRating from "../components/StarRating";
import type { DiaryEntryResponse, DiaryStats } from "../types";

const DiaryPage: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntryResponse[]>([]);
  const [stats, setStats] = useState<DiaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entriesRes, statsRes] = await Promise.all([
          diaryAPI.getAll({ limit: 50, sort_by: "date_desc" }),
          diaryAPI.getStats(),
        ]);
        setEntries(entriesRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError("Failed to fetch diary entries");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-8">My Diary</h1>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-light p-6 rounded-xl border border-white/5">
              <div className="text-3xl font-bold text-primary mb-1">
                {stats.total_movies}
              </div>
              <div className="text-sm text-gray-400">Movies Watched</div>
            </div>
            <div className="bg-surface-light p-6 rounded-xl border border-white/5">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {stats.films_this_year}
              </div>
              <div className="text-sm text-gray-400">This Year</div>
            </div>
            <div className="bg-surface-light p-6 rounded-xl border border-white/5">
              <div className="text-3xl font-bold text-yellow-500 mb-1">
                {stats.average_rating?.toFixed(1) || "-"}
              </div>
              <div className="text-sm text-gray-400">Avg Rating</div>
            </div>
            <div className="bg-surface-light p-6 rounded-xl border border-white/5">
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {stats.total_rewatches}
              </div>
              <div className="text-sm text-gray-400">Rewatches</div>
            </div>
          </div>
        )}
      </div>

      {/* Entries List */}
      <div>
        {entries.length === 0 ? (
          <div className="text-center py-20 bg-surface-light/30 rounded-xl">
            <p className="text-xl text-gray-400">
              No entries yet. Go watch some movies!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-6 p-6 bg-surface-light rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* Poster */}
                <Link
                  to={`/movie/${entry.movie.tmdb_id}`}
                  className="shrink-0 w-24 md:w-32"
                >
                  <img
                    src={
                      entry.movie.poster_path
                        ? `https://image.tmdb.org/t/p/w200${entry.movie.poster_path}`
                        : "https://via.placeholder.com/200x300"
                    }
                    alt={entry.movie.title}
                    className="w-full rounded-lg shadow-lg hover:opacity-80 transition-opacity"
                  />
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold truncate pr-4">
                        <Link
                          to={`/movie/${entry.movie.tmdb_id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {entry.movie.title}
                        </Link>
                      </h3>
                      <div className="text-sm text-gray-400">
                        {entry.movie.release_date
                          ? new Date(entry.movie.release_date).getFullYear()
                          : "TBA"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm text-gray-400 font-medium">
                        {new Date(entry.watched_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                      {entry.is_rewatch && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                          Rewatch
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {entry.rating && (
                    <div className="mb-3">
                      <StarRating
                        rating={entry.rating}
                        maxRating={10}
                        size="small"
                        interactive={false}
                      />
                    </div>
                  )}

                  {/* Review */}
                  {entry.review && (
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      "{entry.review}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryPage;
