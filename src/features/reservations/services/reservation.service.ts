import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import type {
  CreateReservationInput,
  CancelledReservation,
  CreatedReservation,
  UserReservationList,
} from "@/features/reservations/types/reservation.types";
import { hasReachedFutureReservationLimit, mayCancelReservation, reservationDateError, reservationTotal } from "@/features/reservations/services/reservation.rules";

const MAX_FUTURE_RESERVATIONS: number = 3;
const MIN_BOOKING_HOURS: number = 1;
const MAX_BOOKING_HOURS: number = 4;

export class ReservationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

function isPrismaConcurrencyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function createReservation(
  userId: string,
  input: CreateReservationInput,
): Promise<CreatedReservation> {
  if (
    !Number.isInteger(input.hours) ||
    input.hours < MIN_BOOKING_HOURS ||
    input.hours > MAX_BOOKING_HOURS
  ) {
    throw new ReservationError(
      "La duración debe ser de entre 1 y 4 horas completas.",
      400,
    );
  }

  const startAt: Date = new Date(input.startAt);

  if (!Number.isFinite(startAt.getTime())) {
    throw new ReservationError("Fecha de inicio inválida.", 400);
  }

  const now: Date = new Date();

  const endAt: Date = new Date(
    startAt.getTime() + input.hours * 60 * 60 * 1000,
  );

  const dateError = reservationDateError(startAt, endAt, now);
  if (dateError) throw new ReservationError(dateError, 400);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const checkedAt = new Date();
        const changedDateError = reservationDateError(startAt, endAt, checkedAt);
        if (changedDateError) throw new ReservationError(changedDateError, 400);

        const space = await tx.space.findFirst({
          where: {
            id: input.spaceId,
            isActive: true,
          },
        });

        if (!space) {
          throw new ReservationError(
            "El espacio no existe o está inactivo.",
            404,
          );
        }

        const futureReservations: number =
          await tx.reservation.count({
            where: {
              userId,
              status: "CONFIRMED",
              startAt: { gt: checkedAt },
            },
          });

        if (hasReachedFutureReservationLimit(futureReservations, MAX_FUTURE_RESERVATIONS)) {
          throw new ReservationError(
            "Ya tienes tres reservas futuras confirmadas.",
            409,
          );
        }

        const overlappingSpaceReservation =
          await tx.reservation.findFirst({
            where: {
              spaceId: space.id,
              status: "CONFIRMED",
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
            select: { id: true },
          });

        if (overlappingSpaceReservation) {
          throw new ReservationError(
            "El espacio ya está reservado en ese horario.",
            409,
          );
        }

        const overlappingUserReservation =
          await tx.reservation.findFirst({
            where: {
              userId,
              status: "CONFIRMED",
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
            select: { id: true },
          });

        if (overlappingUserReservation) {
          throw new ReservationError(
            "Ya tienes otra reserva en ese horario.",
            409,
          );
        }

        const totalPrice: Prisma.Decimal = reservationTotal(space.pricePerHour, input.hours);

        return tx.reservation.create({
          data: {
            userId,
            spaceId: space.id,
            startAt,
            endAt,
            hours: input.hours,
            totalPrice,
          },
          select: {
            id: true,
            spaceId: true,
            startAt: true,
            endAt: true,
            hours: true,
            totalPrice: true,
            status: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error: unknown) {
    if (error instanceof ReservationError) {
      throw error;
    }

    if (isPrismaConcurrencyError(error)) {
      throw new ReservationError(
        "La reserva entró en conflicto con otra operación. Intenta nuevamente.",
        409,
      );
    }

    throw error;
  }
}

export async function cancelReservation(
  reservationId: string,
  userId: string,
  isAdmin: boolean,
): Promise<CancelledReservation> {
  const now: Date = new Date();

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new ReservationError("Reserva no encontrada.", 404);
    }

    if (!isAdmin && reservation.userId !== userId) {
      throw new ReservationError(
        "No tienes permiso para cancelar esta reserva.",
        403,
      );
    }

    if (reservation.status === "CANCELLED") {
      throw new ReservationError(
        "Esta reserva ya está cancelada.",
        409,
      );
    }

    if (!mayCancelReservation(reservation.startAt, now, isAdmin)) {
        throw new ReservationError(
          "Solo puedes cancelar hasta dos horas antes del inicio.",
          400,
        );
    }

    const updated = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        status: "CONFIRMED",
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (updated.count !== 1) {
      throw new ReservationError(
        "La reserva cambió de estado. Intenta nuevamente.",
        409,
      );
    }

    return {
      id: reservation.id,
      status: "CANCELLED",
    };
  });
}

export async function getUserReservations(
  userId: string,
): Promise<UserReservationList> {
  return prisma.reservation.findMany({
    where: { userId },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      hours: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      space: {
        select: {
          id: true,
          name: true,
          type: true,
          imageUrl: true,
          pricePerHour: true,
        },
      },
    },
    orderBy: { startAt: "desc" },
  });
}
