import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  deactivateSpace,
  SpaceAdminError,
  updateSpace,
} from "@/features/admin/services/space-admin.service";
import { updateSpaceSchema } from "@/features/admin/schemas/space-admin.schema";
import type { AdminSpaceRouteContext, AdminSpace, UpdateSpaceInput } from "@/features/admin/types/space-admin.types";

export async function PATCH(
  request: Request,
  context: AdminSpaceRouteContext,
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const { id } = await context.params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const input: UpdateSpaceInput = updateSpaceSchema.parse(body);
    const space: AdminSpace = await updateSpace(id, input);

    return NextResponse.json({ data: space });
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
      { error: "No se pudo actualizar el espacio." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: AdminSpaceRouteContext,
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const space: AdminSpace = await deactivateSpace(id);

    return NextResponse.json({ data: space });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    if (error instanceof SpaceAdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "No se pudo desactivar el espacio." },
      { status: 500 },
    );
  }
}
