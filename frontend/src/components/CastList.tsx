import React, { useRef, useState } from "react";
import type { CastMember } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface CastListProps {
  cast: CastMember[];
}

const CastList: React.FC<CastListProps> = ({ cast }) => {
  const [showAllCast, setShowAllCast] = useState(false);
  const castScrollRef = useRef<HTMLDivElement>(null);

  // Get main cast (first 12)
  const initialCastCount = 12;
  const displayedCast = showAllCast ? cast : cast.slice(0, initialCastCount);
  const remainingCount = cast.length - initialCastCount;

  const scroll = (direction: "left" | "right") => {
    if (castScrollRef.current) {
      const scrollAmount = 600;
      castScrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (cast.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Cast</h2>
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div
          ref={castScrollRef}
          className="overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {displayedCast.map((actor) => (
              <div key={actor.id} className="w-28 shrink-0">
                {actor.profile_path ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}/w185${actor.profile_path}`}
                    alt={actor.name}
                    className="w-full h-40 object-cover rounded-md mb-2"
                  />
                ) : (
                  <div className="w-full h-40 bg-surface-light rounded-md flex items-center justify-center mb-2">
                    <span className="text-3xl">👤</span>
                  </div>
                )}
                <p
                  className="font-semibold text-xs truncate"
                  title={actor.name}
                >
                  {actor.name}
                </p>
                <p
                  className="text-gray-400 text-xs truncate"
                  title={actor.character}
                >
                  {actor.character}
                </p>
              </div>
            ))}

            {/* Show More Button */}
            {!showAllCast && remainingCount > 0 && (
              <div className="w-28 shrink-0">
                <button
                  onClick={() => setShowAllCast(true)}
                  className="w-full h-40 bg-surface-light rounded-md flex flex-col items-center justify-center hover:bg-surface transition-colors"
                >
                  <span className="text-2xl mb-1">+{remainingCount}</span>
                  <span className="text-xs">More</span>
                </button>
              </div>
            )}

            {/* Show Less Button */}
            {showAllCast && (
              <div className="w-28 shrink-0">
                <button
                  onClick={() => setShowAllCast(false)}
                  className="w-full h-40 bg-surface-light rounded-md flex flex-col items-center justify-center hover:bg-surface transition-colors"
                >
                  <span className="text-2xl mb-1">−</span>
                  <span className="text-xs">Show Less</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CastList;
