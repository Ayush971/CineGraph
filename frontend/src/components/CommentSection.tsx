import React, { useState, useEffect, useCallback } from "react";
import { commentsAPI } from "../services/api";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import type { CommentTree } from "../types";

interface CommentSectionProps {
  movieTmdbId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ movieTmdbId }) => {
  const [comments, setComments] = useState<CommentTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "oldest" | "top">("newest");
  const [totalCount, setTotalCount] = useState(0);

  const fetchComments = useCallback(async () => {
    try {
      const [commentsRes, countRes] = await Promise.all([
        commentsAPI.getForMovie(movieTmdbId, sort),
        commentsAPI.getCount(movieTmdbId),
      ]);
      setComments(commentsRes.data);
      setTotalCount(countRes.data.count);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [movieTmdbId, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleNewComment = async (content: string) => {
    await commentsAPI.create(movieTmdbId, { content });
    await fetchComments();
  };

  const sortOptions: { value: "newest" | "oldest" | "top"; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "top", label: "Top" },
  ];

  return (
    <div className="mt-12 mb-8">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Discussion</h2>
          <span className="text-sm bg-white/10 text-gray-300 px-2.5 py-1 rounded-full font-medium">
            {totalCount} {totalCount === 1 ? "comment" : "comments"}
          </span>
          {totalCount >= 10 && (
            <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 animate-pulse">
              🔥 Trending
            </span>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-surface-light rounded-lg p-0.5 border border-white/5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sort === opt.value
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* New comment form */}
      <div className="mb-8">
        <CommentForm onSubmit={handleNewComment} />
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-surface-light/20 rounded-2xl border border-white/5">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-400 text-lg mb-1">No comments yet</p>
          <p className="text-gray-500 text-sm">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              movieTmdbId={movieTmdbId}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
