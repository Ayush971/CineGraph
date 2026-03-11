import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { socialAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { ActivityItem } from "../types";

const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

const ACTIVITY_ICONS: Record<string, string> = {
  watched: "👁️",
  reviewed: "✍️",
  listed: "📋",
  commented: "💬",
};

const ACTIVITY_LABELS: Record<string, string> = {
  watched: "watched",
  reviewed: "reviewed",
  listed: "added to a list",
  commented: "commented on",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ActivityFeedPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const fetchFeed = async (skip: number = 0) => {
    try {
      const res = await socialAPI.getFeed({ skip, limit: 20 });
      if (skip === 0) {
        setItems(res.data.items);
      } else {
        setItems((prev) => [...prev, ...res.data.items]);
      }
      setHasMore(res.data.has_more);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchFeed(0);
    else setLoading(false);
  }, [user]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage * 20);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">📡</div>
        <p className="text-xl text-gray-400">
          Log in to see what your friends are watching
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-primary hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Activity Feed</h1>
        <p className="text-gray-400">
          See what people you follow have been watching
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-surface-light/30 rounded-2xl border border-white/5">
          <div className="text-5xl mb-4">🌟</div>
          <p className="text-xl text-gray-400 mb-2">Your feed is empty</p>
          <p className="text-gray-500 mb-6">
            Follow other users to see their activity here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={`${item.type}-${item.movie_id}-${item.timestamp}-${idx}`}
              className="flex items-start gap-4 p-4 bg-surface-light rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
            >
              {/* Movie poster */}
              <Link to={`/movie/${item.movie_id}`} className="shrink-0">
                <img
                  src={
                    item.movie_poster
                      ? `${TMDB_IMG}${item.movie_poster}`
                      : "https://via.placeholder.com/60x90"
                  }
                  alt={item.movie_title}
                  className="w-14 h-20 object-cover rounded-lg shadow-lg group-hover:opacity-80 transition-opacity"
                />
              </Link>

              <div className="flex-1 min-w-0">
                {/* Activity line */}
                <div className="flex items-center gap-1.5 flex-wrap text-sm mb-1">
                  <span className="text-base">
                    {ACTIVITY_ICONS[item.type] || "📌"}
                  </span>
                  <Link
                    to={`/user/${item.user.id}`}
                    className="font-semibold text-white hover:text-primary transition-colors"
                  >
                    {item.user.username}
                  </Link>
                  <span className="text-gray-400">
                    {ACTIVITY_LABELS[item.type] || item.type}
                  </span>
                  <Link
                    to={`/movie/${item.movie_id}`}
                    className="font-medium text-white hover:text-primary transition-colors truncate"
                  >
                    {item.movie_title}
                  </Link>
                </div>

                {/* Detail */}
                {item.detail && (
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                    {item.detail}
                  </p>
                )}

                {/* Timestamp */}
                <span className="text-xs text-gray-600 mt-1 block">
                  {timeAgo(item.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 bg-surface-light hover:bg-surface-light/80 text-gray-400 hover:text-white rounded-xl transition-colors text-sm font-medium border border-white/5"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeedPage;
