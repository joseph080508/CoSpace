import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  createReservation,
  getUserReservations,
  ReservationError,
} from "@/features/reservations/services/reservation.service";
import { createReservationSchema } from "@/features/reservations/schemas/reservation.schema";

export const runtime = "nodejs" as const;

export async function GET(): Promise<NextResponse> {
  try {
    const user: Awaited<ReturnType<typeof requireUser>> = await requireUser();
    const reservations: Awaited<ReturnType<typeof getUserReservations>> = await getUserReservations(user.id);

    return NextResponse.json({ reservations });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 },
      );
    }

    console.error("Error al consultar reservas:", error);

    return NextResponse.json(
      { error: "No fue posible consultar las reservas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user: Awaited<ReturnType<typeof requireUser>> = await requireUser();
    const body: unknown = await request.json();
    const parsed: ReturnType<typeof createReservationSchema.safeParse> = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Los datos de la reserva son inválidos." },
        { status: 400 },
      );
    }

    const reservation: Awaited<ReturnType<typeof createReservation>> = await createReservation(user.id, parsed.data);

    return NextResponse.json({ reservation }, { status: 201 });
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

    console.error("Error al crear reserva:", error);

    return NextResponse.json(
      { error: "No fue posible crear la reserva." },
      { status: 500 },
    );
  }
}