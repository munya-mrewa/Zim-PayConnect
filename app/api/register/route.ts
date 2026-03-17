import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must have at least 8 characters"),
  orgName: z.string().min(1, "Organization name is required"),
  plan: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    if (!bodyText) {
        return NextResponse.json({ message: "Empty request body" }, { status: 400 });
    }
    const body = JSON.parse(bodyText);
    const { email, name, password, orgName, plan } = userSchema.parse(body);

    // check if email already exists
    const existingUserByEmail = await db.user.findUnique({
      where: { email: email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    // Transaction to create organization and user atomically
    const newUser = await db.$transaction(async (tx) => {
      // Create Organization
      const newOrg = await tx.organization.create({
        data: {
          name: orgName,
          subscriptionTier: plan || "MICRO",
        }
      });

      // Create User linked to Organization
      return await tx.user.create({
        data: {
          fullName: name,
          email,
          hashedPassword: hashedPassword,
          organizationId: newOrg.id,
          role: "OWNER",
          // Explicitly ensure 2FA is OFF for all new users
          twoFactorEnabled: false,
          twoFactorToken: null,
          twoFactorExpires: null,
        },
      });
    });

    // Remove password from response
    const { hashedPassword: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { user: userWithoutPassword, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json(
            { message: "Invalid input data", errors: error.errors },
            { status: 400 }
        );
    }
    console.error("Registration error:", error);

    return NextResponse.json(
      { message: `Something went wrong: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
