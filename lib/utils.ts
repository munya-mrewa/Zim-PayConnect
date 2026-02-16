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
