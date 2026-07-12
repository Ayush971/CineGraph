import React, { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import type { YearInReview } from "../types";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const GRADIENT_BG = [
  "from-violet-900 via-purple-800 to-indigo-900",
  "from-rose-900 via-red-800 to-orange-900",
  "from-emerald-900 via-teal-800 to-cyan-900",
  "from-sky-900 via-blue-800 to-indigo-900",
  "from-amber-900 via-yellow-800 to-orange-900",
];

const YearInReviewPage: React.FC = () => {
  const [data, setData] = useState<YearInReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getYearInReview(year);
        setData(res.data);
      } catch (err) {
        setError("Failed to load year in review");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  const monthlyChartData = {
    labels: data.monthly.map((m) => m.label),
    datasets: [
      {
        label: "Movies",
        data: data.monthly.map((m) => m.count),
        backgroundColor: "rgba(139, 92, 246, 0.7)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const ratingChartData = {
    labels: data.rating_distribution.map((r) => r.rating.toString()),
    datasets: [
      {
        label: "Count",
        data: data.rating_distribution.map((r) => r.count),
        backgroundColor: "rgba(234, 179, 8, 0.7)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.6)" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "rgba(255,255,255,0.4)", precision: 0 },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  const bgGradient = GRADIENT_BG[year % GRADIENT_BG.length];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className={`relative bg-gradient-to-br ${bgGradient} py-20 px-4 sm:px-6 lg:px-8 overflow-hidden`}
      >
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Year selector */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  year === y
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <p className="text-white/50 uppercase tracking-[0.3em] text-sm font-medium mb-3">
            Your Year in Movies
          </p>
          <h1 className="text-8xl font-black text-white mb-4 tracking-tight">
            {year}
          </h1>

          {data.total_movies === 0 ? (
            <p className="text-xl text-white/60 mt-8">
              No movies logged for {year}. Start watching!
            </p>
          ) : (
            <p className="text-xl text-white/70 max-w-lg mx-auto">
              You watched{" "}
              <span className="text-white font-bold">{data.total_movies} movies</span>{" "}
              and spent{" "}
              <span className="text-white font-bold">{data.total_hours} hours</span>{" "}
              immersed in cinema.
            </p>
          )}
        </div>
      </div>

      {data.total_movies > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          {/* Big stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl border border-primary/20 text-center">
              <div className="text-4xl font-black text-primary">
                {data.total_movies}
              </div>
              <div className="text-sm text-gray-400 mt-1">Movies</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-6 rounded-2xl border border-blue-500/20 text-center">
              <div className="text-4xl font-black text-blue-400">
                {data.total_hours}h
              </div>
              <div className="text-sm text-gray-400 mt-1">Watch Time</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 p-6 rounded-2xl border border-yellow-500/20 text-center">
              <div className="text-4xl font-black text-yellow-400">
                {data.average_rating?.toFixed(1) || "-"}
              </div>
              <div className="text-sm text-gray-400 mt-1">Avg Rating</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 p-6 rounded-2xl border border-orange-500/20 text-center">
              <div className="text-4xl font-black text-orange-400">
                {data.longest_streak}
              </div>
              <div className="text-sm text-gray-400 mt-1">Day Streak</div>
            </div>
          </div>

          {/* Highlights — top genre, actor, director, movie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Genre */}
            {data.top_genre && (
              <div className="bg-surface-light p-6 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Favorite Genre
                </p>
                <div className="text-3xl font-black text-white">
                  {data.top_genre}
                </div>
              </div>
            )}

            {/* Most watched month */}
            {data.most_watched_month && (
              <div className="bg-surface-light p-6 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Busiest Month
                </p>
                <div className="text-3xl font-black text-white">
                  {data.most_watched_month}
                </div>
              </div>
            )}

            {/* Top Actor */}
            {data.top_actor && (
              <div className="bg-surface-light p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center overflow-hidden shrink-0">
                  {data.top_actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${data.top_actor.profile_path}`}
                      alt={data.top_actor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">
                      {data.top_actor.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Top Actor
                  </p>
                  <div className="text-xl font-bold text-white">
                    {data.top_actor.name}
                  </div>
                  <p className="text-sm text-primary">
                    {data.top_actor.count} films
                  </p>
                </div>
              </div>
            )}

            {/* Top Director */}
            {data.top_director && (
              <div className="bg-surface-light p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-600/30 flex items-center justify-center overflow-hidden shrink-0">
                  {data.top_director.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${data.top_director.profile_path}`}
                      alt={data.top_director.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">
                      {data.top_director.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Top Director
                  </p>
                  <div className="text-xl font-bold text-white">
                    {data.top_director.name}
                  </div>
                  <p className="text-sm text-blue-400">
                    {data.top_director.count} films
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Top Rated Movie */}
          {data.top_rated_movie && (
            <div className="bg-surface-light p-8 rounded-2xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                Highest Rated Movie
              </p>
              <div className="flex items-center gap-6">
                {data.top_rated_movie.poster_path && (
                  <Link to={`/movie/${data.top_rated_movie.tmdb_id}`}>
                    <img
                      src={`https://image.tmdb.org/t/p/w200${data.top_rated_movie.poster_path}`}
                      alt={data.top_rated_movie.title}
                      className="w-24 rounded-lg shadow-2xl hover:opacity-80 transition-opacity"
                    />
                  </Link>
                )}
                <div>
                  <Link
                    to={`/movie/${data.top_rated_movie.tmdb_id}`}
                    className="text-2xl font-bold text-white hover:text-primary transition-colors"
                  >
                    {data.top_rated_movie.title}
                  </Link>
                  <div className="text-3xl font-black text-yellow-400 mt-2">
                    ★ {data.top_rated_movie.rating}/10
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="bg-surface-light p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold mb-4">Movies per Month</h3>
              <div className="h-56">
                <Bar data={monthlyChartData} options={chartOpts} />
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-surface-light p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold mb-4">Rating Distribution</h3>
              <div className="h-56">
                <Bar data={ratingChartData} options={chartOpts} />
              </div>
            </div>
          </div>

          {/* Genre breakdown */}
          {data.genres.length > 0 && (
            <div className="bg-surface-light p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold mb-4">Genres</h3>
              <div className="space-y-3">
                {data.genres.slice(0, 8).map((genre) => (
                  <div key={genre.genre} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-400 shrink-0 truncate">
                      {genre.genre}
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-400 w-14 text-right">
                      {genre.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="text-center pt-4">
            <Link
              to="/analytics"
              className="text-gray-500 hover:text-white transition-colors text-sm"
            >
              ← Back to Analytics
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearInReviewPage;
