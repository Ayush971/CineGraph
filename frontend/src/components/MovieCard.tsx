import React, { useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { type Movie } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Subtle 3D tilt — desktop hover only, capped at ~5deg
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [5, -5]), {
    stiffness: 250,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-5, 5]), {
    stiffness: 250,
    damping: 25,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "TBA";

  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 800 }}
        whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Poster */}
        <div className="relative overflow-hidden rounded-[10px] bg-surface-2 shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-lift)] ring-1 ring-line group-hover:ring-tungsten-400/40 transition-[box-shadow] duration-300">
          <motion.img
            layoutId={`poster-${movie.id}`}
            src={posterUrl}
            alt={movie.title}
            className="w-full h-auto object-cover aspect-[2/3]"
            loading="lazy"
          />

          {/* Bottom scrim + quick meta, revealed on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <div className="bg-gradient-to-t from-void/95 via-void/70 to-transparent pt-8 pb-3 px-3">
              <div className="meta flex items-center justify-between !text-ink">
                <span>{year}</span>
                {movie.vote_average ? (
                  <span className="text-tungsten-300">
                    ★ {movie.vote_average.toFixed(1)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-2.5 px-0.5">
          <h3 className="text-ink font-medium text-sm leading-snug line-clamp-2 group-hover:text-tungsten-300 transition-colors duration-150">
            {movie.title}
          </h3>
          <p className="meta mt-1 !text-ink-faint sm:group-hover:opacity-0 transition-opacity duration-150">
            {year}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;
