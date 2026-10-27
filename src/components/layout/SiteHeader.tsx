"use client";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function SiteHeader() {
  const { t } = useLanguage();
  const { status, user, refreshSession } = useAuth();
  return (
    <header className="site-header">
      <div className="container nav-container">
        <Link href="/" className="brand" aria-label="CoSpace, inicio">
          <span className="brand-mark">c</span><span>co<span className="brand-accent">space</span></span>
        </Link>
        <nav className="main-nav" aria-label="Navegación principal">
          <Link className="nav-link" href="/">{t("nav_home")}</Link>
          <Link className="nav-link" href="/espacios">{t("nav_spaces")}</Link>
        </nav>
        <div className="nav-actions">
          <LanguageSelector />
          {status === "loading" ? <span className="nav-session-loading" aria-hidden="true" /> : null}
          {status === "error" ? <button className="inline-action" onClick={() => void refreshSession()}>{t("retry")}</button> : null}
          {status === "anonymous" ? <>
            <Link className="login-link" href="/login">{t("nav_login")}</Link>
            <Link className="button button-small" href="/registro">{t("nav_register")}</Link>
          </> : null}
          {status === "authenticated" && user ? <>
            <span className="header-user-name">{user.name}</span>
            {user.role === "ADMIN" ? <Link className="button button-small" href="/admin">{t("nav_admin")}</Link> : null}
            <Link className="login-link" href="/dashboard">{t("nav_dashboard")}</Link>
            <LogoutButton />
          </> : null}
        </div>
      </div>
    </header>
  );
}
