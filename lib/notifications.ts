import { logger } from "@/lib/logger";

export async function sendSlackAlert(message: string, type: "INFO" | "ERROR" | "SUCCESS" = "INFO") {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL is not defined. Skipping alert.");
    return;
  }

  const colors = {
    INFO: "#36a64f", // Green-ish
    ERROR: "#ff0000", // Red
    SUCCESS: "#FFD700", // Gold (for Revenue)
  };

  const payload = {
    attachments: [
      {
        color: colors[type],
        text: message,
        footer: "Zim-PayConnect Monitor",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to send Slack alert");
    }
  } catch (error) {
    logger.error({ err: error }, "Error sending Slack alert");
  }
}
