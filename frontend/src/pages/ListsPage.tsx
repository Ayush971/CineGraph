import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import CreateListModal from "../components/CreateListModal";
import type { MovieList, MovieListCreate, MovieListUpdate } from "../types";

const ListsPage: React.FC = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<MovieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<MovieList | null>(null);

  const fetchLists = async () => {
    try {
      const res = await listsAPI.getMyLists();
      setLists(res.data);
    } catch (err) {
      setError("Failed to load your lists");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLists();
  }, [user]);

  const handleSave = async (
    data: MovieListCreate | MovieListUpdate,
    listId?: number
  ) => {
    if (listId) {
      await listsAPI.update(listId, data as MovieListUpdate);
    } else {
      await listsAPI.create(data as MovieListCreate);
    }
    await fetchLists();
  };

  const handleDelete = async (listId: number) => {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    try {
      await listsAPI.delete(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl text-gray-400">
          Please log in to create and manage lists.
        </p>
        <Link
          to="/login"
          className="px-6 py-3 bg-primary hover:bg-red-700 text-white rounded-xl transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">My Lists</h1>
          <p className="text-gray-400 mt-1">
            {lists.length} {lists.length === 1 ? "list" : "lists"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/lists/discover"
            className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            <span>🔍</span> Discover
          </Link>
          <button
            onClick={() => {
              setEditingList(null);
              setModalOpen(true);
            }}
            className="px-5 py-3 bg-primary hover:bg-red-700 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            <span className="text-lg">+</span> New List
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-center mb-6">{error}</p>
      )}

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="text-center py-24 bg-surface-light/30 rounded-2xl border border-white/5">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-xl text-gray-400 mb-2">No lists yet</p>
          <p className="text-gray-500 mb-6">
            Create your first list to start ranking movies!
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-primary hover:bg-red-700 text-white rounded-xl transition-colors"
          >
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div
              key={list.id}
              className="group relative bg-surface-light rounded-2xl border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden"
            >
              {/* Top accent gradient */}
              <div className="h-1 bg-gradient-to-r from-primary/80 via-purple-500/60 to-blue-500/40 opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-6">
                {/* Badges row */}
                <div className="flex items-center gap-2 mb-3">
                  {list.is_public ? (
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                      🌐 Public
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-500/15 text-gray-400 px-2.5 py-1 rounded-full border border-gray-500/20 font-medium">
                      🔒 Private
                    </span>
                  )}
                  <span className="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">
                    {list.item_count} {list.item_count === 1 ? "film" : "films"}
                  </span>
                </div>

                {/* Title */}
                <Link to={`/lists/${list.id}`}>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors mb-2 line-clamp-1">
                    {list.title}
                  </h3>
                </Link>

                {/* Description */}
                {list.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {list.description}
                  </p>
                )}
                {!list.description && <div className="mb-4" />}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-gray-500">
                    {new Date(list.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingList(list);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-white transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(list.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateListModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingList(null);
        }}
        onSave={handleSave}
        editList={editingList}
      />
    </div>
  );
};

export default ListsPage;
