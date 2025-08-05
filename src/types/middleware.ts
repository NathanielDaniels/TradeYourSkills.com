import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const comingSoonEnabled = true; // toggle when ready to launch
  const isDev = process.env.NODE_ENV === "development";

  // Allow everything in dev
  if (isDev) return NextResponse.next();

  // Allow API routes, assets, and NextAuth callbacks if needed
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // If Coming Soon enabled, redirect everything to root
  if (comingSoonEnabled && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}
