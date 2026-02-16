import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(data: EmailPayload) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    if (!process.env.SMTP_USER) {
        console.log("MOCK EMAIL SENT:", data);
        return true;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Zim-PayConnect" <noreply@zimpayconnect.com>',
      ...data,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
