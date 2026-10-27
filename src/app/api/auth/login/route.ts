import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schemas/auth.schema";
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
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Correo o contraseña inválidos." }, { status: 400 }); }
    const parsed: ReturnType<typeof loginSchema.safeParse> = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Correo o contraseña inválidos." },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const user: Awaited<ReturnType<typeof prisma.user.findUnique>> = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 },
      );
    }

    const accessToken: string = await createAccessToken(user.id, user.role);
    const refreshToken: string = await createRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshExpiration(),
      },
    });

    const response: NextResponse = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch {
    console.error("Error al iniciar sesión.");

    return NextResponse.json(
      { error: "No fue posible iniciar sesión." },
      { status: 500 },
    );
  }
}
