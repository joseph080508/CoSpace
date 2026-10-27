"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function LogoutButton(): React.JSX.Element {
  const router = useRouter();
  const { t } = useLanguage();
  const { clearSession, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout(): Promise<void> {
    setLoading(true);
    setError("");
    try {
      // Finish any token rotation before revoking the refresh cookie.
      await refreshSession();
      await fetch("/api/auth/logout", { method: "POST" });
      clearSession();
      router.push("/login");
      router.refresh();
    } catch {
      setError(t("network_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="logout-control">
      <button
        onClick={() => void handleLogout()}
        disabled={loading}
        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-800"
      >
        {loading ? t("logout_loading") : t("nav_logout")}
      </button>
      {error && <span className="logout-error" role="alert">{error}</span>}
    </span>
  );
}
