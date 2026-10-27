"use client";
import Link from "next/link";
import RegisterForm from "@/features/auth/components/RegisterForm";
import { useLanguage } from "@/i18n/LanguageContext";

export default function RegisterPage() {
  const { t } = useLanguage();
  return <main className="auth-page"><section className="auth-card"><Link href="/" className="brand"><span className="brand-mark">c</span><span>co<span className="brand-accent">space</span></span></Link><p className="section-kicker">{t("register_kicker")}</p><h1>{t("auth_register_title")}</h1><p className="muted">{t("register_description")}</p><RegisterForm /><p className="auth-switch">{t("register_have_account")} <Link href="/login">{t("nav_login")}</Link></p></section></main>;
}
