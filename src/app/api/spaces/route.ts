import { NextResponse } from "next/server";
import { getActiveSpaces } from "@/features/spaces/services/space.service";

export async function GET(): Promise<NextResponse> {
  try {
    const spaces: Awaited<ReturnType<typeof getActiveSpaces>> = await getActiveSpaces();

    return NextResponse.json({ spaces });
  } catch {
    console.error("Error al consultar espacios.");

    return NextResponse.json(
      { error: "No fue posible obtener los espacios." },
      { status: 500 },
    );
  }
}
