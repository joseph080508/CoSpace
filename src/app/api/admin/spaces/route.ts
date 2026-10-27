import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  createSpace,
  getAllSpaces,
  SpaceAdminError,
} from "@/features/admin/services/space-admin.service";
import { createSpaceSchema } from "@/features/admin/schemas/space-admin.schema";
import type { AdminSpace, AdminSpaceList, CreateSpaceInput } from "@/features/admin/types/space-admin.types";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();
    const spaces: AdminSpaceList = await getAllSpaces();
    return NextResponse.json({ data: spaces });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    return NextResponse.json(
      { error: "No se pudieron consultar los espacios." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const input: CreateSpaceInput = createSpaceSchema.parse(body);
    const space: AdminSpace = await createSpace(input);

    return NextResponse.json({ data: space }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos.", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof SpaceAdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "No se pudo crear el espacio." },
      { status: 500 },
    );
  }
}
