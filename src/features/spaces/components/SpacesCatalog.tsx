"use client";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

export interface SpaceSummary { id: string; name: string; description: string; type: string; imageUrl: string | null; capacity: number; pricePerHour: number; }
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function SpacesCatalog({ spaces, failed }: { spaces: SpaceSummary[]; failed: boolean }) {
  const { t } = useLanguage();
  return <main className="listing-page"><div className="container">
    <header className="page-heading"><span className="section-kicker">{t("catalog_kicker")}</span><h1>{t("catalog_title")} <em>{t("catalog_emphasis")}</em></h1><p>{t("catalog_description")}</p></header>
    {failed ? <section className="empty-spaces"><div className="empty-spaces-icon">!</div><h2>{t("catalog_load_error")}</h2><p>{t("catalog_load_help")}</p><Link href="/espacios" className="button button-primary">{t("retry")}</Link></section> : spaces.length === 0 ? <section className="empty-spaces"><div className="empty-spaces-icon">⌂</div><h2>{t("spaces_empty_title")}</h2><p>{t("spaces_empty")}</p><Link href="/" className="text-link">{t("auth_back_home")}</Link></section> : <div className="spaces-grid">{spaces.map(space => <article className="space-card" key={space.id}>
      <Link href={`/espacios/${space.id}`} className="space-image-link" aria-label={`${t("space_details")}: ${space.name}`}><div className={`space-image${space.imageUrl ? " space-image-has-photo" : ""}`}>{space.imageUrl ? <Image src={space.imageUrl} alt={space.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" style={{ objectFit: "cover" }} /> : <span className="space-placeholder-icon" aria-hidden="true">⌂</span>}<span className="space-category">{t(`space_${space.type}`)}</span><span className="space-image-arrow" aria-hidden="true">↗</span></div></Link>
      <div className="space-card-body"><div className="space-card-heading"><h2>{space.name}</h2><span className="space-capacity">♙ {t("capacity_up_to")} {space.capacity} {t(space.capacity === 1 ? "person_singular" : "person_plural")}</span></div><p className="space-description">{space.description}</p><div className="space-card-footer"><p className="space-price"><strong>{currency.format(space.pricePerHour)}</strong><span>{t("price_per_hour")}</span></p><Link className="space-book-link" href={`/espacios/${space.id}`}>{t("space_details")} <span>→</span></Link></div></div>
    </article>)}</div>}
  </div></main>;
}
