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
    const body = await req.json();
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
          role: "OWNER"
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
    // Write error to file for debugging
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'registration-error.log');
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${errorMessage}\n`);
    } catch (logError) {
      console.error("Failed to write error log:", logError);
    }

    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
