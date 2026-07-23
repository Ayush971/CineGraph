import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { moviesAPI, API_BASE_URL } from "../services/api";
import Button from "../components/ui/Button";
import ProjectorMark from "../components/ui/ProjectorMark";
import type { Movie } from "../types";

// three.js is code-split — only fetched when the 3D wall actually mounts
const PosterWall3D = lazy(() => import("../components/landing/PosterWall3D"));

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

/** Desktop + fine pointer + motion OK + WebGL available */
const canRun3D = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // `?wall=1` forces the 3D wall on small screens (debug/preview)
  const forced = new URLSearchParams(window.location.search).has("wall");
  if (!forced) {
    if (!window.matchMedia("(pointer: fine)").matches) return false;
    if (window.innerWidth < 768) return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const FEATURES = [
  {
    scene: "SC 01",
    title: "The Diary",
    copy: "Log every watch with a date, a 0–10 rating, and your honest review. Rewatches included — your history, kept.",
    to: "/diary",
  },
  {
    scene: "SC 02",
    title: "Ranked Lists",
    copy: "Build and share ranked lists — from “MCU, definitively ordered” to “films that ruined me”. Drag, drop, publish.",
    to: "/lists/discover",
  },
  {
    scene: "SC 03",
    title: "For You",
    copy: "A recommendation engine that learns your taste from what you rate — plus achievements, analytics, and your Year in Review.",
    to: "/recommendations",
  },
];

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [use3D] = useState(canRun3D);
  const [ready3D, setReady3D] = useState(false);

  useEffect(() => {
    moviesAPI
      .getPopular()
      .then((res) =>
        setMovies(res.data.results.filter((m: Movie) => m.poster_path))
      )
      .catch(() => setMovies([]));
  }, []);

  const posterUrls = useMemo(
    () => movies.slice(0, 24).map((m) => `${TMDB_IMAGE_BASE}${m.poster_path}`),
    [movies]
  );

  // WebGL textures need CORS-clean images; TMDB's CDN sends no CORS headers,
  // so the 3D wall loads posters through our backend proxy instead.
  // Kept to 12 at w185: each one is a round trip through our own server, so
  // fewer + smaller is a large win on the first (cold) visit.
  const textureUrls = useMemo(
    () =>
      movies
        .slice(0, 12)
        .map(
          (m) =>
            `${API_BASE_URL}/movies/poster-img/w185/${m.poster_path!.replace("/", "")}`
        ),
    [movies]
  );

  // Don't let the 3D wall compete with first paint — mount it once the browser
  // is idle. (The backend can be slow to wake, so posters may arrive late too.)
  useEffect(() => {
    if (!use3D) return;
    const cb = () => setReady3D(true);
    // The `timeout` guarantees it still runs if the browser never goes idle.
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(cb, { timeout: 1500 })
      : window.setTimeout(cb, 600);
    return () => window.cancelIdleCallback?.(id as number);
  }, [use3D]);

  const tickerTitles = useMemo(
    () => movies.slice(0, 10).map((m) => m.title),
    [movies]
  );

  return (
    <div className="min-h-screen bg-void">
      {/* ============================== HERO ============================== */}
      <section className="relative h-screen min-h-[640px] flex flex-col overflow-hidden">
        {/* -- Letterbox top bar -- */}
        <div className="relative z-30 flex items-center justify-between px-5 sm:px-8 py-4 bg-void/90 border-b border-line">
          <div className="flex items-center gap-2.5">
            <ProjectorMark size={24} animated />
            <span className="font-display text-lg font-bold tracking-tight">
              CineGraph
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/movies"
                className="meta !text-daylight-300 hover:!text-daylight-400 transition-colors"
              >
                Enter →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="meta hover:!text-ink transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold rounded-md bg-tungsten-400 text-void hover:bg-tungsten-500 hover:shadow-glow transition-[background-color,box-shadow] duration-150"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* -- The frame: poster wall / fallback collage -- */}
        <div className="relative flex-1">
          {/* Instant backdrop — a projector beam in pure CSS. Renders on the
              first frame so the hero never looks empty while posters load
              (the API can be slow to wake on a cold backend). */}
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(70% 55% at 18% 45%, rgb(255 120 71 / 0.16), transparent 70%), radial-gradient(60% 50% at 78% 60%, rgb(45 217 198 / 0.10), transparent 70%), linear-gradient(115deg, #0B0A0A 30%, #17130F 60%, #0B0A0A 100%)",
            }}
          />

          {/* Fallback collage — always mounted; the 3D canvas fades in above it */}
          {posterUrls.length > 0 && (
            <div
              className="absolute inset-0 grid grid-cols-4 md:grid-cols-7 gap-2 p-2 scale-105"
              aria-hidden="true"
            >
              {posterUrls.slice(0, 14).map((url, i) => (
                <div
                  key={i}
                  className={`rounded-[10px] overflow-hidden ${
                    i >= 8 ? "hidden md:block" : ""
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover opacity-50"
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 3D reel (desktop only, after idle) */}
          {use3D && ready3D && textureUrls.length > 0 && (
            <Suspense fallback={null}>
              <PosterWall3D posterUrls={textureUrls} />
            </Suspense>
          )}

          {/* Legibility gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-void/95 via-void/60 to-void/30" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />

          {/* -- Hero copy -- */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-5 sm:px-8 flex items-center">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="meta !text-tungsten-300 mb-5"
              >
                Now Showing · A Film Diary by You
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-bold text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[1.02] tracking-[-0.02em] mb-6"
              >
                Your life
                <br />
                in film
                <span className="text-tungsten-400">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="text-ink-mute text-lg leading-relaxed mb-9 max-w-lg"
              >
                Track what you watch. Rate what you love. Discover what's
                next. The diary, lists, and stats your movie obsession
                deserves.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-center gap-4"
              >
                {user ? (
                  <>
                    <Link to="/diary">
                      <Button size="lg" magnetic>
                        Open your diary
                      </Button>
                    </Link>
                    <Link to="/recommendations">
                      <Button size="lg" variant="secondary">
                        For You →
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" magnetic>
                        Start your diary — free
                      </Button>
                    </Link>
                    <Link to="/movies">
                      <Button size="lg" variant="secondary">
                        Browse movies
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* -- Letterbox bottom bar -- */}
        <div className="relative z-30 flex items-center justify-between px-5 sm:px-8 py-3 bg-void/90 border-t border-line">
          <span className="meta !text-ink-faint">2.39 : 1 · Color · 5.1 Stereo</span>
          <span className="meta !text-ink-faint hidden sm:block">
            Data · TMDB
          </span>
        </div>
      </section>

      {/* ============================ TICKER ============================ */}
      {tickerTitles.length > 0 && (
        <section className="py-10 border-b border-line overflow-hidden">
          <div className="flex animate-scroll-horizontal motion-reduce:animate-none whitespace-nowrap">
            {[0, 1, 2, 3].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center">
                {tickerTitles.map((title, i) => (
                  <span
                    key={`${dup}-${i}`}
                    className="flex items-center font-display font-semibold text-2xl text-ink-faint"
                  >
                    <span className="px-6">{title}</span>
                    <span className="text-tungsten-400/60 text-sm">◆</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================== FEATURES =========================== */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <motion.p {...reveal} transition={{ duration: 0.5 }} className="meta !text-daylight-300 mb-3">
          The Program
        </motion.p>
        <motion.h2
          {...reveal}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display font-bold text-3xl sm:text-4xl mb-14"
        >
          Everything a film lover keeps.
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.scene}
              {...reveal}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={f.to}
                className="group block h-full bg-surface border border-line rounded-2xl p-7 hover:border-tungsten-400/40 hover:bg-surface-2 hover:-translate-y-1 transition-[border-color,background-color,transform] duration-300"
              >
                <p className="meta !text-tungsten-300 mb-4">{f.scene}</p>
                <h3 className="font-display font-semibold text-xl mb-3 group-hover:text-tungsten-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-ink-mute text-sm leading-relaxed">{f.copy}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ CTA BAND ============================ */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-28">
        <motion.div
          {...reveal}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl p-[1px] bg-gradient-to-r from-tungsten-400/50 via-line to-daylight-400/50"
        >
          <div className="rounded-3xl bg-surface px-8 py-14 sm:px-14 text-center">
            <p className="meta mb-4">Final Reel</p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl leading-tight mb-5">
              Roll credits on forgetting.
            </h2>
            <p className="text-ink-mute text-lg mb-9 max-w-xl mx-auto">
              Every film you watch becomes part of your story. Start writing
              it down.
            </p>
            {user ? (
              <Link to="/movies">
                <Button size="lg" magnetic>
                  Browse tonight's picks
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button size="lg" magnetic>
                  Create your free account
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        <p className="meta !text-ink-faint text-center mt-10">
          CineGraph · Movie data from TMDB
        </p>
      </section>
    </div>
  );
};

export default LandingPage;
