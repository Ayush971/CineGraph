import React, { useState } from "react";

interface StarRatingProps {
  rating: number; // 0-10
  maxRating?: number;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 10,
  size = "medium",
  interactive = false,
  onRate,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const numStars = 10;
  // Ensure rating is treated as a number
  const safeRating = Number(rating) || 0;
  const currentRating = hoverRating || safeRating;
  const filledStars = (currentRating / maxRating) * numStars;

  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    starIndex: number
  ) => {
    if (!interactive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;

    // Round to nearest 0.1 (one decimal place)
    const starRating = starIndex + Math.round(percentage * 10) / 10;
    const totalRating = Math.min(
      Math.max(starRating * (maxRating / numStars), 0),
      maxRating
    );

    setHoverRating(totalRating);
  };

  const handleClick = () => {
    if (interactive && onRate && hoverRating > 0) {
      onRate(Math.round(hoverRating * 10) / 10);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const getStarFill = (index: number): "empty" | "half" | "full" => {
    const diff = filledStars - index;
    if (diff >= 1) return "full";
    if (diff > 0) return "half";
    return "empty";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {/* Star Icons */}
        <div className="flex gap-1" onMouseLeave={handleMouseLeave}>
          {Array.from({ length: numStars }).map((_, index) => {
            const fillType = getStarFill(index);
            const fillPercentage =
              fillType === "full"
                ? 100
                : fillType === "half"
                ? (filledStars - index) * 100
                : 0;

            return (
              <div
                key={index}
                className={`relative ${sizeClasses[size]} ${
                  interactive ? "cursor-pointer" : ""
                }`}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onClick={handleClick}
              >
                {/* Background Star (Gray) */}
                <svg
                  className="absolute inset-0 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>

                {/* Filled Star (Yellow) - using clip-path */}
                <svg
                  className="absolute inset-0 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Rating Number */}
        <span className="ml-2 text-lg font-semibold">
          {currentRating.toFixed(1)}
        </span>
      </div>

      {/* Interactive Hint */}
      {interactive && (
        <p className="text-xs text-gray-500">
          {hoverRating > 0 ? "Click to rate" : "Hover to rate"}
        </p>
      )}
    </div>
  );
};

export default StarRating;
