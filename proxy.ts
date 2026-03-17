import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 100;

export async function proxy(req: NextRequest) {
  // Basic Rate Limiting
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const now = Date.now();

  const record = rateLimitMap.get(ip);
  if (record) {
    if (now > record.expiresAt) {
      rateLimitMap.set(ip, { count: 1, expiresAt: now + 60000 });
    } else {
      if (record.count >= MAX_REQUESTS_PER_MINUTE) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
      record.count += 1;
    }
  } else {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60000 });
  }

  // Clean up old entries occasionally (rough estimate)
  if (Math.random() < 0.01) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.expiresAt) rateLimitMap.delete(key);
    }
  }

  const token = await getToken({ req });
  const isAuth = !!token;

  const pathname = req.nextUrl.pathname;

  // Paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/upload",
    "/history",
    "/calculator",
    "/clients",
    "/upgrade",
    "/admin",
    "/api/ephemeral",
    "/api/upload-logo",
    "/api/history",
    "/api/settings",
    "/api/reports",
    "/api/pesepay",
    "/api/subscription",
  ];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (isProtected) {
    if (!isAuth) {
      const from = pathname;
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url),
      );
    }

    // Admin RBAC: only OWNER, ADMIN, SUPPORT_AGENT
    if (pathname.startsWith("/admin")) {
      const role = (token?.role as string | undefined) || "";
      const allowedRoles = ["OWNER", "ADMIN", "SUPPORT_AGENT"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Check Trial Expiry
    const subscriptionStatus = token?.subscriptionStatus as
      | string
      | undefined;
    const trialEndsAt = token?.trialEndsAt as string | undefined;

    // Allow access to /upgrade even if expired
    if (pathname.startsWith("/upgrade")) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-client-ip", ip as string);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Check if trial is expired
    if (subscriptionStatus === "TRIAL" && trialEndsAt) {
      const expiryDate = new Date(trialEndsAt);
      if (expiryDate < new Date()) {
        // Redirect to upgrade page with reason
        return NextResponse.redirect(
          new URL("/upgrade?reason=trial_expired", req.url),
        );
      }
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-client-ip", ip as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/upload/:path*",
    "/history/:path*",
    "/calculator/:path*",
    "/clients/:path*",
    "/upgrade/:path*",
    "/admin/:path*",
    "/api/ephemeral/:path*",
    "/api/upload-logo/:path*",
    "/api/history/:path*",
    "/api/settings/:path*",
    "/api/reports/:path*",
    "/api/pesepay/:path*",
    "/api/subscription/:path*",
  ],
};
