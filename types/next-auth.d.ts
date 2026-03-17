import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      role: string
      organizationId: string
      subscriptionStatus?: string
      trialEndsAt?: string
      isImpersonating?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    organizationId: string
    subscriptionStatus?: string
    trialEndsAt?: string
    isImpersonating?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    organizationId: string
    subscriptionStatus?: string
    trialEndsAt?: string
    isImpersonating?: boolean
  }
}
