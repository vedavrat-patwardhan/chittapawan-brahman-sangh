import { type NextRequest, NextResponse } from "next/server";

import { getSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/config";

const PROTECTED_PREFIXES = ["/directory", "/join"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = token === getSessionToken();

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/directory", request.url));
  }

  if (isProtected(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/directory/:path*", "/join", "/login"],
};
