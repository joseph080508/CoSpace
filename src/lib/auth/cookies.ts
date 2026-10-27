import { NextResponse } from "next/server";
import { getAccessExpirationSeconds, getRefreshExpirationSeconds } from "@/lib/auth/tokens";

const isProduction: boolean = process.env.NODE_ENV === "production";

const baseCookieOptions: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
} = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  response.cookies.set("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: getAccessExpirationSeconds(),
  });

  response.cookies.set("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: getRefreshExpirationSeconds(),
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set("access_token", "", {
    ...baseCookieOptions,
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
}
