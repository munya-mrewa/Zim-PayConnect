import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_live_${randomBytes(24).toString("hex")}`;
  const hash = createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 10); // "sk_live_12"
  return { key, hash, prefix };
}

export function validateApiKey(key: string, hash: string): boolean {
  const computedHash = createHash("sha256").update(key).digest("hex");
  return computedHash === hash;
}

export async function verifyApiKey(token: string) {
  const hash = createHash("sha256").update(token).digest("hex");

  const apiKey = await db.apiKey.findUnique({
    where: { hashedKey: hash },
    include: { organization: true },
  });

  if (!apiKey) {
    return { valid: false, error: "Invalid API key" };
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: "API key has been revoked" };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Update last used timestamp asynchronously
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, apiKey, organizationId: apiKey.organizationId };
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
}
