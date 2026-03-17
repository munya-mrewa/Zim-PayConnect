import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if the request is for the API
  if (request.nextUrl.pathname.startsWith("/api/")) {
    
    // Skip authentication for specific public endpoints
    const publicPaths = [
      "/api/auth", 
      "/api/health",
      "/api/webhooks", 
      "/api/register",
      "/api/upload-logo" // Usually public or protected by other means
    ];
    
    if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
    
    // For other API routes, we can do a basic check for the Authorization header
    // strictly for fail-fast, but the actual verification happens in the route handler
    // or via a library function due to Edge runtime limitations with Prisma.
    // We allow the request to proceed so the route handler can return specific auth errors.
    
    const response = NextResponse.next();
    
    // Add CORS headers to the response
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
