import React, { useState } from "react";
import { socialAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface FollowButtonProps {
  userId: number;
  initialFollowing: boolean;
  onToggle?: (following: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialFollowing,
  onToggle,
}) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (!user || user.id === userId) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await socialAPI.unfollow(userId);
        setFollowing(false);
        onToggle?.(false);
      } else {
        await socialAPI.follow(userId);
        setFollowing(true);
        onToggle?.(true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
        following
          ? "bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
          : "bg-primary hover:bg-tungsten-500 hover:shadow-glow text-void"
      } disabled:opacity-50`}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      ) : following ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
};

export default FollowButton;
