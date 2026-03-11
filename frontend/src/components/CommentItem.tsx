import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { commentsAPI } from "../services/api";
import CommentForm from "./CommentForm";
import LikeButton from "./LikeButton";
import type { CommentTree } from "../types";
import { Link } from "react-router-dom";

// Reddit-style depth colors for thread lines
const DEPTH_COLORS = [
  "border-blue-500/40",
  "border-purple-500/40",
  "border-emerald-500/40",
  "border-amber-500/40",
  "border-rose-500/40",
  "border-cyan-500/40",
  "border-pink-500/40",
  "border-lime-500/40",
  "border-indigo-500/40",
  "border-orange-500/40",
];

interface CommentItemProps {
  comment: CommentTree;
  movieTmdbId: number;
  depth?: number;
  onRefresh: () => void;
}

const MAX_DISPLAY_DEPTH = 8;

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
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  movieTmdbId,
  depth = 0,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const isAuthor = user && user.id === comment.user_id;
  const borderColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  const handleReply = async (content: string) => {
    await commentsAPI.create(movieTmdbId, {
      content,
      parent_id: comment.id,
    });
    setShowReply(false);
    onRefresh();
  };

  const handleEdit = async () => {
    if (!editContent.trim() || saving) return;
    setSaving(true);
    try {
      await commentsAPI.update(comment.id, { content: editContent.trim() });
      setEditing(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment? This will also delete all replies."))
      return;
    await commentsAPI.delete(comment.id);
    onRefresh();
  };

  if (collapsed) {
    return (
      <div
        className={`${depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor}` : ""}`}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors group"
        >
          <span className="text-gray-600 group-hover:text-gray-400">
            [+]
          </span>
          <span className="font-medium text-gray-400">
            {comment.author.username}
          </span>
          <span>
            {comment.reply_count} {comment.reply_count === 1 ? "reply" : "replies"}
          </span>
          <span>•</span>
          <span>{timeAgo(comment.created_at)}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor} hover:border-l-2` : ""}`}
    >
      <div className="py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Avatar */}
          <Link
            to={`/user/${comment.author.id}`}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/50 to-purple-600/50 flex items-center justify-center text-white font-bold text-[10px] shrink-0 hover:ring-2 hover:ring-primary/30 transition-all"
          >
            {comment.author.username.charAt(0).toUpperCase()}
          </Link>

          <Link
            to={`/user/${comment.author.id}`}
            className="text-sm font-semibold text-gray-200 hover:text-white transition-colors"
          >
            {comment.author.username}
          </Link>

          {isAuthor && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
              YOU
            </span>
          )}

          <span className="text-xs text-gray-600">•</span>
          <span className="text-xs text-gray-500">
            {timeAgo(comment.created_at)}
          </span>
          {comment.is_edited && (
            <span className="text-xs text-gray-600 italic">(edited)</span>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50 resize-none"
              rows={3}
              maxLength={5000}
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={handleEdit}
                disabled={saving}
                className="px-3 py-1 text-xs bg-primary hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-2">
            {comment.content}
          </p>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-3">
          <LikeButton
            targetType="comment"
            targetId={comment.id}
            initialLiked={comment.user_liked}
            initialCount={comment.like_count}
            compact
          />

          {user && depth < MAX_DISPLAY_DEPTH && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              💬 Reply
            </button>
          )}

          {depth >= MAX_DISPLAY_DEPTH && comment.replies.length > 0 && (
            <span className="text-xs text-primary">
              Continue thread →
            </span>
          )}

          <button
            onClick={() => setCollapsed(true)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            title="Collapse"
          >
            [−]
          </button>

          {isAuthor && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="mt-3">
            <CommentForm
              onSubmit={handleReply}
              placeholder={`Reply to ${comment.author.username}...`}
              buttonText="Reply"
              autoFocus
              onCancel={() => setShowReply(false)}
              compact
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {depth < MAX_DISPLAY_DEPTH && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              movieTmdbId={movieTmdbId}
              depth={depth + 1}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
