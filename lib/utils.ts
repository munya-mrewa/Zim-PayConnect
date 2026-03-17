import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: "USD" | "ZiG") {
  return new Intl.NumberFormat("en-ZW", {
    style: "currency",
    currency: currency === "ZiG" ? "ZWL" : "USD", // ZWL is placeholder for ZiG in some locales
  }).format(amount);
}

/**
 * Guard against CSV injection by prefixing cells that start
 * with =, +, -, or @ with a leading apostrophe.
 */
export function sanitizeCsvCell(value: string): string {
  if (!value) return "";
  const firstChar = value[0];
  if (firstChar === "=" || firstChar === "+" || firstChar === "-" || firstChar === "@") {
    return "'" + value;
  }
  return value;
}

/**
 * Sanitize a filename for ZIP/CSV exports.
 * - Lowercase
 * - Replace any character not in [a-z0-9_-] with underscore
 * - Collapse multiple underscores
 * - Trim to a reasonable length
 */
export function sanitizeFilename(raw: string, fallback: string = "file"): string {
  const base = (raw || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  // Ensure we always return something non-empty
  const safe = base || fallback.toLowerCase();

  // Limit length to avoid OS/path issues
  return safe.slice(0, 80);
}
