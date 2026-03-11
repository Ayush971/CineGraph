import React, { useState } from "react";

interface LikeButtonProps {
  targetType: string;
  targetId: number;
  initialLiked: boolean;
  initialCount: number;
  onToggle?: (liked: boolean, count: number) => void;
  compact?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  targetType,
  targetId,
  initialLiked,
  initialCount,
  onToggle,
  compact = false,
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const handleToggle = async () => {
    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    setLiked(newLiked);
    setCount(newCount);

    if (newLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    try {
      const { likesAPI } = await import("../services/api");
      const res = await likesAPI.toggle(targetType, targetId);
      setLiked(res.data.liked);
      setCount(res.data.like_count);
      onToggle?.(res.data.liked, res.data.like_count);
    } catch {
      // Rollback
      setLiked(liked);
      setCount(count);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 transition-all duration-200 group ${
        compact ? "text-xs" : "text-sm"
      } ${
        liked
          ? "text-red-400"
          : "text-gray-500 hover:text-red-400"
      }`}
      title={liked ? "Unlike" : "Like"}
    >
      <span
        className={`transition-transform duration-200 ${
          animating ? "scale-125" : "scale-100"
        }`}
      >
        {liked ? "❤️" : "🤍"}
      </span>
      {count > 0 && (
        <span className="font-medium">{count}</span>
      )}
    </button>
  );
};

export default LikeButton;
