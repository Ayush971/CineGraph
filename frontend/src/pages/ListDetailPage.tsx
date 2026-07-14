import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { listsAPI, moviesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type {
  ListDetailResponse,
  ListItem,
  Movie,
} from "../types";

const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

const ListDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [list, setList] = useState<ListDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add-movie search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Share
  const [copied, setCopied] = useState(false);

  const isOwner = user && list && user.id === list.user_id;

  const fetchList = useCallback(async () => {
    if (!id) return;
    try {
      const res = await listsAPI.getDetail(parseInt(id));
      setList(res.data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("This list is private.");
      } else if (err?.response?.status === 404) {
        setError("List not found.");
      } else {
        setError("Failed to load list.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ========== SEARCH ==========
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await moviesAPI.search(query);
        setSearchResults(res.data.results.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleAddMovie = async (movie: Movie) => {
    if (!list) return;
    try {
      await listsAPI.addItem(list.id, { movie_id: movie.id });
      await fetchList();
      setSearchQuery("");
      setSearchResults([]);
      setShowSearch(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        alert("This movie is already in the list.");
      } else if (err?.response?.status === 404) {
        alert("Movie not found. Please try again.");
      }
    }
  };

  // ========== DRAG & DROP WITH AUTO-SCROLL ==========
  const scrollAnimRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(0);

  // Auto-scroll loop: runs every frame while dragging near edges
  const startAutoScroll = useCallback(() => {
    const tick = () => {
      if (scrollSpeedRef.current !== 0) {
        window.scrollBy(0, scrollSpeedRef.current);
      }
      scrollAnimRef.current = requestAnimationFrame(tick);
    };
    // Only start if not already running
    if (scrollAnimRef.current === null) {
      scrollAnimRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimRef.current !== null) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
    scrollSpeedRef.current = 0;
  }, []);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
    startAutoScroll();
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);

    // Auto-scroll when dragging near top/bottom of viewport
    const EDGE_SIZE = 100; // px from edge where scrolling kicks in
    const MAX_SPEED = 18;  // max scroll px per frame
    const mouseY = e.clientY;
    const viewportHeight = window.innerHeight;

    if (mouseY < EDGE_SIZE) {
      // Near top → scroll up (negative), faster the closer to edge
      scrollSpeedRef.current = -MAX_SPEED * (1 - mouseY / EDGE_SIZE);
    } else if (mouseY > viewportHeight - EDGE_SIZE) {
      // Near bottom → scroll down (positive)
      scrollSpeedRef.current = MAX_SPEED * (1 - (viewportHeight - mouseY) / EDGE_SIZE);
    } else {
      scrollSpeedRef.current = 0;
    }
  };

  const handleDrop = async (dropIdx: number) => {
    stopAutoScroll();

    if (dragIdx === null || !list || dragIdx === dropIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }

    // Reorder locally
    const newItems = [...list.items];
    const [moved] = newItems.splice(dragIdx, 1);
    newItems.splice(dropIdx, 0, moved);

    // Assign new ranks
    const reordered = newItems.map((item, i) => ({
      ...item,
      rank: i + 1,
    }));

    setList({ ...list, items: reordered });
    setDragIdx(null);
    setOverIdx(null);

    // Persist
    try {
      await listsAPI.reorderItems(
        list.id,
        reordered.map((item) => ({ item_id: item.id, rank: item.rank }))
      );
    } catch (err) {
      console.error("Reorder failed:", err);
      await fetchList(); // rollback
    }
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDragIdx(null);
    setOverIdx(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
  }, []);

  // ========== REMOVE ITEM ==========
  const handleRemoveItem = async (item: ListItem) => {
    if (!list) return;
    if (!confirm(`Remove "${item.movie.title}" from this list?`)) return;
    try {
      await listsAPI.removeItem(list.id, item.id);
      await fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  // ========== SHARE ==========
  const handleShare = () => {
    const url = `${window.location.origin}/lists/${list?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-5xl mb-2">🔒</div>
        <p className="text-xl text-gray-400">{error}</p>
        <Link
          to="/lists"
          className="text-primary hover:underline mt-2"
        >
          ← Back to My Lists
        </Link>
      </div>
    );
  }
  if (!list) return null;

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-10">
        <Link
          to="/lists"
          className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Back to Lists
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold">{list.title}</h1>
              {list.is_public ? (
                <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium shrink-0">
                  🌐 Public
                </span>
              ) : (
                <span className="text-xs bg-gray-500/15 text-gray-400 px-2.5 py-1 rounded-full border border-gray-500/20 font-medium shrink-0">
                  🔒 Private
                </span>
              )}
            </div>
            {list.description && (
              <p className="text-gray-400 mt-1 leading-relaxed max-w-2xl">
                {list.description}
              </p>
            )}
            <div className="text-sm text-gray-500 mt-2 flex items-center gap-3">
              <span>by {list.owner_username}</span>
              <span>•</span>
              <span>
                {list.items.length} {list.items.length === 1 ? "film" : "films"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {list.is_public && (
              <button
                onClick={handleShare}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
              >
                {copied ? "✅ Copied!" : "📤 Share"}
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-4 py-2.5 bg-primary hover:bg-tungsten-500 hover:shadow-glow text-void rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span className="text-base">+</span> Add Movie
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Movie Search */}
      {showSearch && isOwner && (
        <div className="mb-8 bg-slate-800/80 border border-white/10 rounded-2xl p-5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a movie to add..."
              autoFocus
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
              {searchResults.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleAddMovie(movie)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <img
                    src={
                      movie.poster_path
                        ? `${TMDB_IMG}${movie.poster_path}`
                        : "https://via.placeholder.com/40x60"
                    }
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded-md shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">
                      {movie.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {movie.release_date
                        ? new Date(movie.release_date).getFullYear()
                        : "TBA"}
                    </div>
                  </div>
                  <span className="ml-auto text-primary text-lg shrink-0">+</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      {list.items.length === 0 ? (
        <div className="text-center py-20 bg-surface-light/30 rounded-2xl border border-white/5">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-xl text-gray-400 mb-2">No movies yet</p>
          <p className="text-gray-500">
            {isOwner
              ? "Click 'Add Movie' above to start building your list!"
              : "This list is empty."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.items.map((item, idx) => (
            <div
              key={item.id}
              draggable={!!isOwner}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-4 bg-surface-light rounded-xl border transition-all duration-200 group ${
                dragIdx === idx
                  ? "opacity-40 border-primary/50 scale-[0.98]"
                  : overIdx === idx && dragIdx !== null
                  ? "border-primary/40 bg-primary/5"
                  : "border-white/5 hover:border-white/10"
              } ${isOwner ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Rank number */}
              <div className="text-2xl font-bold text-gray-600 w-10 text-center shrink-0 select-none">
                {item.rank}
              </div>

              {/* Drag handle (owner only) */}
              {isOwner && (
                <div className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 select-none">
                  ⠿
                </div>
              )}

              {/* Poster */}
              <Link to={`/movie/${item.movie.tmdb_id}`} className="shrink-0">
                <img
                  src={
                    item.movie.poster_path
                      ? `${TMDB_IMG}${item.movie.poster_path}`
                      : "https://via.placeholder.com/60x90"
                  }
                  alt={item.movie.title}
                  className="w-14 h-20 object-cover rounded-lg shadow-lg hover:opacity-80 transition-opacity"
                />
              </Link>

              {/* Movie info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/movie/${item.movie.tmdb_id}`}
                  className="text-lg font-semibold text-white hover:text-primary transition-colors truncate block"
                >
                  {item.movie.title}
                </Link>
                <div className="text-sm text-gray-400">
                  {item.movie.release_date
                    ? new Date(item.movie.release_date).getFullYear()
                    : "TBA"}
                  {item.movie.runtime
                    ? ` • ${Math.floor(item.movie.runtime / 60)}h ${item.movie.runtime % 60}m`
                    : ""}
                </div>
                {item.notes && (
                  <div className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                    {item.notes}
                  </div>
                )}
              </div>

              {/* Remove button (owner only) */}
              {isOwner && (
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Remove from list"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListDetailPage;
