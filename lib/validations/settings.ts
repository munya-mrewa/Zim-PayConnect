import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  tin: z.string().min(5, { message: "TIN must be at least 5 characters." }),
  contactEmail: z.string().email({ message: "Invalid email address." }),
  address: z.string().optional(),
});

export const taxSettingsSchema = z.object({
  defaultCurrency: z.enum(["USD", "ZiG"]),
  nssaEnabled: z.boolean(),
  nssaRate: z.coerce.number().min(0).max(1),
  nssaCeilingUSD: z.coerce.number().min(0),
  nssaCeilingZiG: z.coerce.number().min(0),
  necEnabled: z.boolean(),
  necRate: z.coerce.number().min(0).max(1),
  sdfEnabled: z.boolean(),
  sdfRate: z.coerce.number().min(0).max(1),
  // Exchange Rate
  autoUpdateRates: z.boolean().optional(), // Optional to allow backward compatibility if form doesn't send it initially
  currentExchangeRate: z.coerce.number().min(0).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SettingsValues = z.infer<typeof settingsSchema>;
export type TaxSettingsValues = z.infer<typeof taxSettingsSchema>;
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
