import React, { useState, useEffect } from "react";
import { achievementsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import type { AchievementProgress } from "../types";

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-500",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-cyan-300 to-blue-500",
};

const TIER_BORDER: Record<string, string> = {
  bronze: "border-amber-700/40",
  silver: "border-gray-400/40",
  gold: "border-yellow-400/40",
  platinum: "border-cyan-400/40",
};

const TIER_GLOW: Record<string, string> = {
  bronze: "shadow-amber-700/20",
  silver: "shadow-gray-400/20",
  gold: "shadow-yellow-400/30",
  platinum: "shadow-cyan-400/40",
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  general: "General",
  diary: "Diary",
  genre: "Genres",
  actor: "People",
};

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await achievementsAPI.getAll();
        setAchievements(res.data);
      } catch (err) {
        setError("Failed to load achievements");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? achievements
      : achievements.filter((a) => a.achievement.category === filter);

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Achievements</h1>
        <p className="text-gray-400 text-lg">
          <span className="text-primary font-bold">{earnedCount}</span> /{" "}
          {achievements.length} unlocked
        </p>

        {/* Progress bar */}
        <div className="mt-4 w-full max-w-md bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full transition-all duration-1000"
            style={{
              width: `${(earnedCount / achievements.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 bg-surface-light rounded-lg p-0.5 border border-white/5 mb-8 w-fit flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              filter === key
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const ach = item.achievement;
          const pct =
            item.target > 0
              ? Math.min((item.current / item.target) * 100, 100)
              : 0;

          return (
            <div
              key={ach.id}
              className={`relative p-5 rounded-xl border transition-all duration-300 ${
                item.earned
                  ? `${TIER_BORDER[ach.tier]} ${TIER_GLOW[ach.tier]} shadow-lg bg-surface-light`
                  : "border-white/5 bg-surface-light/50 opacity-70"
              } ${item.earned ? "hover:scale-[1.02]" : "hover:opacity-90"}`}
            >
              {/* Tier badge */}
              {item.earned && (
                <div
                  className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${TIER_COLORS[ach.tier]} text-white shadow-md`}
                >
                  {ach.tier}
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`text-3xl w-12 h-12 flex items-center justify-center rounded-lg shrink-0 ${
                    item.earned
                      ? "bg-white/10"
                      : "bg-white/5 grayscale"
                  }`}
                >
                  {ach.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-bold text-base truncate ${
                      item.earned ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {ach.title}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      item.earned ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {ach.description}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={item.earned ? "text-green-400" : "text-gray-500"}>
                        {item.earned ? "✓ Unlocked" : item.progress_text}
                      </span>
                      {!item.earned && (
                        <span className="text-gray-600">{Math.round(pct)}%</span>
                      )}
                    </div>
                    {!item.earned && (
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    {item.earned && item.earned_at && (
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(item.earned_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No achievements in this category.
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
