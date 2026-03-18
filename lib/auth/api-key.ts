import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

export interface ApiKeyResult {
  key: string;
  keyPrefix: string;
  hashedKey: string;
}

export class ApiKeyService {
  /**
   * Generates a new API Key.
   * Format: sk_live_randomString
   */
  static generate(): ApiKeyResult {
    const rawKey = randomBytes(32).toString("hex");
    const key = `sk_live_${rawKey}`;
    const keyPrefix = key.slice(0, 10); // "sk_live_12"
    const hashedKey = createHash("sha256").update(key).digest("hex");

    return { key, keyPrefix, hashedKey };
  }

  /**
   * Creates a new API Key for an organization.
   * Returns the plain text key (only once!).
   */
  static async createKey(organizationId: string, name: string = "Default Key") {
    const { key, keyPrefix, hashedKey } = this.generate();

    await db.apiKey.create({
      data: {
        organizationId,
        name,
        keyPrefix,
        hashedKey,
        scopes: ["payroll:write", "payroll:read"], // Default scopes
      },
    });

    return key;
  }

  /**
   * Validates an API Key and returns the associated organization.
   * Updates lastUsedAt.
   */
  static async validate(key: string) {
    if (!key.startsWith("sk_live_")) return null;

    const hashedKey = createHash("sha256").update(key).digest("hex");

    const apiKey = await db.apiKey.findUnique({
      where: { hashedKey },
      include: { organization: true },
    });

    if (!apiKey) return null;
    if (apiKey.revokedAt) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Async update lastUsedAt (fire and forget to not block)
    db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(console.error);

    return apiKey.organization;
  }

  static async revoke(id: string, organizationId: string) {
    return await db.apiKey.updateMany({
      where: { id, organizationId }, // Ensure ownership
      data: { revokedAt: new Date() },
    });
  }

  static async list(organizationId: string) {
    return await db.apiKey.findMany({
      where: { organizationId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }
}
