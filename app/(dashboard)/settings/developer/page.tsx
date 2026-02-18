import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ApiKeyManager } from "./api-key-manager";
import { WebhookManager } from "./webhook-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function DeveloperSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
  });

  if (!user?.organization) return <div>Organization not found</div>;

  const isEnterprise = ['AGENCY', 'ENTERPRISE'].includes(user.organization.subscriptionTier);

  if (!isEnterprise) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
              <h1 className="text-2xl font-bold">Developer Access Required</h1>
              <p className="text-muted-foreground text-center max-w-md">
                  API Keys and Webhooks are advanced features available only on Agency and Enterprise plans.
              </p>
              <a href="/upgrade" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Upgrade Plan
              </a>
          </div>
      );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="space-y-2">
         <h2 className="text-3xl font-bold tracking-tight">Developer Settings</h2>
         <p className="text-muted-foreground">
            Manage API keys and webhook endpoints for custom integrations.
         </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="api-keys" className="space-y-4">
          <ApiKeyManager />
        </TabsContent>
        <TabsContent value="webhooks" className="space-y-4">
            <WebhookManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
