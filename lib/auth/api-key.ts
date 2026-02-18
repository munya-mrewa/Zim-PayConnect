import { createHash, randomBytes } from "crypto";

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
