import { db } from "@/lib/db";
import { AccountManagerSelect } from "./account-manager-select";
import { User } from "@prisma/client";

export default async function AdminPage() {
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
    <div className="space-y-6">
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Enterprise & Institutional Clients</h3>
          <p className="text-sm text-muted-foreground">Manage dedicated account managers for premium clients.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Organization
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Tier
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Contact
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Account Manager
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">{org.name}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        org.subscriptionTier === "ENTERPRISE" 
                          ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" 
                          : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}>
                        {org.subscriptionTier}
                      </span>
                    </td>
                    <td className="p-4 align-middle">{org.contactEmail || "N/A"}</td>
                    <td className="p-4 align-middle">
                      <AccountManagerSelect 
                        orgId={org.id} 
                        currentManagerId={org.accountManagerId} 
                        agents={agents} 
                      />
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground h-24">
                      No Enterprise or Institutional clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
