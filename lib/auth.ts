import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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

        // 2FA Check
        if (user.twoFactorEnabled) {
          if (credentials.code) {
             // Verify Code
             if (user.twoFactorToken === credentials.code && user.twoFactorExpires && user.twoFactorExpires > new Date()) {
                // Clear token
                await db.user.update({
                  where: { id: user.id },
                  data: { twoFactorToken: null, twoFactorExpires: null }
                });
             } else {
                throw new Error("Invalid or expired 2FA code");
             }
          } else {
             // Generate Code
             const code = Math.floor(100000 + Math.random() * 900000).toString();
             const expires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 mins

             await db.user.update({
               where: { id: user.id },
               data: { twoFactorToken: code, twoFactorExpires: expires }
             });

             // Send Email
             await sendEmail({
               to: user.email,
               subject: "Your 2FA Login Code",
               html: `<p>Your code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`
             });

             throw new Error("2FA_REQUIRED");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          organizationId: user.organizationId || "", // Provide default if null, but schema implies user belongs to org? 
          // Assuming user.organizationId can be null in DB but strictly we handle it.
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT Callback Triggered:", { token: token?.sub, user: user?.email });
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
};
