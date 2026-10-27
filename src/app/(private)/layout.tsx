"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, refreshSession } = useAuth();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/dashboard");
  }, [router, status]);

  if (status === "loading") return <main className="loading-panel min-h-screen">Comprobando sesión…</main>;
  if (status === "error") return <main className="loading-panel min-h-screen"><p>No se pudo comprobar la sesión.</p><button className="inline-action" onClick={() => void refreshSession()}>Reintentar</button></main>;
  if (status !== "authenticated") return null;
  return children;
}
