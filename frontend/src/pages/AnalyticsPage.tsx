import React, { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import CountUp from "../components/ui/CountUp";
import type { AnalyticsOverview, PersonCount } from "../types";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART, barOptions, barDataset } from "../utils/chartTheme";

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <motion.div
    {...reveal}
    className={`bg-surface border border-line rounded-2xl p-6 ${className}`}
  >
    {children}
  </motion.div>
);

const PeopleList: React.FC<{
  people: PersonCount[];
  accent: "tungsten" | "daylight";
}> = ({ people, accent }) => (
  <div className="space-y-1.5">
    {people.slice(0, 8).map((person, i) => (
      <div
        key={person.person_id}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors"
      >
        <span className="meta w-6 !text-ink-faint">
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-line">
          {person.profile_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
              alt={person.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-semibold text-ink-mute">
              {person.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-sm font-medium text-ink truncate">
          {person.name}
        </div>
        <span
          className={`meta ${
            accent === "tungsten" ? "!text-tungsten-300" : "!text-daylight-300"
          }`}
        >
          {person.count} {person.count === 1 ? "film" : "films"}
        </span>
      </div>
    ))}
  </div>
);

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
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <p className="meta !text-danger">Projection Error</p>
        <p className="text-ink-mute text-lg">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  // Sorted horizontal bars beat a 15-slice pie: one hue, direct labels,
  // no legend gymnastics.
  const genreData = {
    labels: data.genres.slice(0, 10).map((g) => g.genre),
    datasets: [
      {
        ...barDataset(CHART.tungsten),
        label: "Films",
        data: data.genres.slice(0, 10).map((g) => g.count),
      },
    ],
  };

  const monthlyData = {
    labels: data.monthly.map((m) => m.label.toUpperCase()),
    datasets: [
      {
        ...barDataset(CHART.tungsten),
        label: "Films",
        data: data.monthly.map((m) => m.count),
      },
    ],
  };

  const decadeData = {
    labels: data.decades.map((d) => d.decade),
    datasets: [
      {
        ...barDataset(CHART.daylight),
        label: "Films",
        data: data.decades.map((d) => d.count),
      },
    ],
  };

  const stats = [
    { label: "Films Watched", value: data.total_movies, decimals: 0, suffix: "" },
    {
      label: "Hours in the Dark",
      value: data.total_runtime_hours,
      decimals: 1,
      suffix: "h",
    },
    {
      label: "Average Rating",
      value: data.average_rating ?? 0,
      decimals: 1,
      suffix: "",
      empty: data.average_rating == null,
    },
    {
      label: `Current Streak · Best ${data.streaks.longest_streak}`,
      value: data.streaks.current_streak,
      decimals: 0,
      suffix: "d",
    },
  ];

  return (
    <div className="min-h-screen pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
        <div>
          <p className="meta !text-daylight-300 mb-1.5">The Numbers</p>
          <h1 className="font-display font-bold text-4xl">Analytics</h1>
        </div>
        <Link
          to="/year-in-review"
          className="group relative rounded-lg p-[1px] bg-gradient-to-r from-tungsten-400/60 to-daylight-400/60"
        >
          <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface text-sm font-medium text-ink group-hover:bg-surface-2 transition-colors">
            Year in Review →
          </span>
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((s) => (
          <Card key={s.label} className="!p-5">
            <div className="font-display font-bold text-3xl text-ink mb-1">
              {s.empty ? (
                "—"
              ) : (
                <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
              )}
            </div>
            <div className="meta">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <p className="meta mb-1">By Genre</p>
          <h2 className="font-display font-semibold text-lg mb-5">
            What you keep coming back to
          </h2>
          {data.genres.length > 0 ? (
            <div className="h-80">
              <Bar data={genreData} options={barOptions(true)} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center meta">
              No genre data yet
            </div>
          )}
        </Card>

        <Card>
          <p className="meta mb-1">By Month · {new Date().getFullYear()}</p>
          <h2 className="font-display font-semibold text-lg mb-5">
            Your viewing rhythm
          </h2>
          <div className="h-80">
            <Bar data={monthlyData} options={barOptions()} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <p className="meta mb-1">By Decade</p>
          <h2 className="font-display font-semibold text-lg mb-5">
            When your films were made
          </h2>
          {data.decades.length > 0 ? (
            <div className="h-72">
              <Bar data={decadeData} options={barOptions()} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center meta">
              No decade data yet
            </div>
          )}
        </Card>

        {/* Streaks */}
        <Card>
          <p className="meta mb-1">Consistency</p>
          <h2 className="font-display font-semibold text-lg mb-6">
            Watch streaks
          </h2>
          <div className="space-y-7 mt-2">
            <div className="flex items-baseline gap-4">
              <span className="font-display font-bold text-5xl text-tungsten-300">
                <CountUp value={data.streaks.current_streak} />
              </span>
              <div>
                <div className="text-ink font-medium">days running</div>
                <div className="meta">Current Streak</div>
              </div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="font-display font-bold text-5xl text-ink">
                <CountUp value={data.streaks.longest_streak} />
              </span>
              <div>
                <div className="text-ink font-medium">days</div>
                <div className="meta">Personal Best</div>
              </div>
            </div>
            {data.streaks.last_watched && (
              <p className="meta !text-ink-faint pt-1">
                Last watched ·{" "}
                {new Date(data.streaks.last_watched).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* People */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <p className="meta mb-1">On Screen</p>
          <h2 className="font-display font-semibold text-lg mb-5">
            Most watched actors
          </h2>
          {data.top_actors.length > 0 ? (
            <PeopleList people={data.top_actors} accent="tungsten" />
          ) : (
            <p className="meta py-8 text-center">No data yet</p>
          )}
        </Card>

        <Card>
          <p className="meta mb-1">Behind the Camera</p>
          <h2 className="font-display font-semibold text-lg mb-5">
            Most watched directors
          </h2>
          {data.top_directors.length > 0 ? (
            <PeopleList people={data.top_directors} accent="daylight" />
          ) : (
            <p className="meta py-8 text-center">No data yet</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
