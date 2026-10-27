import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ExistingUser, RegisteredUser } from "@/features/auth/types/auth.types";
import { registerSchema } from "@/features/auth/schemas/auth.schema";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshExpiration,
  hashRefreshToken,
} from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs" as const;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed: ReturnType<typeof registerSchema.safeParse> = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de registro inválidos." },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser: ExistingUser | null = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "No fue posible registrar esta cuenta." },
        { status: 409 },
      );
    }

    const passwordHash: string = await hash(password, 12);

    const user: RegisteredUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const accessToken: string = await createAccessToken(user.id, user.role);
    const refreshToken: string = await createRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshExpiration(),
      },
    });

    const response: NextResponse = NextResponse.json({ user }, { status: 201 });
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "No fue posible registrar esta cuenta." },
        { status: 409 },
      );
    }

    console.error("Error al registrar usuario:", error);

    return NextResponse.json(
      { error: "Ocurrió un error al crear la cuenta." },
      { status: 500 },
    );
  }
}
