import { NextResponse } from "next/server";
import { getActiveSpaceById } from "@/features/spaces/services/space.service";
import type { SpaceRouteContext } from "@/features/spaces/types/space.types";

export async function GET(_request: Request, context: SpaceRouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const space: Awaited<ReturnType<typeof getActiveSpaceById>> = await getActiveSpaceById(id);

    if (!space) {
      return NextResponse.json(
        { error: "Espacio no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ space });
  } catch {
    console.error("Error al consultar el espacio.");

    return NextResponse.json(
      { error: "No fue posible obtener el espacio." },
      { status: 500 },
    );
  }
}
