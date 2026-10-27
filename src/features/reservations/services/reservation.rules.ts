import { Prisma } from "../../../../generated/prisma/client";

const MAX_ADVANCE_DAYS = 30;
const OPENING_HOUR = 7;
const CLOSING_HOUR = 21;
const BOGOTA_OFFSET_HOURS = 5;
const CANCELLATION_NOTICE_HOURS = 2;

export function reservationDateError(startAt: Date, endAt: Date, now: Date): string | null {
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) return "Fecha de inicio inválida.";
  if (startAt <= now) return "La reserva debe comenzar en el futuro.";
  if (startAt.getTime() > now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000) return "Solo puedes reservar con 30 días de anticipación.";
  const offset = BOGOTA_OFFSET_HOURS * 60 * 60 * 1000;
  const localStart = new Date(startAt.getTime() - offset);
  const localEnd = new Date(endAt.getTime() - offset);
  const startHour = localStart.getUTCHours();
  const endHour = localEnd.getUTCHours();
  const endIsAfterClose = endHour > CLOSING_HOUR || (endHour === CLOSING_HOUR && (localEnd.getUTCMinutes() !== 0 || localEnd.getUTCSeconds() !== 0 || localEnd.getUTCMilliseconds() !== 0));
  if (startHour < OPENING_HOUR || startHour >= CLOSING_HOUR || endIsAfterClose || localStart.getUTCMinutes() !== 0 || localStart.getUTCSeconds() !== 0 || localStart.getUTCMilliseconds() !== 0) {
    return "El horario permitido es de 07:00 a 21:00, en horas completas (America/Bogota).";
  }
  return null;
}

export function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}

export function hasReachedFutureReservationLimit(count: number, limit = 3): boolean {
  return count >= limit;
}

export function hasFutureConfirmedReservations(count: number): boolean {
  return count > 0;
}

export function reservationTotal(hourlyPrice: Prisma.Decimal | Prisma.DecimalJsLike | number | string, hours: number): Prisma.Decimal {
  return new Prisma.Decimal(String(hourlyPrice)).mul(hours);
}

export function mayCancelReservation(startAt: Date, now: Date, isAdmin: boolean): boolean {
  return isAdmin || now.getTime() <= startAt.getTime() - CANCELLATION_NOTICE_HOURS * 60 * 60 * 1000;
}
