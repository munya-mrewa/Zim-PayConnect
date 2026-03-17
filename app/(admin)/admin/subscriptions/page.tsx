import { db } from "@/lib/db";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, CreditCard, User } from "lucide-react";
import { OrgActionsClient } from "./org-actions-client";

export default async function SubscriptionsPage() {
  const organizations = await db.organization.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case "TRIAL":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trial</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "PAST_DUE":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "ENTERPRISE":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Enterprise</Badge>;
      case "AGENCY":
        return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Agency</Badge>;
      case "BUSINESS":
        return <Badge className="bg-slate-700 text-white hover:bg-slate-800">Business</Badge>;
      default:
        return <Badge variant="outline">Micro</Badge>;
    }
  };

  const now = new Date();

  const resolveStatus = (org: any): string => {
    if (org.subscriptionStatus === "TRIAL") {
      return now > org.trialEndsAt ? "EXPIRED" : "TRIAL";
    }
    if (org.subscriptionStatus === "ACTIVE") {
      if (org.subscriptionEndsAt && now > org.subscriptionEndsAt) {
        return "PAST_DUE";
      }
      return "ACTIVE";
    }
    return org.subscriptionStatus;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">All Subscriptions</h2>
        <p className="text-muted-foreground text-sm">
          A complete overview of every organization registered on the platform.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Trial/Ends At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{org.name}</span>
                    <span className="text-[10px] text-muted-foreground">{org.contactEmail || "No contact email"}</span>
                  </div>
                </TableCell>
                <TableCell>{getTierBadge(org.subscriptionTier)}</TableCell>
                <TableCell>{getStatusBadge(resolveStatus(org))}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    {org._count.users}
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-1 text-xs font-semibold">
                    <CreditCard className="h-3 w-3" />
                    {org.credits}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Ends: {org.subscriptionEndsAt ? new Date(org.subscriptionEndsAt).toLocaleDateString() : "N/A"}
                    </span>
                    {org.subscriptionStatus === "TRIAL" && (
                        <span className="text-[10px] text-blue-600">
                            Trial Ends: {new Date(org.trialEndsAt).toLocaleDateString()}
                        </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                    <OrgActionsClient 
                        orgId={org.id} 
                        orgName={org.name} 
                    />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
