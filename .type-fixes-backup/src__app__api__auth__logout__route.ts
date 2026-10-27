import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { clearAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs" as const;

export async function POST(): Promise<NextResponse> {
  try {
    const cookieStore: Awaited<ReturnType<typeof cookies>> = await cookies();
    const refreshToken: string | undefined = cookieStore.get("refresh_token")?.value;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashRefreshToken(refreshToken),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    const response: NextResponse = NextResponse.json({
      message: "Sesión cerrada correctamente.",
    });

    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);

    const response: NextResponse = NextResponse.json(
      { error: "No fue posible cerrar la sesión." },
      { status: 500 },
    );

    clearAuthCookies(response);

    return response;
  }
}
