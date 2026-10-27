import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StoredRefreshToken, RefreshTokenRevocationResult } from "@/features/auth/types/auth.types";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshExpiration,
  hashRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/tokens";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs" as const;

export async function POST(): Promise<NextResponse> {
  const cookieStore: Awaited<ReturnType<typeof cookies>> = await cookies();
  const oldToken: string | undefined = cookieStore.get("refresh_token")?.value;

  if (!oldToken) {
    const response: NextResponse = NextResponse.json(
      { error: "La sesión ha expirado." },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  try {
    const userId: string = await verifyRefreshToken(oldToken);
    const oldTokenHash: string = hashRefreshToken(oldToken);

    const storedToken: StoredRefreshToken | null = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldTokenHash },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.userId !== userId ||
      storedToken.revokedAt !== null ||
      storedToken.expiresAt <= new Date()
    ) {
      const response: NextResponse = NextResponse.json(
        { error: "La sesión no es válida." },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const newRefreshToken: string = await createRefreshToken(userId);
    const newHash: string = hashRefreshToken(newRefreshToken);

    const rotated: boolean = await prisma.$transaction(async (tx) => {
      const revocation: RefreshTokenRevocationResult = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (revocation.count !== 1) {
        return false;
      }

      await tx.refreshToken.create({
        data: {
          userId,
          tokenHash: newHash,
          expiresAt: getRefreshExpiration(),
        },
      });

      return true;
    });

    if (!rotated) {
      const response: NextResponse = NextResponse.json(
        { error: "La sesión ya no es válida." },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const accessToken: string = await createAccessToken(
      storedToken.user.id,
      storedToken.user.role,
    );

    const response: NextResponse = NextResponse.json({ success: true });
    setAuthCookies(response, accessToken, newRefreshToken);

    return response;
  } catch {
    const response: NextResponse = NextResponse.json(
      { error: "La sesión ha expirado o no es válida." },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }
}
