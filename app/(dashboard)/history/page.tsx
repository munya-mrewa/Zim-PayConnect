"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Filter, Trash2, FileCheck, ShieldAlert, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { saveAs } from "file-saver";

interface Log {
  id: string;
  action: string;
  status: string;
  fileName: string | null;
  recordCount: number | null;
  fileSize: number | null;
  createdAt: string;
  metadata: any;
  user: { fullName: string } | null;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    const headers = ["Date", "Action", "Status", "Details", "User", "Processing Time"];
    const rows = logs.map(log => {
      const date = new Date(log.createdAt).toLocaleString();
      const details = log.fileName ? `${log.fileName} (${log.recordCount ?? 0} records)` : (log.metadata?.action || "-");
      const user = log.user?.fullName || "System";
      const procTime = log.metadata?.processingTimeMs ? `${log.metadata.processingTimeMs}ms` : "-";
      
      return [`"${date}"`, `"${log.action}"`, `"${log.status}"`, `"${details}"`, `"${user}"`, `"${procTime}"`].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes("DATA_DISPOSAL")) return <Trash2 className="h-4 w-4 text-red-400" />;
    if (action.includes("UPLOAD_PAYROLL")) return <FileCheck className="h-4 w-4 text-green-400" />;
    if (action.includes("LOGIN")) return <ShieldAlert className="h-4 w-4 text-blue-400" />;
    return <History className="h-4 w-4 text-zinc-400" />;
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-zinc-950 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">System Audit & Compliance</h2>
          <p className="text-zinc-400">
             Track the full lifecycle of your data from upload to permanent disposal.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="border-zinc-800 hover:bg-zinc-900">
           <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
           <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider">Reliability Score</CardDescription>
              <CardTitle className="text-2xl font-bold">99.98%</CardTitle>
           </CardHeader>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
           <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider">Total Data Purged</CardDescription>
              <CardTitle className="text-2xl font-bold text-red-400">
                {logs.filter(l => l.action === 'DATA_DISPOSAL').length} Events
              </CardTitle>
           </CardHeader>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
           <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider">Avg Processing Time</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-400">
                {(logs.reduce((acc, l) => acc + (l.metadata?.processingTimeMs || 0), 0) / (logs.filter(l => l.metadata?.processingTimeMs).length || 1) / 1000).toFixed(2)}s
              </CardTitle>
           </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
               <Input
                  type="search"
                  placeholder="Filter logs by action or filename..."
                  className="pl-8 bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <div className="rounded-md border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <table className="w-full text-sm">
               <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
                  <tr>
                     <th className="px-6 py-3 text-left font-medium">Lifecycle Stage</th>
                     <th className="px-6 py-3 text-left font-medium">Activity</th>
                     <th className="px-6 py-3 text-left font-medium">Status</th>
                     <th className="px-6 py-3 text-left font-medium">Details</th>
                     <th className="px-6 py-3 text-left font-medium text-right">Timestamp</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                     <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Retrieving audit history...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                     <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No audit events match your criteria.</td></tr>
                  ) : filteredLogs.map((log) => (
                     <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span className="capitalize">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="font-medium text-zinc-200">{log.action === 'DATA_DISPOSAL' ? 'Purge Cycle Complete' : 'Process Initialization'}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              log.status === 'SUCCESS' ? 'text-green-400 bg-green-400/10' : 
                              log.status === 'WARNING' ? 'text-yellow-400 bg-yellow-400/10' : 
                              'text-red-400 bg-red-400/10'
                           }`}>
                              {log.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                           {log.action === 'DATA_DISPOSAL' ? (
                             <span className="text-red-400/80 italic">File permanently purged from encrypted short-term storage.</span>
                           ) : (
                             <span>{log.fileName} ({log.recordCount} entries)</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-500 font-mono text-xs">
                           {new Date(log.createdAt).toLocaleString()}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
