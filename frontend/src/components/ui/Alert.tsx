import React from "react";
import { motion } from "framer-motion";

type AlertVariant = "danger" | "success" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  // Slash opacity, not the v3 `bg-opacity-*` utilities — those were removed in
  // Tailwind v4 and silently compile to nothing, which is what made the old
  // login error a solid red block with unreadable red text on top.
  danger: "bg-danger/10 border-danger/40 text-danger",
  success: "bg-success/10 border-success/40 text-success",
  info: "bg-daylight-400/10 border-daylight-400/40 text-daylight-300",
};

const icons: Record<AlertVariant, React.ReactNode> = {
  danger: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v3.5m0 3h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
    />
  ),
  success: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m5 13 4 4L19 7"
    />
  ),
  info: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  ),
};

/**
 * Inline status message for forms.
 *
 * `role="alert"` means screen readers announce it the moment it appears —
 * important because a failed login gives no other feedback.
 */
const Alert: React.FC<AlertProps> = ({
  variant = "danger",
  children,
  className = "",
}) => (
  <motion.div
    role="alert"
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 text-sm ${variantClasses[variant]} ${className}`}
  >
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {icons[variant]}
    </svg>
    <span className="leading-snug">{children}</span>
  </motion.div>
);

export default Alert;
