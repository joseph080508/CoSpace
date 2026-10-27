"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { useAuth } from "@/features/auth/components/AuthProvider";

type Reservation = { id: string; startAt: string; endAt: string; hours: number; totalPrice: string | number; status: "CONFIRMED" | "CANCELLED"; space: { id: string; name: string; type: string; imageUrl: string | null; pricePerHour: string | number } };
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

async function authorizedGet(refreshSession: () => Promise<boolean>): Promise<Response> {
  let response = await fetch("/api/reservations", { cache: "no-store" });
  if (response.status === 401 && await refreshSession()) response = await fetch("/api/reservations", { cache: "no-store" });
  return response;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage(); const [reservations, setReservations] = useState<Reservation[]>([]);
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [busyId, setBusyId] = useState(""); const [notice, setNotice] = useState(""); const [currentTime, setCurrentTime] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await authorizedGet(refreshSession);
      if (r.status === 401) { router.replace("/login?next=/dashboard"); return; }
      if (!r.ok) { setError(t("common_error")); return; }
      const data = await r.json() as { reservations: Reservation[]; currentTime: string };
      setReservations(data.reservations); setCurrentTime(new Date(data.currentTime).getTime());
    } catch { setError(t("network_error")); } finally { setLoading(false); }
  }, [refreshSession, router, t]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  async function cancel(id: string) {
    setBusyId(id); setError(""); setNotice("");
    try {
      let response = await fetch(`/api/reservations/${id}/cancel`, { method: "PATCH" });
      if (response.status === 401 && await refreshSession()) response = await fetch(`/api/reservations/${id}/cancel`, { method: "PATCH" });
      const data = await response.json() as { error?: string };
      if (response.status === 401) { router.replace("/login?next=/dashboard"); return; }
      if (!response.ok) { setError(data.error ?? t("common_error")); return; }
      setNotice(t("reservation_cancelled")); await load();
    } catch { setError(t("network_error")); } finally { setBusyId(""); }
  }
  const future = reservations.filter(item => item.status === "CONFIRMED" && new Date(item.startAt).getTime() > currentTime);
  const past = reservations.filter(item => !future.includes(item));
  return <main className="dashboard-page"><div className="container"><header className="dashboard-heading"><div><span className="section-kicker">COSPACE</span><h1>{t("dashboard_title")}</h1><p>{user ? `${t("dashboard_greeting")}, ${user.name}` : t("dashboard_subtitle")}</p></div><div className="dashboard-actions"><LanguageSelector /><Link href="/espacios" className="button button-primary">{t("dashboard_view_spaces")}</Link><LogoutButton /></div></header>
    {error && <p className="form-error" role="alert">{error} <button className="inline-action" onClick={() => void load()}>{t("retry")}</button></p>}{notice && <p className="form-success" role="status">{notice}</p>}
    {loading ? <div className="loading-panel" aria-live="polite">{t("dashboard_loading")}</div> : reservations.length === 0 ? <section className="empty-spaces"><div className="empty-spaces-icon">⌂</div><h2>{t("dashboard_no_reservations")}</h2><p>{t("dashboard_start_booking")}</p><Link href="/espacios" className="button button-primary">{t("dashboard_view_spaces")}</Link></section> : <>
      <section className="reservation-section"><h2>{t("upcoming_reservations")} <span className="count-pill">{future.length}</span></h2>{future.length === 0 ? <p className="muted">{t("no_upcoming_reservations")}</p> : <div className="reservation-list">{future.map(item => <article className="reservation-card" key={item.id}><div className="reservation-thumb">{item.space.imageUrl ? <Image src={item.space.imageUrl} alt="" fill sizes="100px" style={{ objectFit: "cover" }} /> : <span>⌂</span>}</div><div className="reservation-main"><span className="section-kicker">{t(`space_${item.space.type}`)}</span><h3>{item.space.name}</h3><p>{dateTime.format(new Date(item.startAt))} – {dateTime.format(new Date(item.endAt))}</p></div><div className="reservation-meta"><strong>{money.format(Number(item.totalPrice))}</strong><span>{item.hours} {t("hours")}</span><button className="button button-outline cancel-button" disabled={busyId === item.id} onClick={() => void cancel(item.id)}>{busyId === item.id ? t("working") : t("dashboard_cancel")}</button></div></article>)}</div>}</section>
      <section className="reservation-section"><h2>{t("past_reservations")}</h2>{past.length === 0 ? <p className="muted">{t("no_past_reservations")}</p> : <div className="reservation-list">{past.map(item => <article className="reservation-card past-card" key={item.id}><div className="reservation-main"><span className={`status-pill status-${item.status.toLowerCase()}`}>{t(item.status === "CONFIRMED" ? "status_confirmed" : "status_cancelled")}</span><h3>{item.space.name}</h3><p>{dateTime.format(new Date(item.startAt))}</p></div><div className="reservation-meta"><strong>{money.format(Number(item.totalPrice))}</strong><span>{item.hours} {t("hours")}</span></div></article>)}</div>}</section>
    </>}</div></main>;
}
