"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function startImpersonation(orgId: string) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT_AGENT")) {
    throw new Error("Unauthorized");
  }

  // Next.js 15+ cookies() is async
  const cookieStore = await cookies();
  cookieStore.set("impersonate_org", orgId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  redirect("/dashboard");
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete("impersonate_org");
  redirect("/admin");
}
