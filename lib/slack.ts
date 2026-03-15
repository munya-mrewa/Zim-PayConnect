export async function sendSlackFeedback({
  message,
  name,
  email,
  url,
}: {
  message: string;
  name: string;
  email: string;
  url: string;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("SLACK_WEBHOOK_URL is not defined in environment variables. Current env:", Object.keys(process.env).filter(k => k.includes('SLACK')));
    return { success: false, error: "Slack integration not configured" };
  }

  console.log(`Sending Slack feedback to webhook: ${webhookUrl.substring(0, 30)}...`);

  const payload = {
    text: `New Feedback from Zim-PayConnect`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Feedback from Zim-PayConnect*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*User:* ${name}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:* ${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Page URL:* ${url}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:*\n${message}`,
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`Slack response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending feedback to Slack:", error);
    return { success: false, error: "Failed to send feedback" };
  }
}
