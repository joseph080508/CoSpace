"use client";
import Image from "next/image";
import Link from "next/link";
import ReservationForm from "@/app/(public)/espacios/[id]/ReservationForm";
import { useLanguage } from "@/i18n/LanguageContext";

export interface SpaceDetailData { id: string; name: string; description: string; type: string; imageUrl: string | null; capacity: number; pricePerHour: number; }
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function SpaceDetail({ space }: { space: SpaceDetailData }) {
  const { t } = useLanguage();
  return <main className="detail-page"><div className="container"><Link href="/espacios" className="back-link">{t("spaces_back")}</Link><div className="detail-grid"><div><div className="detail-image">{space.imageUrl ? <Image src={space.imageUrl} alt={space.name} fill priority sizes="(max-width: 800px) 100vw, 60vw" style={{ objectFit: "cover" }} /> : <span aria-hidden="true">⌂</span>}</div><div className="detail-copy"><span className="space-category">{t(`space_${space.type}`)}</span><h1>{space.name}</h1><p>{space.description}</p><div className="detail-facts"><span>♙ {t("capacity_up_to")} {space.capacity} {t(space.capacity === 1 ? "person_singular" : "person_plural")}</span><span>◷ {t("reservation_duration_rule")}</span><span>⌖ {t("reservation_hours_rule")}</span></div></div></div><aside className="booking-card"><p className="space-price"><strong>{currency.format(space.pricePerHour)}</strong><span>{t("price_per_hour")}</span></p><h2>{t("reserve_space_title")}</h2><p className="muted">{t("reserve_space_help")}</p><ReservationForm spaceId={space.id} /></aside></div></div></main>;
}
