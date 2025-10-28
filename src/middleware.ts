import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { Roles } from "@/lib/rbac";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/register"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth();

  const isPublicRoute = PUBLIC_PATHS.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    if (session?.user && pathname !== "/api/auth/register") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminArea = ADMIN_PATHS.some((route) => pathname.includes(route));
  if (isAdminArea && session.user.role !== Roles.ADMIN) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
