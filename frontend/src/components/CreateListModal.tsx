import React, { useState, useEffect } from "react";
import type { MovieList, MovieListCreate, MovieListUpdate } from "../types";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MovieListCreate | MovieListUpdate, listId?: number) => Promise<void>;
  editList?: MovieList | null;
}

const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editList,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editList) {
      setTitle(editList.title);
      setDescription(editList.description || "");
      setIsPublic(editList.is_public);
    } else {
      setTitle("");
      setDescription("");
      setIsPublic(false);
    }
  }, [editList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editList) {
        await onSave(
          { title: title.trim(), description: description.trim() || undefined, is_public: isPublic },
          editList.id
        );
      } else {
        await onSave({
          title: title.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in">
        {/* Header gradient */}
        <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-2xl font-bold text-white">
            {editList ? "Edit List" : "Create New List"}
          </h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MCU: Ranked"
              maxLength={255}
              autoFocus
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list about?"
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-900/40 rounded-xl border border-white/5">
            <div>
              <div className="text-sm font-medium text-white">
                {isPublic ? "🌐 Public" : "🔒 Private"}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {isPublic
                  ? "Anyone can discover and view this list"
                  : "Only you can see this list"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                isPublic ? "bg-primary" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  isPublic ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="flex-1 px-4 py-3 bg-primary hover:bg-tungsten-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
            >
              {saving ? "Saving..." : editList ? "Save Changes" : "Create List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListModal;
