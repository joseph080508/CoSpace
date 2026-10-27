import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import type { CreateReservationInput } from "@/features/reservations/types/reservation.types";
import type {
  CancelledReservation,
  CreatedReservation,
  UserReservationList,
} from "@/features/reservations/types/reservation.types";

const MAX_ADVANCE_DAYS: number = 30;
const MAX_FUTURE_RESERVATIONS: number = 3;

export class ReservationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

export async function createReservation(
  userId: string,
  input: CreateReservationInput,
): Promise<CreatedReservation> {
  const startAt = new Date(input.startAt);
  const now = new Date();
  const endAt = new Date(
    startAt.getTime() + input.hours * 60 * 60 * 1000,
  );

  if (!Number.isFinite(startAt.getTime())) {
    throw new ReservationError("Fecha de inicio inválida.", 400);
  }

  if (startAt <= now) {
    throw new ReservationError(
      "La reserva debe comenzar en el futuro.",
      400,
    );
  }

  const latestStart = new Date(
    now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000,
  );

  if (startAt > latestStart) {
    throw new ReservationError(
      "Solo puedes reservar con 30 días de anticipación.",
      400,
    );
  }

  const startHour = startAt.getHours();
  const endHour = endAt.getHours();
  const endMinutes = endAt.getMinutes();

  if (
    startHour < 7 ||
    startHour >= 21 ||
    endHour > 21 ||
    (endHour === 21 && endMinutes > 0) ||
    startAt.getMinutes() !== 0 ||
    startAt.getSeconds() !== 0 ||
    startAt.getMilliseconds() !== 0
  ) {
    throw new ReservationError(
      "El horario permitido es de 07:00 a 21:00, en horas completas.",
      400,
    );
  }

  return prisma.$transaction(
    async (tx) => {
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

      const futureReservations = await tx.reservation.count({
        where: {
          userId,
          status: "CONFIRMED",
          startAt: { gt: now },
        },
      });

      if (futureReservations >= MAX_FUTURE_RESERVATIONS) {
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

      const totalPrice = new Prisma.Decimal(space.pricePerHour).mul(
        input.hours,
      );

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
}

export async function cancelReservation(
  reservationId: string,
  userId: string,
  isAdmin: boolean,
): Promise<CancelledReservation> {
  const now = new Date();

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

    if (!isAdmin) {
      const cancellationDeadline =
        reservation.startAt.getTime() - 2 * 60 * 60 * 1000;

      if (now.getTime() > cancellationDeadline) {
        throw new ReservationError(
          "Solo puedes cancelar hasta dos horas antes del inicio.",
          400,
        );
      }
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
      status: "CANCELLED" as const,
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