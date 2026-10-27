"use client";
import Link from "next/link";
import LoginForm from "@/features/auth/components/LoginForm";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();
  return <main className="auth-page"><section className="auth-card"><Link href="/" className="brand"><span className="brand-mark">c</span><span>co<span className="brand-accent">space</span></span></Link><p className="section-kicker">{t("login_kicker")}</p><h1>{t("auth_login_title")}</h1><p className="muted">{t("login_description")}</p><LoginForm /><p className="auth-switch">{t("login_no_account")} <Link href="/registro">{t("nav_register")}</Link></p></section></main>;
}
