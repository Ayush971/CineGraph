import React from "react";

interface SkeletonProps {
  /** poster = 2:3 aspect; text = one line; circle = avatar */
  variant?: "poster" | "text" | "circle" | "block";
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ variant = "block", className = "" }) => {
  const base = "skeleton-shimmer";
  const shapes: Record<string, string> = {
    poster: "aspect-[2/3] w-full rounded-[10px]",
    text: "h-4 w-full rounded-md",
    circle: "rounded-full aspect-square",
    block: "rounded-lg",
  };
  return <div className={`${base} ${shapes[variant]} ${className}`} aria-hidden="true" />;
};

/** Ready-made grid of poster skeletons for movie grids */
export const PosterGridSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton variant="poster" />
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/3 h-3" />
      </div>
    ))}
  </div>
);

export default Skeleton;
