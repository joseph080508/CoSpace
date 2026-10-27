"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { useAuth } from "@/features/auth/components/AuthProvider";

type Space = { id: string; name: string; description: string; type: "DESK" | "MEETING_ROOM" | "BOOTH"; imageUrl: string | null; capacity: number; pricePerHour: string | number; isActive: boolean };
type AdminReservation = { id: string; startAt: string; endAt: string; hours: number; totalPrice: string | number; status: string; user: { name: string; email: string }; space: { name: string } };
const blank = { name: "", description: "", type: "DESK", capacity: 1, pricePerHour: 12000, imageUrl: "" };
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

export default function AdminPage() {
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]); const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [form, setForm] = useState(blank); const [editing, setEditing] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try {
    let [spaceResponse, reservationResponse] = await Promise.all([fetch("/api/admin/spaces", { cache: "no-store" }), fetch("/api/admin/reservations", { cache: "no-store" })]);
    if (spaceResponse.status === 401 || reservationResponse.status === 401) {
      if (await refreshSession()) [spaceResponse, reservationResponse] = await Promise.all([fetch("/api/admin/spaces", { cache: "no-store" }), fetch("/api/admin/reservations", { cache: "no-store" })]);
    }
    if (!spaceResponse.ok || !reservationResponse.ok) { setError(spaceResponse.status === 403 || reservationResponse.status === 403 ? "Tu cuenta no tiene permisos de administración." : "No se pudieron cargar los datos del panel."); return; }
    const [spaceData, reservationData] = await Promise.all([spaceResponse.json() as Promise<{ data: Space[] }>, reservationResponse.json() as Promise<{ data: AdminReservation[] }>]); setSpaces(spaceData.data); setReservations(reservationData.data);
  } catch { setError("Error de red al consultar el panel."); } finally { setLoading(false); } }, [refreshSession]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  function edit(space: Space) { setEditing(space.id); setForm({ name: space.name, description: space.description, type: space.type, capacity: space.capacity, pricePerHour: Number(space.pricePerHour), imageUrl: space.imageUrl ?? "" }); }
  function reset() { setEditing(""); setForm(blank); }
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); setNotice(""); try {
    const response = await fetch(editing ? `/api/admin/spaces/${editing}` : "/api/admin/spaces", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, imageUrl: form.imageUrl || null }) });
    const data = await response.json() as { error?: string }; if (!response.ok) { setError(data.error ?? "No se pudo guardar el espacio."); return; }
    setNotice(editing ? "Espacio actualizado." : "Espacio creado."); reset(); await load();
  } catch { setError("Error de red."); } finally { setBusy(false); } }
  async function deactivate(space: Space) { if (!window.confirm(`¿Desactivar “${space.name}”?`)) return; setError(""); setNotice(""); try {
    const response = await fetch(`/api/admin/spaces/${space.id}`, { method: "DELETE" }); const data = await response.json() as { error?: string }; if (!response.ok) { setError(data.error ?? "No se pudo desactivar el espacio."); return; }
    setNotice("Espacio desactivado."); await load();
  } catch { setError("Error de red."); } }
  const active = spaces.filter(space => space.isActive).length;
  return <main className="admin-page"><div className="container"><header className="admin-topbar"><div><span className="section-kicker">COSPACE · ADMIN</span><h1>{t("admin_title")}</h1><p>{t("admin_subtitle")}</p></div><div className="dashboard-actions"><LanguageSelector /><Link href="/" className="button button-outline">{t("admin_back_site")}</Link><LogoutButton /></div></header>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    <section className="metrics-grid"><article className="metric-card"><span>{t("admin_metric_total_spaces")}</span><strong>{loading ? "—" : spaces.length}</strong></article><article className="metric-card"><span>{t("admin_metric_active")}</span><strong>{loading ? "—" : active}</strong></article><article className="metric-card"><span>{t("admin_metric_confirmed")}</span><strong>{loading ? "—" : reservations.filter(item => item.status === "CONFIRMED").length}</strong></article><article className="metric-card"><span>{t("admin_metric_cancelled")}</span><strong>{loading ? "—" : reservations.filter(item => item.status === "CANCELLED").length}</strong></article></section>
    <div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><div><span className="section-kicker">{t("admin_catalog")}</span><h2>{t("admin_spaces")}</h2></div></div>{loading ? <p className="muted">{t("common_loading")}</p> : spaces.length === 0 ? <p className="muted">{t("admin_no_spaces")}</p> : <div className="admin-space-list">{spaces.map(space => <article className="admin-space-row" key={space.id}><div><strong>{space.name}</strong><p>{t(`space_${space.type}`)} · {space.capacity} {t("person_plural")} · {money.format(Number(space.pricePerHour))}/h</p><span className={`status-pill status-${space.isActive ? "confirmed" : "cancelled"}`}>{space.isActive ? t("admin_space_active") : t("admin_space_inactive")}</span></div><div className="admin-row-actions"><button className="inline-action" onClick={() => edit(space)}>{t("admin_edit_btn")}</button>{space.isActive && <button className="inline-action danger-action" onClick={() => void deactivate(space)}>{t("admin_deactivate")}</button>}</div></article>)}</div>}</section>
    <section className="admin-panel"><div className="panel-heading"><div><span className="section-kicker">{editing ? t("admin_edit_space") : t("admin_create_space")}</span><h2>{editing ? t("admin_edit_space") : t("admin_create_space")}</h2></div></div><form className="form-stack admin-form" onSubmit={save}><label>{t("admin_space_name")}<input required minLength={2} maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>{t("admin_description")}<textarea required minLength={10} maxLength={2000} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label>{t("admin_space_type")}<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Space["type"] })}><option value="DESK">{t("space_DESK")}</option><option value="MEETING_ROOM">{t("space_MEETING_ROOM")}</option><option value="BOOTH">{t("space_BOOTH")}</option></select></label><div className="form-row"><label>{t("admin_space_capacity")}<input type="number" min={1} max={1000} required value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></label><label>{t("admin_space_price")} (COP)<input type="number" min={1} max={10000000} required value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: Number(e.target.value) })} /></label></div><label>{t("admin_image_url")}<input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></label><div className="dashboard-actions"><button className="button button-primary" disabled={busy}>{busy ? t("admin_saving") : editing ? t("admin_save") : t("admin_create_space")}</button>{editing && <button type="button" className="button button-outline" onClick={reset}>{t("admin_cancel")}</button>}</div></form></section></div>
    <section className="admin-panel admin-reservations"><div className="panel-heading"><div><span className="section-kicker">{t("admin_activity")}</span><h2>{t("admin_reservations")}</h2></div><button className="inline-action" onClick={() => void load()}>{t("admin_refresh")}</button></div>{reservations.length === 0 ? <p className="muted">{t("admin_no_reservations")}</p> : <div className="table-scroll"><table><thead><tr><th>{t("admin_spaces")}</th><th>{t("admin_reservation_user")}</th><th>{t("admin_reservation_start")} (Bogotá)</th><th>{t("dashboard_duration")}</th><th>{t("dashboard_price")}</th><th>{t("dashboard_status")}</th></tr></thead><tbody>{reservations.map(item => <tr key={item.id}><td>{item.space.name}</td><td>{item.user.name}<small>{item.user.email}</small></td><td>{dateTime.format(new Date(item.startAt))}</td><td>{item.hours} h</td><td>{money.format(Number(item.totalPrice))}</td><td>{t(item.status === "CONFIRMED" ? "status_confirmed" : "status_cancelled")}</td></tr>)}</tbody></table></div>}</section>
  </div></main>;
}
