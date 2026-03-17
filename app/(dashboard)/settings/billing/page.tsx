import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const transactions = await db.paymentTransaction.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
                <Link href="/settings"><ArrowLeft className="h-4 w-4" /></Link>
             </Button>
             <div>
                <h2 className="text-3xl font-bold tracking-tight">Billing History</h2>
                <p className="text-muted-foreground">
                    View your recent payments and invoices.
                </p>
             </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent transactions for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {transactions.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                   No payment history found.
               </div>
           ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell>{tx.description || tx.type}</TableCell>
                    <TableCell>
                        {tx.currency} {Number(tx.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                        <Badge variant={tx.status === 'PAID' ? 'default' : 'secondary'} className={
                             tx.status === 'PAID' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : 
                             tx.status === 'FAILED' ? 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' : ''
                        }>
                            {tx.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {tx.invoiceUrl ? (
                            <Button variant="ghost" size="sm" asChild>
                                <a href={tx.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Download
                                </a>
                            </Button>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
