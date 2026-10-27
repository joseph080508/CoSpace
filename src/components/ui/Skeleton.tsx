"use client";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({
  className,
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-neutral-200",
        className,
      ].filter(Boolean).join(" ")}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  className,
}: SkeletonTextProps): React.JSX.Element {
  return (
    <div className={[
      "space-y-4",
      className,
    ].filter(Boolean).join(" ")}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-200 rounded animate-pulse"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
