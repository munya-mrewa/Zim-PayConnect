import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.errors },
        { status: 400 }
      );
    }

    const { resetToken, newPassword } = result.data;
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Find user with valid token and not expired
    const user = await db.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    logger.info({ userId: user.id }, "Password reset successful");

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );

  } catch (error) {
    logger.error({ err: error }, "Reset Password Error");
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
