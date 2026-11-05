import { NextResponse, type NextRequest } from "next/server";
import { hibernateCookie } from "@/features/auth/hibernate-cookie";

/**
 * While hibernated, every admin URL (refresh, new tab, typed URL) renders the lock screen
 * in place — the address bar keeps the requested URL, so unlocking returns right to it.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(hibernateCookie)) return NextResponse.next();
  if (request.nextUrl.pathname === "/admin/locked") return NextResponse.next();
  return NextResponse.rewrite(new URL("/admin/locked", request.url));
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
