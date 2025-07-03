import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || 
                request.headers.get("authorization")?.split(" ")[1];
                
  const isPublicPath = request.nextUrl.pathname === "/login" || 
                      request.nextUrl.pathname === "/register" ||
                      request.nextUrl.pathname === "/" ||
                      request.nextUrl.pathname === "/about-us" ||
                      request.nextUrl.pathname === "/feedback/";

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
