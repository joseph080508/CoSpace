import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  adminSpaceSelect,
  type AdminSpace,
  type AdminSpaceList,
  type CreateSpaceInput,
  type UpdateSpaceInput,
  type ExistingSpaceForUpdate,
  type SpaceActivationState,
} from "@/features/admin/types/space-admin.types";
import { hasFutureConfirmedReservations } from "@/features/reservations/services/reservation.rules";

export class SpaceAdminError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SpaceAdminError";
    this.status = status;
  }
}

export async function getAllSpaces(): Promise<AdminSpaceList> {
  return prisma.space.findMany({
    select: adminSpaceSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function createSpace(
  input: CreateSpaceInput,
): Promise<AdminSpace> {
  return prisma.space.create({
    data: {
      name: input.name,
      description: input.description,
      type: input.type,
      imageUrl: input.imageUrl ?? null,
      capacity: input.capacity,
      pricePerHour: new Prisma.Decimal(input.pricePerHour),
    },
    select: adminSpaceSelect,
  });
}

export async function updateSpace(
  id: string,
  input: UpdateSpaceInput,
): Promise<AdminSpace> {
  const existingSpace: ExistingSpaceForUpdate | null = await prisma.space.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingSpace) {
    throw new SpaceAdminError("Espacio no encontrado.", 404);
  }

  return prisma.space.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.imageUrl !== undefined && {
        imageUrl: input.imageUrl,
      }),
      ...(input.capacity !== undefined && {
        capacity: input.capacity,
      }),
      ...(input.pricePerHour !== undefined && {
        pricePerHour: new Prisma.Decimal(input.pricePerHour),
      }),
    },
    select: adminSpaceSelect,
  });
}

export async function deactivateSpace(
  id: string,
): Promise<AdminSpace> {
  try {
    return await prisma.$transaction(async (tx) => {
    const space: SpaceActivationState | null = await tx.space.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!space) {
      throw new SpaceAdminError("Espacio no encontrado.", 404);
    }

    if (!space.isActive) {
      throw new SpaceAdminError("El espacio ya está inactivo.", 409);
    }

    const futureReservations: number = await tx.reservation.count({
      where: {
        spaceId: id,
        status: "CONFIRMED",
        startAt: { gt: new Date() },
      },
    });

    if (hasFutureConfirmedReservations(futureReservations)) {
      throw new SpaceAdminError(
        "No puedes desactivar un espacio con reservas futuras confirmadas.",
        409,
      );
    }

    return tx.space.update({
      where: { id },
      data: { isActive: false },
      select: adminSpaceSelect,
    });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new SpaceAdminError("El espacio cambió durante la operación. Vuelve a intentarlo.", 409);
    }
    throw error;
  }
}
