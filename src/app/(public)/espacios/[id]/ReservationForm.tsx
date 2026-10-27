"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/components/AuthProvider";

interface ReservationFormProps {
  spaceId: string;
}

export default function ReservationForm({ spaceId }: ReservationFormProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [hours, setHours] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!date || !/^([0-1]\d|2[0-3]):00$/.test(time)) {
        setError(t("reservation_whole_hour"));
        return;
      }
      const startAt = new Date(`${date}T${time}:00-05:00`).toISOString();
      const reservationRequest = () => fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId, startAt, hours }),
      });
      let response = await reservationRequest();
      if (response.status === 401 && await refreshSession()) response = await reservationRequest();
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status === 401) { router.push("/login?next=/espacios/" + spaceId); return; }
        setError(data.error ?? t("common_error"));
        return;
      }
      setSuccess(t("reservation_created"));
      router.push("/dashboard");
    } catch {
      setError(t("network_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-stack booking-form">
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {success ? <p className="form-success" role="status">{success}</p> : null}
      <label htmlFor="date">{t("res_date")}
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <label htmlFor="time">{t("res_time")}
        <input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          step={3600}
          min="07:00"
          max="20:00"
          required
        />
      </label>
      <label htmlFor="hours">{t("res_duration")}
        <select
          id="hours"
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      <p className="muted small-note">{t("price_calculated_server")}</p>
      <button
        type="submit"
        disabled={loading}
        className="button button-primary form-submit"
      >
        {loading ? t("res_submitting") : t("res_submit")}
      </button>
    </form>
  );
}
