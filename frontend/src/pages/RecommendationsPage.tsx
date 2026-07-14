import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { recommendationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { PosterGridSkeleton } from "../components/ui/Skeleton";
import type { Recommendation } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const posterOf = (rec: Recommendation) =>
  rec.poster_path
    ? `${TMDB_IMAGE_BASE}${rec.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

const yearOf = (rec: Recommendation) =>
  rec.release_date ? new Date(rec.release_date).getFullYear() : "TBA";

const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await recommendationsAPI.getForYou();
      setRecs(res.data.items);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await recommendationsAPI.refresh();
      setRecs(res.data.items);
    } catch (err) {
      console.error("Failed to refresh recommendations:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="meta !text-tungsten-300 mb-3">Private Screening</p>
        <h1 className="font-display font-bold text-4xl mb-4">For You</h1>
        <p className="text-ink-mute text-lg">
          <Link
            to="/login"
            className="text-daylight-300 hover:text-daylight-400 transition-colors"
          >
            Log in
          </Link>{" "}
          to see films picked for your taste.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = recs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="meta !text-tungsten-300 mb-1.5">Curated From Your Diary</p>
          <h1 className="font-display font-bold text-4xl">For You</h1>
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
          {refreshing ? "Rescreening…" : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <PosterGridSkeleton count={10} />
      ) : recs.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-line rounded-2xl">
          <p className="meta mb-3">Empty Reel</p>
          <p className="text-ink text-xl font-display font-semibold mb-2">
            No recommendations yet
          </p>
          <p className="text-ink-mute max-w-md mx-auto">
            Rate a few films in your{" "}
            <Link
              to="/diary"
              className="text-daylight-300 hover:text-daylight-400 transition-colors"
            >
              diary
            </Link>{" "}
            and we'll start programming your personal festival.
          </p>
        </div>
      ) : (
        <>
          {/* Tonight's Pick — the top-scored film gets the marquee */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-12"
            >
              <Link
                to={`/movie/${featured.tmdb_id}`}
                className="group flex flex-col sm:flex-row gap-7 bg-surface border border-line rounded-2xl p-6 sm:p-8 hover:border-tungsten-400/40 transition-colors relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(60% 100% at 20% 50%, rgb(255 120 71), transparent)",
                  }}
                  aria-hidden="true"
                />
                <img
                  src={posterOf(featured)}
                  alt={featured.title}
                  className="relative w-40 shrink-0 rounded-[10px] shadow-[var(--shadow-card)] ring-1 ring-line group-hover:scale-[1.02] transition-transform duration-300 mx-auto sm:mx-0"
                />
                <div className="relative flex flex-col justify-center text-center sm:text-left">
                  <p className="meta !text-tungsten-300 mb-2">Tonight's Pick</p>
                  <h2 className="font-display font-bold text-3xl mb-2 group-hover:text-tungsten-300 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="meta mb-4">
                    {yearOf(featured)}
                    {featured.vote_average
                      ? ` · ★ ${featured.vote_average.toFixed(1)}`
                      : ""}
                  </p>
                  {featured.reason && (
                    <p className="text-ink-mute text-lg italic">
                      "{featured.reason}"
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          )}

          {/* The rest of the program */}
          {rest.length > 0 && (
            <>
              <p className="meta mb-6">The Full Program</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                {rest.map((rec, i) => (
                  <motion.div
                    key={rec.tmdb_id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: Math.min(i, 8) * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link to={`/movie/${rec.tmdb_id}`} className="group block">
                      <div className="relative overflow-hidden rounded-[10px] bg-surface-2 ring-1 ring-line group-hover:ring-tungsten-400/40 shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-lift)] transition-[box-shadow] duration-300">
                        <img
                          src={posterOf(rec)}
                          alt={rec.title}
                          className="w-full aspect-[2/3] object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          loading="lazy"
                        />
                        {rec.vote_average ? (
                          <span className="absolute top-2 right-2 meta !text-tungsten-300 bg-void/75 px-2 py-1 rounded-md">
                            ★ {rec.vote_average.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2.5 px-0.5">
                        <h3 className="text-ink font-medium text-sm leading-snug line-clamp-2 group-hover:text-tungsten-300 transition-colors duration-150">
                          {rec.title}
                        </h3>
                        <p className="meta mt-1 !text-ink-faint">{yearOf(rec)}</p>
                        {rec.reason && (
                          <p className="text-xs text-daylight-300/90 mt-1.5 line-clamp-1">
                            {rec.reason}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationsPage;
