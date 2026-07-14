import React, { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import CountUp from "../components/ui/CountUp";
import Button from "../components/ui/Button";
import type { YearInReview } from "../types";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART, barOptions, barDataset } from "../utils/chartTheme";

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/**
 * Year in Review — scrollytelling. Each "reel" is a full-height scene that
 * reveals as you scroll, Wrapped-style. This is a brand hero moment, so the
 * tungsten/daylight duo is allowed to appear together.
 */

const scene = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-120px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const Reel: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <section
    className={`min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 text-center ${className}`}
  >
    <motion.div {...scene} className="w-full max-w-4xl mx-auto">
      <p className="meta !text-tungsten-300 mb-8">{label}</p>
      {children}
    </motion.div>
  </section>
);

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
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <p className="meta !text-danger">Projection Error</p>
        <p className="text-ink-mute text-lg">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  const monthlyChartData = {
    labels: data.monthly.map((m) => m.label.toUpperCase()),
    datasets: [
      {
        ...barDataset(CHART.tungsten),
        label: "Films",
        data: data.monthly.map((m) => m.count),
      },
    ],
  };

  const ratingChartData = {
    labels: data.rating_distribution.map((r) => r.rating.toString()),
    datasets: [
      {
        ...barDataset(CHART.daylight),
        label: "Entries",
        data: data.rating_distribution.map((r) => r.count),
      },
    ],
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ========================= Title reel ========================= */}
      <section className="min-h-[92vh] flex flex-col items-center justify-center px-4 text-center relative">
        {/* Duo glow — brand hero moment */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(45% 35% at 30% 45%, rgb(255 120 71 / 0.10), transparent), radial-gradient(45% 35% at 70% 55%, rgb(45 217 198 / 0.08), transparent)",
          }}
        />

        {/* Year selector */}
        <div className="relative flex items-center justify-center gap-2 mb-12 flex-wrap">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                year === y
                  ? "bg-tungsten-400 text-void"
                  : "bg-surface-2 text-ink-mute border border-line hover:text-ink hover:border-line-strong"
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="meta mb-4"
        >
          The Annual Screening
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative font-display font-bold text-[clamp(5rem,18vw,12rem)] leading-none tracking-[-0.03em] bg-gradient-to-r from-tungsten-300 via-ink to-daylight-300 bg-clip-text text-transparent"
        >
          {year}
        </motion.h1>

        {data.total_movies === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-ink-mute text-xl mt-8 max-w-md"
          >
            No films logged for {year}. The projector is waiting.
          </motion.p>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-ink-mute text-xl mt-6 max-w-lg"
            >
              Your year in film — scroll to roll it.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4, 1] }}
              transition={{ duration: 2, delay: 1.2, repeat: Infinity }}
              className="meta !text-ink-faint mt-16"
            >
              ▼
            </motion.div>
          </>
        )}
      </section>

      {data.total_movies > 0 && (
        <>
          {/* ====================== Reel 01 · Volume ====================== */}
          <Reel label="Reel 01 · The Count">
            <div className="font-display font-bold text-[clamp(5rem,15vw,10rem)] leading-none text-ink">
              <CountUp value={data.total_movies} duration={1.6} />
            </div>
            <p className="text-ink-mute text-2xl mt-4">
              films watched in {year}
            </p>
            <div className="flex justify-center gap-12 mt-12 flex-wrap">
              <div>
                <div className="font-display font-bold text-4xl text-tungsten-300">
                  <CountUp value={data.total_hours} decimals={1} suffix="h" />
                </div>
                <div className="meta mt-1.5">In the Dark</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-ink">
                  <CountUp value={data.total_entries} />
                </div>
                <div className="meta mt-1.5">Diary Entries</div>
              </div>
              {data.average_rating != null && (
                <div>
                  <div className="font-display font-bold text-4xl text-daylight-300">
                    <CountUp value={data.average_rating} decimals={1} />
                  </div>
                  <div className="meta mt-1.5">Average Rating</div>
                </div>
              )}
            </div>
          </Reel>

          {/* ====================== Reel 02 · Genre ====================== */}
          {data.top_genre && (
            <Reel label="Reel 02 · The Obsession">
              <p className="text-ink-mute text-xl mb-3">You kept returning to</p>
              <h2 className="font-display font-bold text-[clamp(2.5rem,8vw,5.5rem)] leading-tight text-tungsten-300 mb-12">
                {data.top_genre}
              </h2>
              <div className="max-w-xl mx-auto space-y-3 text-left">
                {data.genres.slice(0, 6).map((genre, i) => (
                  <div key={genre.genre} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-ink-mute shrink-0 truncate text-right">
                      {genre.genre}
                    </span>
                    <div className="flex-1 bg-surface-2 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${genre.percentage}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 + i * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="h-full rounded-full"
                        style={{ background: CHART.tungsten }}
                      />
                    </div>
                    <span className="meta w-10">{genre.count}</span>
                  </div>
                ))}
              </div>
            </Reel>
          )}

          {/* ====================== Reel 03 · People ====================== */}
          {(data.top_actor || data.top_director) && (
            <Reel label="Reel 03 · The Company You Kept">
              <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {data.top_actor && (
                  <div className="bg-surface border border-line rounded-2xl p-8">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-2 ring-tungsten-400/50 mb-5 bg-surface-3 flex items-center justify-center">
                      {data.top_actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${data.top_actor.profile_path}`}
                          alt={data.top_actor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-3xl">
                          {data.top_actor.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <p className="meta mb-2">Face of Your Year</p>
                    <h3 className="font-display font-semibold text-2xl">
                      {data.top_actor.name}
                    </h3>
                    <p className="meta !text-tungsten-300 mt-2">
                      {data.top_actor.count} Films
                    </p>
                  </div>
                )}
                {data.top_director && (
                  <div className="bg-surface border border-line rounded-2xl p-8">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-2 ring-daylight-400/50 mb-5 bg-surface-3 flex items-center justify-center">
                      {data.top_director.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${data.top_director.profile_path}`}
                          alt={data.top_director.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-3xl">
                          {data.top_director.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <p className="meta mb-2">Voice Behind the Camera</p>
                    <h3 className="font-display font-semibold text-2xl">
                      {data.top_director.name}
                    </h3>
                    <p className="meta !text-daylight-300 mt-2">
                      {data.top_director.count} Films
                    </p>
                  </div>
                )}
              </div>
            </Reel>
          )}

          {/* ==================== Reel 04 · Top Film ==================== */}
          {data.top_rated_movie && (
            <Reel label="Reel 04 · Best in Show">
              <div className="flex flex-col items-center">
                {data.top_rated_movie.poster_path && (
                  <Link
                    to={`/movie/${data.top_rated_movie.tmdb_id}`}
                    className="relative block mb-8 group"
                  >
                    <div
                      className="absolute -inset-5 rounded-3xl blur-2xl opacity-40 bg-tungsten-400"
                      aria-hidden="true"
                    />
                    <img
                      src={`https://image.tmdb.org/t/p/w342${data.top_rated_movie.poster_path}`}
                      alt={data.top_rated_movie.title}
                      className="relative w-52 rounded-[10px] shadow-[var(--shadow-lift)] ring-1 ring-line-strong group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </Link>
                )}
                <Link
                  to={`/movie/${data.top_rated_movie.tmdb_id}`}
                  className="font-display font-bold text-3xl hover:text-tungsten-300 transition-colors"
                >
                  {data.top_rated_movie.title}
                </Link>
                <p className="meta !text-tungsten-300 !text-base mt-3">
                  ★ {data.top_rated_movie.rating} / 10 — Your highest rating
                </p>
              </div>
            </Reel>
          )}

          {/* ==================== Reel 05 · Rhythm ==================== */}
          <Reel label="Reel 05 · The Rhythm">
            {data.most_watched_month && (
              <p className="text-ink-mute text-xl mb-10">
                <span className="text-ink font-semibold font-display text-2xl">
                  {data.most_watched_month}
                </span>{" "}
                was your biggest month
                {data.longest_streak > 1 && (
                  <>
                    {" "}
                    · longest streak{" "}
                    <span className="text-tungsten-300 font-semibold">
                      {data.longest_streak} days
                    </span>
                  </>
                )}
              </p>
            )}
            <div className="grid lg:grid-cols-2 gap-6 text-left">
              <div className="bg-surface border border-line rounded-2xl p-6">
                <p className="meta mb-4">Films per Month</p>
                <div className="h-52">
                  <Bar data={monthlyChartData} options={barOptions()} />
                </div>
              </div>
              <div className="bg-surface border border-line rounded-2xl p-6">
                <p className="meta mb-4">How You Rated</p>
                <div className="h-52">
                  <Bar data={ratingChartData} options={barOptions()} />
                </div>
              </div>
            </div>
          </Reel>

          {/* ==================== Closing reel ==================== */}
          <section className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center relative">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(50% 40% at 50% 60%, rgb(255 120 71 / 0.08), transparent)",
              }}
            />
            <motion.div {...scene}>
              <p className="meta mb-5">Fin</p>
              <h2 className="font-display font-bold text-[clamp(2.5rem,7vw,4.5rem)] leading-tight mb-8">
                That's a wrap
                <br />
                on {year}
                <span className="text-tungsten-400">.</span>
              </h2>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link to="/diary">
                  <Button size="lg" magnetic>
                    Keep logging
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button size="lg" variant="secondary">
                    ← Back to Analytics
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </>
      )}
    </div>
  );
};

export default YearInReviewPage;
