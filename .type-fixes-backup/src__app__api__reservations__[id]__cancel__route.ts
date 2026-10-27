import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  cancelReservation,
  ReservationError,
} from "@/features/reservations/services/reservation.service";
import type { ReservationRouteContext } from "@/features/reservations/types/reservation.types";

export const runtime = "nodejs" as const;

export async function PATCH(
  _request: Request,
  context: ReservationRouteContext,
): Promise<NextResponse> {
  try {
    const user: Awaited<ReturnType<typeof requireUser>> = await requireUser();
    const { id } = await context.params;

    const reservation: Awaited<ReturnType<typeof cancelReservation>> = await cancelReservation(
      id,
      user.id,
      user.role === "ADMIN",
    );

    return NextResponse.json({ reservation });
  } catch (error) {
    if (error instanceof ReservationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 },
      );
    }

    console.error("Error al cancelar reserva:", error);

    return NextResponse.json(
      { error: "No fue posible cancelar la reserva." },
      { status: 500 },
    );
  }
}