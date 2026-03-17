import { db } from "@/lib/db";
import { AccountManagerSelect } from "./account-manager-select";
import { User, AuditAction, AuditStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  // 1. Fetch System Stats
  const now = new Date();

  const [userCount, orgCount, activeSubs, recentLogs] = await Promise.all([
    db.user.count(),
    db.organization.count(),
    db.organization.count({
      where: {
        subscriptionStatus: "ACTIVE",
        OR: [
          { subscriptionEndsAt: null },
          { subscriptionEndsAt: { gt: now } },
        ],
      },
    }),
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { organization: true, user: true }
    })
  ]);

  const organizations = await db.organization.findMany({
    where: {
      subscriptionTier: {
        in: ["AGENCY", "ENTERPRISE"]
      }
    },
    include: {
      accountManager: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const supportAgents = await db.user.findMany({
    where: {
      role: "SUPPORT_AGENT"
    }
  });

  const agents = supportAgents.map(agent => ({
    id: agent.id,
    fullName: agent.fullName,
    email: agent.email
  }));

  return (
    <div className="space-y-8">
      {/* 1. Developer Overlook Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <Link href="/admin/users" className="text-xs text-primary hover:underline font-medium">
              Manage all users →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgCount}</div>
            <Link href="/admin/subscriptions" className="text-xs text-primary hover:underline font-medium">
              View all subscriptions →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs}</div>
            <p className="text-xs text-muted-foreground">Paid & current accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 2. Enterprise Management */}
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Enterprise Clients</h3>
            <p className="text-sm text-muted-foreground">Manage dedicated account managers.</p>
          </div>
          <div className="p-6">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors">
                    <th className="h-10 px-2 text-left font-medium text-muted-foreground">Org</th>
                    <th className="h-10 px-2 text-left font-medium text-muted-foreground">Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b">
                      <td className="p-2 py-3 font-medium">{org.name}</td>
                      <td className="p-2">
                        <AccountManagerSelect 
                          orgId={org.id} 
                          currentManagerId={org.accountManagerId} 
                          agents={agents} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Recent System Activity */}
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Live feed of actions across the platform.</p>
          </div>
          <div className="p-6 space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <div className={`mt-1 rounded-full p-1.5 ${
                  log.status === "SUCCESS" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                  {log.status === "SUCCESS" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {log.action.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.organization.name} • {log.user?.fullName || "System"}
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
