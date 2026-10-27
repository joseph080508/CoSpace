"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user, refreshSession } = useAuth();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/admin");
    if (status === "authenticated" && user?.role !== "ADMIN") router.replace("/");
  }, [router, status, user]);

  if (status === "loading") return <main className="loading-panel min-h-screen">Comprobando sesión…</main>;
  if (status === "error") return <main className="loading-panel min-h-screen"><p>No se pudo comprobar la sesión.</p><button className="inline-action" onClick={() => void refreshSession()}>Reintentar</button></main>;
  if (status !== "authenticated" || user?.role !== "ADMIN") return null;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 md:flex">
        <div className="px-6 py-5 text-xl font-bold">CoSpace Admin</div>
        <nav className="flex-1 space-y-1 px-3">
          <Link href="/admin" className="block rounded-lg px-3 py-2 hover:bg-slate-800">Dashboard</Link>
        </nav>
        <div className="px-3 py-4 space-y-2">
          <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-slate-800">Volver al sitio</Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold">Panel de administración</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
