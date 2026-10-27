import { describe, it, expect } from "vitest";
import { createReservationSchema } from "@/features/reservations/schemas/reservation.schema";
import { createSpaceSchema, updateSpaceSchema } from "@/features/admin/schemas/space-admin.schema";
import { loginSchema, registerSchema } from "@/features/auth/schemas/auth.schema";
import { hasFutureConfirmedReservations, hasReachedFutureReservationLimit, intervalsOverlap, mayCancelReservation, reservationDateError, reservationTotal } from "@/features/reservations/services/reservation.rules";

describe("Reservation schema validation", () => {
  it("accepts a valid reservation", () => {
    const result = createReservationSchema.safeParse({
      spaceId: "spc_123",
      startAt: "2026-11-01T09:00:00.000Z",
      hours: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects duration below 1 hour", () => {
    const result = createReservationSchema.safeParse({
      spaceId: "spc_123",
      startAt: "2026-11-01T09:00:00.000Z",
      hours: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration above 4 hours", () => {
    const result = createReservationSchema.safeParse({
      spaceId: "spc_123",
      startAt: "2026-11-01T09:00:00.000Z",
      hours: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing spaceId", () => {
    const result = createReservationSchema.safeParse({
      startAt: "2026-11-01T09:00:00.000Z",
      hours: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime", () => {
    const result = createReservationSchema.safeParse({
      spaceId: "spc_123",
      startAt: "not-a-date",
      hours: 2,
    });
    expect(result.success).toBe(false);
  });
});

describe("Space admin schema validation", () => {
  it("accepts a valid space creation", () => {
    const result = createSpaceSchema.safeParse({
      name: "Sala de Reuniones",
      description: "Sala equipada para reuniones de equipo.",
      type: "MEETING_ROOM",
      capacity: 8,
      pricePerHour: 45000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects name too short", () => {
    const result = createSpaceSchema.safeParse({
      name: "A",
      description: "Sala equipada para reuniones de equipo.",
      type: "MEETING_ROOM",
      capacity: 8,
      pricePerHour: 45000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description too short", () => {
    const result = createSpaceSchema.safeParse({
      name: "Sala de Reuniones",
      description: "Corto",
      type: "MEETING_ROOM",
      capacity: 8,
      pricePerHour: 45000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative capacity", () => {
    const result = createSpaceSchema.safeParse({
      name: "Sala de Reuniones",
      description: "Sala equipada para reuniones de equipo.",
      type: "MEETING_ROOM",
      capacity: -1,
      pricePerHour: 45000,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid partial update", () => {
    const result = updateSpaceSchema.safeParse({
      name: "Nuevo nombre",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty update", () => {
    const result = updateSpaceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("Auth schema validation", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "usuario@ejemplo.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "no-es-un-correo",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password on register", () => {
    const result = registerSchema.safeParse({
      name: "Usuario",
      email: "usuario@ejemplo.com",
      password: "corto",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid register", () => {
    const result = registerSchema.safeParse({
      name: "Usuario Test",
      email: "usuario@ejemplo.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("Reservation business rules in America/Bogota", () => {
  const now = new Date("2026-10-27T15:00:00.000Z");

  it("accepts whole-hour reservations within opening hours", () => {
    expect(reservationDateError(new Date("2026-10-28T14:00:00.000Z"), new Date("2026-10-28T16:00:00.000Z"), now)).toBeNull();
  });

  it("rejects minute offsets and a booking that ends after 21:00", () => {
    expect(reservationDateError(new Date("2026-10-28T14:30:00.000Z"), new Date("2026-10-28T15:30:00.000Z"), now)).toContain("horas completas");
    expect(reservationDateError(new Date("2026-10-29T01:00:00.000Z"), new Date("2026-10-29T03:00:00.000Z"), now)).toContain("07:00 a 21:00");
  });

  it("rejects past and more-than-30-day starts", () => {
    expect(reservationDateError(new Date("2026-10-27T14:00:00.000Z"), new Date("2026-10-27T15:00:00.000Z"), now)).toContain("futuro");
    expect(reservationDateError(new Date("2026-11-27T15:01:00.000Z"), new Date("2026-11-27T16:01:00.000Z"), now)).toContain("30 días");
  });

  it("treats exact end-to-start boundaries as non-overlapping", () => {
    const noon = new Date("2026-10-28T17:00:00.000Z");
    expect(intervalsOverlap(new Date("2026-10-28T16:00:00.000Z"), noon, noon, new Date("2026-10-28T18:00:00.000Z"))).toBe(false);
    expect(intervalsOverlap(new Date("2026-10-28T16:00:00.000Z"), new Date("2026-10-28T18:00:00.000Z"), new Date("2026-10-28T17:00:00.000Z"), new Date("2026-10-28T19:00:00.000Z"))).toBe(true);
  });

  it("enforces the three-future-reservation limit", () => {
    expect(hasReachedFutureReservationLimit(2)).toBe(false);
    expect(hasReachedFutureReservationLimit(3)).toBe(true);
  });

  it("blocks deactivation when a space has future confirmed reservations", () => {
    expect(hasFutureConfirmedReservations(0)).toBe(false);
    expect(hasFutureConfirmedReservations(1)).toBe(true);
  });

  it("calculates the total from the stored hourly price", () => {
    expect(reservationTotal("12500.50", 3).toFixed(2)).toBe("37501.50");
  });

  it("allows cancellation only two hours ahead for users, while admins can cancel", () => {
    const start = new Date("2026-10-28T16:00:00.000Z");
    expect(mayCancelReservation(start, new Date("2026-10-28T13:59:00.000Z"), false)).toBe(true);
    expect(mayCancelReservation(start, new Date("2026-10-28T14:01:00.000Z"), false)).toBe(false);
    expect(mayCancelReservation(start, new Date("2026-10-28T15:00:00.000Z"), true)).toBe(true);
  });
});
