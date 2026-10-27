
import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "../../../generated/prisma/client";
import type { AccessTokenPayload } from "@/features/auth/types/auth.types";

function getExpiration(name: "ACCESS_TOKEN_EXPIRES_IN" | "REFRESH_TOKEN_EXPIRES_IN", fallback: string): { value: string; milliseconds: number } {
  const value = process.env[name]?.trim() || fallback;
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error(`${name} debe usar un formato como 15m o 7d`);
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error(`${name} no es válido`);
  if ((name === "ACCESS_TOKEN_EXPIRES_IN" && amount * unitMs > 24 * 60 * 60 * 1000) || (name === "REFRESH_TOKEN_EXPIRES_IN" && amount * unitMs > 90 * 24 * 60 * 60 * 1000)) throw new Error(`${name} excede el máximo permitido`);
  return { value, milliseconds: amount * unitMs };
}

function accessExpiration() { return getExpiration("ACCESS_TOKEN_EXPIRES_IN", "15m"); }
function refreshExpiration() { return getExpiration("REFRESH_TOKEN_EXPIRES_IN", "7d"); }

function getSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): Uint8Array {
  const value: string | undefined = process.env[name];

  if (!value || value.length < 32) {
    throw new Error(`${name} no está configurado correctamente`);
  }

  return new TextEncoder().encode(value);
}

export async function createAccessToken(
  userId: string,
  role: Role,
): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(accessExpiration().value)
    .sign(getSecret("JWT_ACCESS_SECRET"));
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(refreshExpiration().value)
    .sign(getSecret("JWT_REFRESH_SECRET"));
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(
    token,
    getSecret("JWT_ACCESS_SECRET"),
    { algorithms: ["HS256"] },
  );

  if (
    typeof payload.sub !== "string" ||
    (payload.role !== "USER" && payload.role !== "ADMIN")
  ) {
    throw new Error("Token de acceso inválido");
  }

  return {
    userId: payload.sub,
    role: payload.role,
  };
}

export async function verifyRefreshToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(
    token,
    getSecret("JWT_REFRESH_SECRET"),
    { algorithms: ["HS256"] },
  );

  if (typeof payload.sub !== "string" || payload.type !== "refresh") {
    throw new Error("Refresh token inválido");
  }

  return payload.sub;
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshExpiration(): Date {
  return new Date(Date.now() + refreshExpiration().milliseconds);
}

export function getAccessExpirationSeconds(): number {
  return Math.ceil(accessExpiration().milliseconds / 1000);
}

export function getRefreshExpirationSeconds(): number {
  return Math.ceil(refreshExpiration().milliseconds / 1000);
}
