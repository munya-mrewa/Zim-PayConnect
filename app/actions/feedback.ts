"use server";

import { sendSlackFeedback } from "@/lib/slack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function submitFeedbackAction(formData: FormData) {
  const message = formData.get("message") as string;
  const url = formData.get("url") as string;

  if (!message) {
    return { success: false, error: "Message is required" };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await sendSlackFeedback({
    message,
    name: session.user.name || "Unknown User",
    email: session.user.email || "Unknown Email",
    url: url || "Unknown URL",
  });

  return result;
}
