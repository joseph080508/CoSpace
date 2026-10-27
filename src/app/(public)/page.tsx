"use client";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageContext";

export const dynamic = "force-static";

export default function Home() {
  const { t } = useLanguage();
  return (
    <main className="cospace-page">
      <section className="hero-section"><div className="container">
        <div className="hero-grid"><div className="hero-content">
          <p className="eyebrow"><span className="eyebrow-dot" /> {t("home_eyebrow")}</p>
          <h1>{t("home_hero_before")} <span>{t("home_hero_emphasis")}</span></h1>
          <p className="hero-description">{t("home_hero_description")}</p>
          <div className="hero-actions"><Link className="button button-primary" href="/espacios">{t("home_cta")} <span aria-hidden="true">→</span></Link><Link className="button button-outline" href="/registro">{t("home_register_cta")}</Link></div>
          <div className="hero-trust"><span className="trust-icon" aria-hidden="true">✓</span><p><strong>{t("home_trust_title")}</strong><span>{t("home_trust_description")}</span></p></div>
        </div><div className="hero-visual"><div className="hero-image hero-image-photo"><Image src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85" alt="Coworking workspace" fill priority sizes="(max-width: 700px) 100vw, 48vw" style={{ objectFit: "cover" }} /><div className="hero-image-content"><span className="image-label">{t("home_image_label")}</span><p>{t("home_image_title")}</p></div></div><div className="floating-card"><span className="floating-card-icon">⌂</span><div><strong>{t("home_float_title")}</strong><span>{t("home_float_desc")}</span></div></div><p className="hero-caption"><span className="caption-line" /> {t("home_caption")}</p></div></div>
        <div className="hero-bottom"><div className="hero-bottom-item"><strong className="stat-number">01</strong><span>{t("home_step_1")}</span></div><div className="hero-bottom-item"><strong className="stat-number">02</strong><span>{t("home_step_2")}</span></div><div className="hero-bottom-item"><strong className="stat-number">03</strong><span>{t("home_step_3")}</span></div></div>
      </div></section>
      <section className="section-padding featured-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">{t("home_benefits_kicker")}</span><h2>{t("home_benefits_title")}<br /><span>{t("home_benefits_emphasis")}</span></h2></div><Link className="text-link" href="/espacios">{t("spaces_title")} <span>→</span></Link></div><div className="benefits-grid landing-benefits"><article className="benefit-item"><span className="benefit-number">01</span><h3>{t("home_benefit_1_title")}</h3><p>{t("home_benefit_1_desc")}</p></article><article className="benefit-item"><span className="benefit-number">02</span><h3>{t("home_benefit_2_title")}</h3><p>{t("home_benefit_2_desc")}</p></article><article className="benefit-item"><span className="benefit-number">03</span><h3>{t("home_benefit_3_title")}</h3><p>{t("home_benefit_3_desc")}</p></article></div></div></section>
      <section className="about-section section-padding"><div className="container about-grid"><div className="about-heading"><span className="section-kicker">{t("home_final_kicker")}</span><h2>{t("home_final_title")}<br /><span>{t("home_final_emphasis")}</span></h2></div><div className="about-content"><p>{t("home_final_description")}</p><div className="hero-actions" style={{ marginTop: 24 }}><Link className="button button-primary" href="/espacios">{t("home_cta")} <span aria-hidden="true">→</span></Link></div></div></div></section>
    </main>
  );
}
