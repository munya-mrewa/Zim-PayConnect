"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { saveAs } from "file-saver";

interface Log {
  id: string;
  action: string;
  status: string;
  fileName: string | null;
  recordCount: number | null;
  createdAt: string;
  user: { fullName: string } | null;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ["Date", "Action", "Status", "Details", "User"];
    const rows = logs.map(log => {
      const date = new Date(log.createdAt).toLocaleString();
      const details = log.fileName ? `${log.fileName} (${log.recordCount ?? 0} records)` : "-";
      const user = log.user?.fullName || "System";
      
      // Escape fields for CSV
      return [
        `"${date}"`,
        `"${log.action}"`,
        `"${log.status}"`,
        `"${details.replace(/"/g, '""')}"`,
        `"${user.replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit History</h2>
          <p className="text-muted-foreground">
             View all payroll processing activities and system logs.
          </p>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="outline" onClick={handleExportCSV} disabled={logs.length === 0 || loading}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
           </Button>
        </div>
      </div>

      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  type="search"
                  placeholder="Search logs..."
                  className="pl-8"
               />
            </div>
            <Button variant="outline" size="icon">
               <Filter className="h-4 w-4" />
            </Button>
         </div>

         <Card>
            <CardHeader className="p-0 border-b">
               {/* Table Header */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-3">Action</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Details</div>
                  <div className="col-span-2">User</div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading audit trail...</div>
               ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No logs found.</div>
               ) : (
                  <div className="divide-y">
                     {logs.map((log) => (
                        <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm items-center hover:bg-muted/50 transition-colors">
                           <div className="col-span-2 text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                 dateStyle: 'medium',
                                 timeStyle: 'short'
                              })}
                           </div>
                           <div className="col-span-3 font-medium">
                              {log.action}
                           </div>
                           <div className="col-span-2">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                 log.status === 'SUCCESS' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                 log.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                                 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                 {log.status}
                              </span>
                           </div>
                           <div className="col-span-3 text-muted-foreground truncate">
                              {log.fileName ? `${log.fileName} (${log.recordCount ?? 0} records)` : "-"}
                           </div>
                           <div className="col-span-2 text-muted-foreground">
                              {log.user?.fullName || "System"}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
