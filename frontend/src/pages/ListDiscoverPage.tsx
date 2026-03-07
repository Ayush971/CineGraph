import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { listsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import type { MovieList } from "../types";

const ListDiscoverPage: React.FC = () => {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLists = async (search?: string) => {
    try {
      const res = await listsAPI.discover({
        limit: 30,
        search: search || undefined,
      });
      setLists(res.data);
    } catch (err) {
      setError("Failed to load lists");
      console.error(err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      fetchLists(query);
    }, 400);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/lists"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← My Lists
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">Discover Lists</h1>
        <p className="text-gray-400">
          Browse popular public lists created by the community
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 relative max-w-xl">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search lists by title..."
          className="w-full px-5 py-3.5 bg-surface-light border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors pl-11"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          🔍
        </span>
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-center mb-6">{error}</p>
      )}

      {/* Results */}
      {lists.length === 0 ? (
        <div className="text-center py-20 bg-surface-light/30 rounded-2xl border border-white/5">
          <div className="text-5xl mb-4">🌐</div>
          <p className="text-xl text-gray-400 mb-2">
            {searchQuery ? "No lists found" : "No public lists yet"}
          </p>
          <p className="text-gray-500">
            {searchQuery
              ? "Try a different search term"
              : "Be the first to create and share a public list!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="group bg-surface-light rounded-2xl border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden block"
            >
              {/* Gradient top */}
              <div className="h-1 bg-gradient-to-r from-emerald-500/60 via-blue-500/60 to-purple-500/60 opacity-40 group-hover:opacity-100 transition-opacity" />

              <div className="p-6">
                {/* Meta */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">
                    {list.item_count}{" "}
                    {list.item_count === 1 ? "film" : "films"}
                  </span>
                  <span className="text-xs text-gray-500">
                    by {list.owner_username}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors mb-2 line-clamp-1">
                  {list.title}
                </h3>

                {/* Description */}
                {list.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                    {list.description}
                  </p>
                )}

                {/* Date */}
                <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-500">
                  Created{" "}
                  {new Date(list.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListDiscoverPage;
