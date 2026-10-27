"use client";

import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "danger";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-neutral-100 text-neutral-900",
  secondary: "bg-emerald-900 text-white",
  success: "bg-emerald-50 text-emerald-900",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-900",
};

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-tighter transition-colors",
        variantClasses[variant],
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}
