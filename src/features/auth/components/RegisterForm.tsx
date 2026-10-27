"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function RegisterForm() {
  const router = useRouter(); const { t } = useLanguage();
  const { setAuthenticatedUser } = useAuth();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/registro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json() as { error?: string; user?: { id: string; name: string; email: string; role: "USER" | "ADMIN" } };
      if (!response.ok) { setError(data.error ?? t("common_error")); return; }
      if (!data.user) { setError(t("common_error")); return; }
      setAuthenticatedUser(data.user);
      router.replace("/dashboard"); router.refresh();
    } catch { setError(t("network_error")); } finally { setLoading(false); }
  }
  return <form className="form-stack" onSubmit={submit}>
    <label>{t("auth_name")}<input type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} /></label>
    <label>{t("auth_email")}<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} /></label>
    <label>{t("auth_password")}<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={72} /><small>{t("password_hint")}</small></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary form-submit" disabled={loading}>{loading ? t("auth_loading") : t("auth_register_submit")}</button>
  </form>;
}
