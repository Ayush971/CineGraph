import React, { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import type { AnalyticsOverview } from "../types";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const GENRE_COLORS = [
  "#e50914", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
  "#6366f1", "#14b8a6", "#a855f7", "#22c55e", "#eab308",
];

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsAPI.getOverview();
        setData(res.data);
      } catch (err) {
        setError("Failed to load analytics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  const pieData = {
    labels: data.genres.map((g) => g.genre),
    datasets: [
      {
        data: data.genres.map((g) => g.count),
        backgroundColor: GENRE_COLORS.slice(0, data.genres.length),
        borderColor: "transparent",
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const monthlyData = {
    labels: data.monthly.map((m) => m.label),
    datasets: [
      {
        label: "Movies",
        data: data.monthly.map((m) => m.count),
        backgroundColor: "#e50914",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const decadeData = {
    labels: data.decades.map((d) => d.decade),
    datasets: [
      {
        label: "Movies",
        data: data.decades.map((d) => d.count),
        backgroundColor: data.decades.map(
          (_, i) => GENRE_COLORS[i % GENRE_COLORS.length]
        ),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#9ca3af", precision: 0 },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#d1d5db",
          font: { size: 12 },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const genre = data.genres[ctx.dataIndex];
            return `${genre.genre}: ${genre.count} (${genre.percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">Analytics</h1>
          <p className="text-gray-400 mt-1">Your movie watching insights</p>
        </div>
        <Link
          to="/year-in-review"
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
        >
          🎬 Year in Review
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-light p-5 rounded-xl border border-white/5">
          <div className="text-3xl font-bold text-primary mb-1">
            {data.total_movies}
          </div>
          <div className="text-sm text-gray-400">Movies Watched</div>
        </div>
        <div className="bg-surface-light p-5 rounded-xl border border-white/5">
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {data.total_runtime_hours}h
          </div>
          <div className="text-sm text-gray-400">Total Watch Time</div>
        </div>
        <div className="bg-surface-light p-5 rounded-xl border border-white/5">
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {data.average_rating?.toFixed(1) || "-"}
          </div>
          <div className="text-sm text-gray-400">Avg Rating</div>
        </div>
        <div className="bg-surface-light p-5 rounded-xl border border-white/5">
          <div className="text-3xl font-bold text-orange-400 mb-1">
            🔥 {data.streaks.current_streak}
          </div>
          <div className="text-sm text-gray-400">
            Current Streak{" "}
            <span className="text-gray-600">
              (Best: {data.streaks.longest_streak})
            </span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Genre Pie Chart */}
        <div className="bg-surface-light p-6 rounded-xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">Genre Breakdown</h2>
          {data.genres.length > 0 ? (
            <div className="h-72">
              <Pie data={pieData} options={pieOptions} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No genre data yet
            </div>
          )}
        </div>

        {/* Movies per Month Bar Chart */}
        <div className="bg-surface-light p-6 rounded-xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">
            Movies per Month ({new Date().getFullYear()})
          </h2>
          <div className="h-72">
            <Bar data={monthlyData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Decade Distribution */}
        <div className="bg-surface-light p-6 rounded-xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">Decades</h2>
          {data.decades.length > 0 ? (
            <div className="h-72">
              <Bar data={decadeData} options={barOptions} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No decade data yet
            </div>
          )}
        </div>

        {/* Watch Streaks */}
        <div className="bg-surface-light p-6 rounded-xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">Watch Streaks</h2>
          <div className="space-y-6 mt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl">
                🔥
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {data.streaks.current_streak} days
                </div>
                <div className="text-sm text-gray-400">Current Streak</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {data.streaks.longest_streak} days
                </div>
                <div className="text-sm text-gray-400">Longest Streak</div>
              </div>
            </div>
            {data.streaks.last_watched && (
              <p className="text-sm text-gray-500">
                Last watched:{" "}
                {new Date(data.streaks.last_watched).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Actors & Directors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actors */}
        <div className="bg-surface-light p-6 rounded-xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">Most Watched Actors</h2>
          {data.top_actors.length > 0 ? (
            <div className="space-y-3">
              {data.top_actors.slice(0, 8).map((actor, i) => (
                <div
                  key={actor.person_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-500 w-5">
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center overflow-hidden shrink-0">
                    {actor.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">
                        {actor.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {actor.name}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {actor.count} films
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">No data yet</p>
          )}
        </div>

        {/* Top Directors */}
        <div className="bg-surface-light p-6 rounded-xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">Most Watched Directors</h2>
          {data.top_directors.length > 0 ? (
            <div className="space-y-3">
              {data.top_directors.slice(0, 8).map((dir, i) => (
                <div
                  key={dir.person_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-500 w-5">
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-600/30 flex items-center justify-center overflow-hidden shrink-0">
                    {dir.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${dir.profile_path}`}
                        alt={dir.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">
                        {dir.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {dir.name}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-blue-400">
                    {dir.count} films
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
