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

  console.log(`Feedback Action - Session Found: ${!!session}, User: ${session?.user?.email}`);

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  console.log(`Submitting feedback for ${session.user.email} from ${url}`);

  const result = await sendSlackFeedback({
    message,
    name: session.user.name || "Unknown User",
    email: session.user.email || "Unknown Email",
    url: url || "Unknown URL",
  });

  return result;
}
