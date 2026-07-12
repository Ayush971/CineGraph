import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { socialAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import FollowButton from "../components/FollowButton";
import LoadingSpinner from "../components/LoadingSpinner";
import type { UserProfile, FollowUser } from "../types";

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    if (!id) return;
    try {
      const [profileRes, followersRes, followingRes] = await Promise.all([
        socialAPI.getProfile(parseInt(id)),
        socialAPI.getFollowers(parseInt(id)),
        socialAPI.getFollowing(parseInt(id)),
      ]);
      setProfile(profileRes.data);
      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("User not found");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [id]);

  const handleFollowToggle = (nowFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        is_following: nowFollowing,
        follower_count: profile.follower_count + (nowFollowing ? 1 : -1),
      });
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-5xl">👤</div>
        <p className="text-xl text-gray-400">{error}</p>
      </div>
    );
  }
  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-16">
      {/* Profile header */}
      <div className="bg-surface-light rounded-2xl border border-white/5 p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/60 to-purple-600/60 flex items-center justify-center text-white font-bold text-3xl shrink-0 ring-4 ring-white/5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start mb-2">
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              {!isOwnProfile && (
                <FollowButton
                  userId={profile.id}
                  initialFollowing={profile.is_following}
                  onToggle={handleFollowToggle}
                />
              )}
            </div>

            {profile.bio && (
              <p className="text-gray-400 mb-4 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 justify-center sm:justify-start">
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {profile.total_movies_watched}
                </div>
                <div className="text-xs text-gray-500">Movies</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {profile.total_lists}
                </div>
                <div className="text-xs text-gray-500">Lists</div>
              </div>
              <button
                onClick={() => setActiveTab("followers")}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <div className="text-xl font-bold text-white">
                  {profile.follower_count}
                </div>
                <div className="text-xs text-gray-500">Followers</div>
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <div className="text-xl font-bold text-white">
                  {profile.following_count}
                </div>
                <div className="text-xs text-gray-500">Following</div>
              </button>
            </div>

            <div className="text-xs text-gray-600 mt-3">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links for own profile */}
      {isOwnProfile && (
        <div className="flex gap-3 mb-8">
          <Link
            to="/achievements"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-light rounded-xl border border-white/5 hover:border-yellow-400/30 transition-all group"
          >
            <span className="text-lg">🏆</span>
            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
              Achievements
            </span>
          </Link>
          <Link
            to="/analytics"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-light rounded-xl border border-white/5 hover:border-blue-400/30 transition-all group"
          >
            <span className="text-lg">📊</span>
            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
              Analytics
            </span>
          </Link>
          <Link
            to="/year-in-review"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-light rounded-xl border border-white/5 hover:border-purple-400/30 transition-all group"
          >
            <span className="text-lg">🎬</span>
            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
              Year in Review
            </span>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light rounded-lg p-0.5 border border-white/5 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("followers")}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "followers"
              ? "bg-white/10 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "following"
              ? "bg-white/10 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {/* User list */}
      {(activeTab === "followers" ? followers : following).length === 0 ? (
        <div className="text-center py-12 bg-surface-light/20 rounded-2xl border border-white/5">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-400">
            {activeTab === "followers"
              ? "No followers yet"
              : "Not following anyone yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(activeTab === "followers" ? followers : following).map((u) => (
            <Link
              key={u.id}
              to={`/user/${u.id}`}
              className="flex items-center gap-4 p-4 bg-surface-light rounded-xl border border-white/5 hover:border-white/15 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/50 to-purple-600/50 flex items-center justify-center text-white font-bold shrink-0">
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt={u.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  u.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold group-hover:text-primary transition-colors truncate">
                  {u.username}
                </div>
                {u.bio && (
                  <p className="text-sm text-gray-500 truncate">{u.bio}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
