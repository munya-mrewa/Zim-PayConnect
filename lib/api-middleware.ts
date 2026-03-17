import { NextResponse } from "next/server";
import { verifyApiKey, extractBearerToken } from "@/lib/auth/api-key";

type Handler = (req: Request, ...args: any[]) => Promise<Response>;

export function withApiKey(handler: Handler): Handler {
  return async (req: Request, ...args: any[]) => {
    const token = extractBearerToken(req);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const result = await verifyApiKey(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: "Unauthorized", message: result.error },
        { status: 401 }
      );
    }

    // Attach organization context if possible, or just proceed.
    // Since we can't easily modify the Request object in a type-safe way without extending it,
    // we rely on the handler to trust the verification happened.
    // Alternatively, we could pass the result as a second argument if the handler supports it,
    // but Next.js route handlers have a specific signature.
    
    // For advanced usage, we might want to attach user/org to a custom header or context,
    // but headers are immutable on the incoming request usually.
    // We can return a new Request with headers added, but that's complex.
    
    // Simply proceeding is often enough for "Gatekeeper" middleware.
    // The handler can re-verify or fetching logic can be shared.
    
    return handler(req, ...args);
  };
}
