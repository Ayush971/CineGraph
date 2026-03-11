import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  placeholder = "Share your thoughts on this movie...",
  buttonText = "Comment",
  autoFocus = false,
  onCancel,
  compact = false,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className={`bg-surface-light/50 rounded-xl border border-white/5 p-4 text-center ${compact ? "py-3" : "py-6"}`}>
        <p className="text-gray-400 text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>{" "}
          to join the discussion
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`${compact ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"} rounded-full bg-gradient-to-br from-primary/60 to-purple-600/60 flex items-center justify-center text-white font-bold shrink-0`}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            maxLength={5000}
            rows={compact ? 2 : 3}
            className={`w-full px-4 py-3 bg-surface-light border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none ${compact ? "text-sm" : ""}`}
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">
              {content.length}/5000
            </span>
            <div className="flex gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="px-4 py-1.5 bg-primary hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {submitting ? "Posting..." : buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
