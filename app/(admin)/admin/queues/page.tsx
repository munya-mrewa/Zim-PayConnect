import { payrollQueue, cronQueue } from "@/lib/queue/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, PlayCircle } from "lucide-react";

export const dynamic = 'force-dynamic'; // Ensure real-time data

async function getQueueStats(queue: any, name: string) {
  const counts = await queue.getJobCounts();
  const failedJobs = await queue.getJobs(['failed'], 0, 5);
  const activeJobs = await queue.getJobs(['active'], 0, 5);
  
  return {
    name,
    counts,
    failedJobs,
    activeJobs
  };
}

export default async function QueuesPage() {
  const queues = [
    await getQueueStats(payrollQueue, "Payroll Processing"),
    await getQueueStats(cronQueue, "Cron Jobs")
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">System Queues</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {queues.map((queue) => (
          <Card key={queue.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{queue.name}</span>
                <Badge variant={queue.counts.active > 0 ? "default" : "secondary"}>
                  {queue.counts.active > 0 ? "Processing" : "Idle"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <PlayCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-xl font-bold">{queue.counts.active}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Waiting</p>
                    <p className="text-xl font-bold">{queue.counts.waiting + queue.counts.delayed}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold">{queue.counts.completed}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="text-xl font-bold">{queue.counts.failed}</p>
                  </div>
                </div>
              </div>

              {/* Failed Jobs List */}
              {queue.failedJobs.length > 0 && (
                <div className="border rounded-md">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b text-sm font-medium text-red-700 dark:text-red-400">
                    Recent Failures
                  </div>
                  <Table>
                    <TableBody>
                      {queue.failedJobs.map((job: any) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.id}</TableCell>
                          <TableCell className="text-xs text-red-600 truncate max-w-[200px]">
                            {job.failedReason || "Unknown error"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(job.finishedOn || Date.now()).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
               {/* Active Jobs List */}
               {queue.activeJobs.length > 0 && (
                <div className="border rounded-md">
                   <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b text-sm font-medium text-blue-700 dark:text-blue-400">
                    Active Jobs
                  </div>
                  <Table>
                    <TableBody>
                      {queue.activeJobs.map((job: any) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.id}</TableCell>
                          <TableCell className="text-xs truncate max-w-[200px]">
                            {JSON.stringify(job.data).substring(0, 50)}...
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Running
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {queue.failedJobs.length === 0 && queue.activeJobs.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No active or failed jobs to display.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
