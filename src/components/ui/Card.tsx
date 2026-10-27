"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
}: CardProps): React.JSX.Element {
  return (
    <div
      className={[
        "rounded-xl border border-neutral-200 bg-surface shadow-sm",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
}

export function CardHeader({ children }: CardHeaderProps): React.JSX.Element {
  return <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
}

export function CardTitle({ children }: CardTitleProps): React.JSX.Element {
  return <h3 className="text-xl font-semibold tracking-tight">{children}</h3>;
}

interface CardContentProps {
  children: ReactNode;
}

export function CardContent({ children }: CardContentProps): React.JSX.Element {
  return <div className="p-6 pt-0">{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
}

export function CardFooter({ children }: CardFooterProps): React.JSX.Element {
  return <div className="flex items-center p-6 pt-0">{children}</div>;
}
