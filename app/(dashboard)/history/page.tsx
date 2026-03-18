"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Filter, Trash2, FileCheck, ShieldAlert, History, Settings, FileText } from "lucide-react";
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
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Date", "Action", "Status", "User", "Details", "Processing Time"];
    const rows = logs.map(log => {
      const date = new Date(log.createdAt).toLocaleString();
      const user = log.user?.fullName || "System";
      let details = "-";
      
      if (log.action === 'UPDATE_SETTINGS') {
          details = `Updated: ${(log.metadata?.updatedFields || []).join(", ")}`;
      } else if (log.fileName) {
          details = `${log.fileName} (${log.recordCount ?? 0} records)`;
      } else if (log.metadata?.type) {
          details = log.metadata.type;
      }

      const procTime = log.metadata?.processingTimeMs ? `${log.metadata.processingTimeMs}ms` : "-";
      
      return [`"${date}"`, `"${log.action}"`, `"${log.status}"`, `"${user}"`, `"${details}"`, `"${procTime}"`].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes("DATA_DISPOSAL")) return <Trash2 className="h-4 w-4 text-red-400" />;
    if (action.includes("UPLOAD_PAYROLL")) return <FileCheck className="h-4 w-4 text-green-400" />;
    if (action.includes("GENERATE_REPORT")) return <FileText className="h-4 w-4 text-purple-400" />;
    if (action.includes("UPDATE_SETTINGS")) return <Settings className="h-4 w-4 text-orange-400" />;
    if (action.includes("LOGIN")) return <ShieldAlert className="h-4 w-4 text-blue-400" />;
    return <History className="h-4 w-4 text-zinc-400" />;
  };

  const formatActivity = (log: Log) => {
      switch (log.action) {
          case 'DATA_DISPOSAL': return 'Data Purge Cycle';
          case 'UPLOAD_PAYROLL': return 'Payroll Upload';
          case 'GENERATE_REPORT': return 'Report Generation';
          case 'UPDATE_SETTINGS': return 'Settings Update';
          case 'LOGIN': return 'User Login';
          default: return log.action.replace(/_/g, ' ');
      }
  };

  const formatDetails = (log: Log) => {
      if (log.action === 'DATA_DISPOSAL') return <span className="text-red-400/80 italic">File permanently purged.</span>;
      if (log.action === 'UPDATE_SETTINGS') {
          const fields = log.metadata?.updatedFields || [];
          return <span className="text-zinc-300">Updated: {fields.slice(0, 3).join(", ")}{fields.length > 3 ? "..." : ""}</span>;
      }
      if (log.fileName) return <span>{log.fileName} ({log.recordCount} records)</span>;
      return <span className="text-zinc-500">-</span>;
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-zinc-950 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs & Activity</h2>
          <p className="text-zinc-400">
             Track all system activity, settings changes, and data processing events.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="border-zinc-800 hover:bg-zinc-900">
           <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
           <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider">Total Actions (30 Days)</CardDescription>
              <CardTitle className="text-2xl font-bold">{logs.length}</CardTitle>
           </CardHeader>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
           <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider">Payroll Uploads</CardDescription>
              <CardTitle className="text-2xl font-bold text-green-400">
                {logs.filter(l => l.action === 'UPLOAD_PAYROLL').length}
              </CardTitle>
           </CardHeader>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
           <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider">Settings Changes</CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-400">
                {logs.filter(l => l.action === 'UPDATE_SETTINGS').length}
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
                  placeholder="Filter by user, action or filename..."
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
                     <th className="px-6 py-3 text-left font-medium">Type</th>
                     <th className="px-6 py-3 text-left font-medium">Activity</th>
                     <th className="px-6 py-3 text-left font-medium">User</th>
                     <th className="px-6 py-3 text-left font-medium">Status</th>
                     <th className="px-6 py-3 text-left font-medium">Details</th>
                     <th className="px-6 py-3 text-left font-medium text-right">Timestamp</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                     <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Retrieving audit history...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                     <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No audit events match your criteria.</td></tr>
                  ) : filteredLogs.map((log) => (
                     <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="font-medium text-zinc-200">{formatActivity(log)}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                           {log.user?.fullName || "System"}
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
                           {formatDetails(log)}
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
