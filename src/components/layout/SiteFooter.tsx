"use client";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <Link href="/" className="brand footer-brand"><span className="brand-mark">c</span><span>co<span className="brand-accent">space</span></span></Link>
        <p>{t("footer_tagline")}</p>
        <nav className="footer-links" aria-label="Enlaces del pie de página">
          <Link href="/espacios">{t("nav_spaces")}</Link><Link href="/login">{t("nav_login")}</Link><Link href="/registro">{t("nav_register")}</Link>
        </nav>
        <small className="copyright">© {new Date().getFullYear()} CoSpace</small>
      </div>
    </footer>
  );
}
