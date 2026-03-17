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
import { UserActionsClient } from "./user-actions-client";

export default async function UsersAdminPage() {
  const users = await db.user.findMany({
    include: {
      organization: true
    },
    orderBy: {
      createdAt: "desc"
    }
  }) as any[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground text-sm">
          Deactivate or permanently remove users from the platform.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{user.fullName || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="capitalize">{user.role.toLowerCase().replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                    {user.isActive ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                    ) : (
                        <Badge variant="destructive">Deactivated</Badge>
                    )}
                </TableCell>
                <TableCell>
                    <div className="text-xs">
                        {user.organization?.name || "N/A"}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <UserActionsClient 
                        userId={user.id} 
                        isActive={user.isActive} 
                        userEmail={user.email} 
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
