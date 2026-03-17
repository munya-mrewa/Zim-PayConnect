import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as
      | {
          role?: string;
        }
      | null;

    // Admin RBAC: only OWNER, ADMIN, SUPPORT_AGENT
    if (pathname.startsWith("/admin")) {
      const role = token?.role;
      const allowedRoles = ["OWNER", "ADMIN", "SUPPORT_AGENT"];

      if (!role || !allowedRoles.includes(role)) {
        const url = new URL("/dashboard", req.url);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes (no auth required)
        const publicPaths = [
          "/",
          "/login",
          "/register",
          "/about",
          "/terms",
          "/privacy",
          "/security",
          "/user-guide",
        ];

        if (
          publicPaths.some(
            (p) => pathname === p || pathname.startsWith(p + "/"),
          )
        ) {
          return true;
        }

        // Always allow health check
        if (pathname.startsWith("/api/health")) {
          return true;
        }

        // Protected application pages & APIs
        const protectedPrefixes = [
          "/dashboard",
          "/upload",
          "/history",
          "/settings",
          "/clients",
          "/upgrade",
          "/admin",
          "/api/ephemeral",
          "/api/history",
          "/api/settings",
          "/api/reports",
          "/api/pesepay",
          "/api/subscription",
          "/api/upload-logo",
        ];

        const isProtected = protectedPrefixes.some(
          (p) => pathname === p || pathname.startsWith(p + "/"),
        );

        if (isProtected) {
          // Require a valid session token
          return !!token;
        }

        // Default: allow
        return true;
      },
    },
  },
);

export const config = {
  // Apply middleware to all routes except static assets and webhooks
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|og-ephemeral.jpg|api/webhooks).*)",
  ],
};

