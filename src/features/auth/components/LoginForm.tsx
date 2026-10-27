"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function LoginForm() {
  const router = useRouter(); const { t } = useLanguage();
  const { setAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as { error?: string; user?: { id: string; name: string; email: string; role: "USER" | "ADMIN" } };
      if (!response.ok) { setError(data.error ?? t("common_error")); return; }
      if (!data.user) { setError(t("common_error")); return; }
      setAuthenticatedUser(data.user);
      router.replace(data.user?.role === "ADMIN" ? "/admin" : "/dashboard"); router.refresh();
    } catch { setError(t("network_error")); } finally { setLoading(false); }
  }
  return <form className="form-stack" onSubmit={submit}>
    <label>{t("auth_email")}<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} /></label>
    <label>{t("auth_password")}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required maxLength={72} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary form-submit" disabled={loading}>{loading ? t("auth_loading") : t("auth_login_submit")}</button>
  </form>;
}
