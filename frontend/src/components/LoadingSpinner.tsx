import React from "react";

/** Projector-style loader: a tungsten arc orbiting a dim reel. */
const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-surface-3" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-tungsten-400 animate-spin motion-reduce:animate-none" />
    </div>
    <p className="meta">Loading</p>
  </div>
);

export default LoadingSpinner;
