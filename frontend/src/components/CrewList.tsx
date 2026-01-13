import React, { useRef, useState } from "react";
import type { CrewMember } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface CrewListProps {
  crew: CrewMember[];
}

const CrewList: React.FC<CrewListProps> = ({ crew }) => {
  const [showAllCrew, setShowAllCrew] = useState(false);
  const crewScrollRef = useRef<HTMLDivElement>(null);

  // Get main crew (director, producer, writer, composer)
  const getMainCrew = () => {
    if (!crew) return [];

    const mainJobs = [
      "Director",
      "Producer",
      "Writer",
      "Screenplay",
      "Original Music Composer",
    ];

    // Get unique crew members by name (avoid duplicates)
    const uniqueCrew = new Map<string, CrewMember>();

    // First pass: add main jobs
    crew.forEach((member) => {
      if (mainJobs.includes(member.job)) {
        if (!uniqueCrew.has(member.name)) {
          uniqueCrew.set(member.name, member);
        }
      }
    });

    // Sort logic removed, we just want them emphasized (shown first)
    return Array.from(uniqueCrew.values());
  };

  const mainCrew = getMainCrew();

  // Get the rest of the crew, excluding those in mainCrew
  const restCrew =
    crew?.filter((member) => !mainCrew.some((main) => main.id === member.id)) ||
    [];

  // Combine lists: Main crew first, then rest
  const fullCrewList = [...mainCrew, ...restCrew];

  // Display logic: if not showing all, show only mainCrew (or a subset if mainCrew is huge, but typically it's < 10)
  // Let's cap displayed crew at 12 initially, but ensure they are the "main" ones plus some others if needed
  const initialCount = 12;
  const displayedCrew = showAllCrew
    ? fullCrewList
    : fullCrewList.slice(0, initialCount);
  const remainingCount = fullCrewList.length - initialCount;

  const scroll = (direction: "left" | "right") => {
    if (crewScrollRef.current) {
      const scrollAmount = 600;
      crewScrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (fullCrewList.length === 0) return null;

  return (
    <div className="mt-8 mb-12">
      <h2 className="text-2xl font-bold mb-4">Crew</h2>
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
          ref={crewScrollRef}
          className="overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {displayedCrew.map((member) => (
              <div key={`${member.id}-${member.job}`} className="w-28 shrink-0">
                {member.profile_path ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}/w185${member.profile_path}`}
                    alt={member.name}
                    className="w-full h-40 object-cover rounded-md mb-2"
                  />
                ) : (
                  <div className="w-full h-40 bg-surface-light rounded-md flex items-center justify-center mb-2">
                    <span className="text-3xl">👤</span>
                  </div>
                )}
                <p
                  className="font-semibold text-xs truncate"
                  title={member.name}
                >
                  {member.name}
                </p>
                <p
                  className="text-gray-400 text-xs truncate"
                  title={member.job}
                >
                  {member.job}
                </p>
              </div>
            ))}

            {/* Show More Button */}
            {!showAllCrew && remainingCount > 0 && (
              <div className="w-28 shrink-0">
                <button
                  onClick={() => setShowAllCrew(true)}
                  className="w-full h-40 bg-surface-light rounded-md flex flex-col items-center justify-center hover:bg-surface transition-colors"
                >
                  <span className="text-2xl mb-1">+{remainingCount}</span>
                  <span className="text-xs">More</span>
                </button>
              </div>
            )}

            {/* Show Less Button */}
            {showAllCrew && (
              <div className="w-28 shrink-0">
                <button
                  onClick={() => setShowAllCrew(false)}
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

export default CrewList;
