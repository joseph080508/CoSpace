import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();
    const reservations = await prisma.reservation.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        space: { select: { id: true, name: true } },
      },
      orderBy: { startAt: "desc" },
    });
    return NextResponse.json({ data: reservations });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }
    return NextResponse.json({ error: "No se pudieron consultar las reservas." }, { status: 500 });
  }
}