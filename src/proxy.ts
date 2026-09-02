import { type NextRequest, NextResponse } from "next/server";

import { MEMBER_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/config";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin") && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  const memberOnly = pathname === "/join" || (pathname.startsWith("/account") && pathname !== "/account/login");
  if (memberOnly && !request.cookies.has(MEMBER_SESSION_COOKIE_NAME)) {
    const signupUrl = new URL(pathname === "/join" ? "/signup" : "/account/login", request.url);
    signupUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signupUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/join", "/account/:path*"],
};
