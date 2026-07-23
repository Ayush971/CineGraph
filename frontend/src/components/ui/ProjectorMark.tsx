import React from "react";

/**
 * CineGraph logo mark — "the projector".
 *
 * A tungsten lamp throwing a daylight beam: reads as both a projector and a
 * play button. The duo variant is the primary brand mark (warm lamp → cool
 * beam mirrors the tungsten/daylight white-balance pairing the palette is
 * named after).
 *
 * Silhouette-first, so it stays legible down to 16px.
 */

type MarkVariant = "duo" | "primary" | "mono";

interface ProjectorMarkProps {
  /** Rendered width/height in px */
  size?: number;
  variant?: MarkVariant;
  /** Softly pulse the outer rays (landing hero). Respects reduced motion. */
  animated?: boolean;
  className?: string;
}

const TUNGSTEN = "#FF7847";
const DAYLIGHT = "#2DD9C6";

const ProjectorMark: React.FC<ProjectorMarkProps> = ({
  size = 26,
  variant = "duo",
  animated = false,
  className = "",
}) => {
  // mono inherits the surrounding text color
  const lamp = variant === "mono" ? "currentColor" : TUNGSTEN;
  const beam =
    variant === "mono"
      ? "currentColor"
      : variant === "primary"
      ? TUNGSTEN
      : DAYLIGHT;

  const rayPulse = animated
    ? "animate-pulse motion-reduce:animate-none"
    : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CineGraph"
    >
      {/* Lamp / play head */}
      <path d="M14 12 L14 52 L38 32 Z" fill={lamp} />
      {/* Beam — three diverging rays, brightest in the middle */}
      <g className={rayPulse}>
        <path d="M44 24 L60 14 L60 22 L44 28 Z" fill={beam} opacity="0.55" />
        <path d="M44 30 L60 26 L60 34 L44 34 Z" fill={beam} opacity="0.9" />
        <path d="M44 36 L60 42 L60 50 L44 40 Z" fill={beam} opacity="0.55" />
      </g>
    </svg>
  );
};

export default ProjectorMark;
