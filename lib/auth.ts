import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(db), // Optional: If we want to persist sessions in DB, but JWT is default and fine.
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        // Check if user is active (cast to any to avoid Prisma type mismatch)
        if ((user as any).isActive === false) {
            throw new Error("Your account has been deactivated. Please contact support.");
        }

        // 2FA Check
        if (user.twoFactorEnabled) {
          if (credentials.code) {
            // Verify Code (compare against hashed value)
            const providedHash = crypto
              .createHash("sha256")
              .update(credentials.code)
              .digest("hex");

            if (
              user.twoFactorToken === providedHash &&
              user.twoFactorExpires &&
              user.twoFactorExpires > new Date()
            ) {
              // Clear token after successful verification
              await db.user.update({
                where: { id: user.id },
                data: { twoFactorToken: null, twoFactorExpires: null },
              });
            } else {
              throw new Error("Invalid or expired 2FA code");
            }
          } else {
            // Generate Code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(
              new Date().getTime() + 10 * 60 * 1000,
            ); // 10 mins

            const hashedCode = crypto
              .createHash("sha256")
              .update(code)
              .digest("hex");

            await db.user.update({
              where: { id: user.id },
              data: { twoFactorToken: hashedCode, twoFactorExpires: expires },
            });

            // Send Email (plain code to user)
            await sendEmail({
              to: user.email,
              subject: "Your 2FA Login Code",
              html: `<p>Your code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
            });

            throw new Error("2FA_REQUIRED");
          }
        }

        let org = null;
        if (user.organizationId) {
          org = await db.organization.findUnique({
            where: { id: user.organizationId }
          });
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId || "",
          subscriptionStatus: org?.subscriptionStatus,
          trialEndsAt: org?.trialEndsAt?.toISOString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.subscriptionStatus = (user as any).subscriptionStatus;
        token.trialEndsAt = (user as any).trialEndsAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).trialEndsAt = token.trialEndsAt;

        // Impersonation Override
        try {
          const cookieStore = await cookies();
          const impersonatedOrgId = cookieStore.get("impersonate_org")?.value;
          
          if (impersonatedOrgId && (session.user.role === 'ADMIN' || session.user.role === 'SUPPORT_AGENT')) {
             // Verify the org exists (optional but safer)
             // For performance, we might skip DB check here, but let's trust the cookie for now
             // effectively allowing the admin to "try" to access any org ID.
             // Access control will happen downstream if the org ID is invalid.
             session.user.organizationId = impersonatedOrgId;
             session.user.isImpersonating = true;
          }
        } catch (e) {
          // cookies() might fail if not in a request context (e.g. build time or some edge cases)
          // Just ignore impersonation in that case.
        }
      }
      return session;
    },
  },
};
