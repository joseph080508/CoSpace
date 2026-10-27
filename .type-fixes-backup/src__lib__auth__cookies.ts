import { NextResponse } from "next/server";

const isProduction: boolean = process.env.NODE_ENV === "production";

const baseCookieOptions = {
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
    maxAge: 15 * 60,
  });

  response.cookies.set("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60,
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
