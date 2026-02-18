import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClients } from "@/app/actions/client";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from "@/lib/config/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Mail, Phone, MapPin, Trash2, Edit } from "lucide-react";
import { DeleteClientButton } from "./delete-client-button";

export const metadata: Metadata = {
  title: "Client Management | Zim-PayConnect",
  description: "Manage your client profiles and TINs.",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });

  if (!user?.organization) {
    redirect("/dashboard");
  }

  const org = user.organization;
  const planId = (org.subscriptionTier as SubscriptionPlanId) || "MICRO";
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  
  // Default to 0 if not specified
  const maxClients = plan?.maxClientTins || 0;
  
  const { data: clients, success } = await getClients();
  const clientList = success ? clients : [];
  const clientCount = clientList?.length || 0;
  
  const isLimitReached = maxClients > 0 && clientCount >= maxClients;
  const canAddClients = maxClients > 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your client profiles and TINs.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canAddClients ? (
             <Button asChild disabled={isLimitReached}>
                <Link href={isLimitReached ? "#" : "/clients/new"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Link>
             </Button>
          ) : (
             <Button variant="secondary" asChild>
                <Link href="/upgrade">
                   Upgrade to Add Clients
                </Link>
             </Button>
          )}
        </div>
      </div>

      {!canAddClients && (
        <div className="rounded-md bg-muted p-4">
           <div className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                 Your current plan ({plan?.name}) does not support multiple client profiles. 
                 <Link href="/upgrade" className="underline ml-1">Upgrade to Agency</Link> to manage up to 5 clients.
              </p>
           </div>
        </div>
      )}

      {canAddClients && (
         <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center space-x-4">
               <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                     Usage: {clientCount} / {maxClients} Clients
                  </p>
                  <p className="text-sm text-muted-foreground">
                     You have used {Math.round((clientCount / maxClients) * 100)}% of your client allowance.
                  </p>
               </div>
            </div>
             {isLimitReached && (
                 <div className="text-sm text-red-500 font-medium">
                     Limit Reached
                 </div>
             )}
         </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientList?.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                 <span className="truncate">{client.name}</span>
              </CardTitle>
              <CardDescription>
                TIN: {client.tin || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
               <div className="flex items-center text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {client.email || "No email"}
               </div>
               <div className="flex items-center text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  {client.phoneNumber || "No phone"}
               </div>
               <div className="flex items-center text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span className="truncate">{client.address || "No address"}</span>
               </div>
            </CardContent>
            <CardFooter className="flex justify-between">
               <Button variant="outline" size="sm" asChild>
                  <Link href={`/clients/${client.id}/edit`}>
                     <Edit className="mr-2 h-4 w-4" />
                     Edit
                  </Link>
               </Button>
               <DeleteClientButton id={client.id} name={client.name} />
            </CardFooter>
          </Card>
        ))}
        
        {clientList?.length === 0 && canAddClients && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No clients added</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                    You haven't added any clients yet. Add your first client to start managing their payrolls.
                </p>
                <Button asChild>
                    <Link href="/clients/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                    </Link>
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
