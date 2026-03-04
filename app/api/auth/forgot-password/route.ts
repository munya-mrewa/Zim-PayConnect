import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 even if user not found to prevent enumeration
      return new NextResponse("If an account exists, a reset email has been sent.", { status: 200 });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpires,
      },
    });

    // Send Email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: "Reset Your Password - Zim-PayConnect",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to set a new password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    logger.info({ userId: user.id }, "Password reset email sent");

    return new NextResponse("If an account exists, a reset email has been sent.", { status: 200 });

  } catch (error) {
    logger.error({ err: error }, "Forgot Password Error");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
