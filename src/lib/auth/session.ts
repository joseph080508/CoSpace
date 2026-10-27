import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/tokens";
import type { SessionUser } from "@/features/auth/types/auth.types";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore: Awaited<ReturnType<typeof cookies>> = await cookies();
  const accessToken: string | undefined = cookieStore.get("access_token")?.value;
  const refreshToken: string | undefined = cookieStore.get("refresh_token")?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
  let refreshUserId: string;
  try {
    payload = await verifyAccessToken(accessToken);
    refreshUserId = await verifyRefreshToken(refreshToken);
  } catch {
    return null;
  }

  if (refreshUserId !== payload.userId) return null;

  const activeRefreshToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: payload.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!activeRefreshToken) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function requireUser(): Promise<SessionUser> {
  const user: SessionUser | null = await getSession();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user: SessionUser = await requireUser();

  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return user;
}
