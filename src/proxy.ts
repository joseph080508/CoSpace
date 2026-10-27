import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";

function matchesPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = matchesPath(pathname, "/admin");

  const isPrivateRoute =
    isAdminRoute ||
    matchesPath(pathname, "/mi-cuenta") ||
    matchesPath(pathname, "/dashboard") ||
    matchesPath(pathname, "/reservas");

  if (!isPrivateRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // Let the client refresh an expired access cookie using the httpOnly refresh cookie.
    if (request.cookies.get("refresh_token")?.value) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    if (isAdminRoute && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    if (request.cookies.get("refresh_token")?.value) return NextResponse.next();
    const response = NextResponse.redirect(
      new URL("/login", request.url),
    );

    response.cookies.delete("access_token");

    return response;
  }
}

export const config = {
  matcher: [
    "/mi-cuenta/:path*",
    "/dashboard/:path*",
    "/reservas/:path*",
    "/admin/:path*",
  ],
};
