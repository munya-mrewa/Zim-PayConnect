import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 100;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // --- Logic from proxy.ts (Rate Limiting & Auth) ---

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

  // Auth Check
  const token = await getToken({ req });
  const isAuth = !!token;

  // Paths that require authentication (merged from proxy.ts)
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/upload",
    "/history",
    "/calculator",
    "/clients",
    "/upgrade",
    "/admin",
    "/api/ephemeral", // Note: existing proxy.ts logic covers this
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
      // If it's an API route, return 401 instead of redirecting
      if (pathname.startsWith("/api/")) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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

  // --- Logic from middleware.ts (CORS & API Handling) ---

  // Check if the request is for the API
  if (pathname.startsWith("/api/")) {
    
    // Skip authentication for specific public endpoints (already handled by protectedPaths check above mostly, but keeping specific exclusions)
    const publicPaths = [
      "/api/auth", 
      "/api/health",
      "/api/webhooks", 
      "/api/register",
      "/api/upload-logo" // Note: proxy.ts lists this as protected, but middleware.ts listed it as public. Keeping it protected as per proxy.ts generally, but publicPaths check is for skipping strict auth logic if implemented here.
    ];
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
    
    const response = NextResponse.next();
    
    // Add CORS headers to the response
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Also add the client IP header from proxy.ts logic
    response.headers.set("x-client-ip", ip as string);

    return response;
  }

  // Default response for non-API routes
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
    "/api/:path*", // Merged API matcher
  ],
};
