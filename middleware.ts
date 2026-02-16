import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuth = !!token;

  // Paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/upload",
    "/history",
    "/calculator",
    "/api/ephemeral",
    "/api/upload-logo",
    "/api/history"
  ];

  const isProtected = protectedPaths.some((path) => 
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected) {
    if (!isAuth) {
      const from = req.nextUrl.pathname;
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/upload/:path*",
    "/history/:path*",
    "/calculator/:path*",
    "/api/ephemeral/:path*", 
    "/api/upload-logo/:path*",
    "/api/history/:path*",
    // Explicitly exclude api/auth from matcher just in case, though the list above should cover it.
  ],
};
