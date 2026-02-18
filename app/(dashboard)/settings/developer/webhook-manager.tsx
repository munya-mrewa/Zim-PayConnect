"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
};

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("payroll.processed");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/settings/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newUrl) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: [selectedEvent] }),
      });
      
      if (res.ok) {
        setNewUrl("");
        fetchWebhooks();
      } else {
        alert("Failed to create webhook. Ensure URL is valid and you are on Enterprise plan.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        await fetch(`/api/settings/webhooks?id=${id}`, { method: "DELETE" });
        fetchWebhooks();
    } catch (error) {
        console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
        <CardDescription>Receive real-time notifications about system events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Create Webhook Form */}
        <div className="flex gap-4 items-end">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="url" className="text-sm font-medium">Endpoint URL</label>
            <Input 
                id="url" 
                placeholder="https://your-api.com/webhooks" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>
          <div className="grid w-[200px] items-center gap-1.5">
             <label className="text-sm font-medium">Event</label>
             <Select onValueChange={setSelectedEvent} defaultValue={selectedEvent}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="payroll.processed">payroll.processed</SelectItem>
                    <SelectItem value="report.generated">report.generated</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <Button onClick={createWebhook} disabled={!newUrl || loading}>
             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Add Endpoint
          </Button>
        </div>

        {/* List */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          No webhook endpoints configured.
                      </TableCell>
                  </TableRow>
              ) : (
                  webhooks.map((hook) => (
                    <TableRow key={hook.id}>
                      <TableCell className="font-medium font-mono text-xs">{hook.url}</TableCell>
                      <TableCell>
                          {hook.events.map(e => <Badge key={e} variant="secondary" className="mr-1">{e}</Badge>)}
                      </TableCell>
                      <TableCell>
                          <Badge variant={hook.active ? "default" : "destructive"}>
                              {hook.active ? "Active" : "Inactive"}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteWebhook(hook.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
