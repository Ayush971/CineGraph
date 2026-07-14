import React from "react";

type BadgeVariant = "meta" | "genre" | "tungsten" | "daylight" | "bronze" | "silver" | "gold" | "platinum";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  // slate-style metadata chip (mono, tracked)
  meta: "meta bg-surface-2 border border-line",
  genre:
    "text-xs text-ink-mute bg-surface-2 border border-line hover:border-line-strong hover:text-ink transition-colors",
  tungsten: "text-xs font-medium text-tungsten-300 bg-tungsten-400/10 border border-tungsten-400/25",
  daylight: "text-xs font-medium text-daylight-300 bg-daylight-400/10 border border-daylight-400/25",
  bronze: "text-xs font-medium text-[#D8A47F] bg-[#D8A47F]/10 border border-[#D8A47F]/25",
  silver: "text-xs font-medium text-[#C7CCD1] bg-[#C7CCD1]/10 border border-[#C7CCD1]/25",
  gold: "text-xs font-medium text-[#F5C24B] bg-[#F5C24B]/10 border border-[#F5C24B]/25",
  // platinum earns the duo
  platinum:
    "text-xs font-semibold text-ink bg-gradient-to-r from-tungsten-400/20 to-daylight-400/20 border border-line-strong",
};

const Badge: React.FC<BadgeProps> = ({ variant = "meta", children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap ${variantClasses[variant]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
