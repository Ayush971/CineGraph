import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  variant?: Variant;
  size?: Size;
  /** Subtle pull toward the cursor. Primary CTAs only, desktop only. */
  magnetic?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-tungsten-400 text-void font-semibold hover:bg-tungsten-500 active:bg-tungsten-600 hover:shadow-glow",
  secondary:
    "bg-surface-3 text-ink border border-line-strong hover:border-ink-faint hover:bg-surface-2",
  ghost: "text-ink-mute hover:text-ink hover:bg-surface-2",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-sm rounded-md",
  lg: "px-7 py-3.5 text-base rounded-lg",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  magnetic = false,
  className = "",
  children,
  ...rest
}) => {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnetic || reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.15);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={magnetic && !reduced ? { x: sx, y: sy } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 transition-[background-color,border-color,box-shadow,color] duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

export default Button;
