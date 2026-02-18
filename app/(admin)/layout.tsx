import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check for admin role
  // Note: We'll likely want to restrict access further based on specific permissions later
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT_AGENT") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <div className="text-sm text-muted-foreground">
            Logged in as: <span className="font-medium text-foreground">{session.user.name}</span> ({session.user.role})
          </div>
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
