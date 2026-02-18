"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Key, Copy, Check } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  scopes: string[];
};

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/settings/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: ["payroll:read", "payroll:write"] }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.secretKey);
        setNewKeyName("");
        fetchKeys();
      } else {
          alert("Failed to create key. Ensure you are on an Enterprise plan.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this key? Integration will break immediately.")) return;
    try {
        await fetch(`/api/settings/api-keys?id=${id}`, { method: "DELETE" });
        fetchKeys();
    } catch (error) {
        console.error(error);
    }
  };

  const copyToClipboard = async () => {
      if (createdKey) {
          await navigator.clipboard.writeText(createdKey);
          setCopying(true);
          setTimeout(() => setCopying(false), 2000);
      }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Manage secret keys for accessing the Zim-PayConnect API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Create Key Form */}
        <div className="flex gap-4 items-end">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="keyName" className="text-sm font-medium">Key Name</label>
            <Input 
                id="keyName" 
                placeholder="e.g. HR System Integration" 
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>
          <Button onClick={createKey} disabled={!newKeyName || loading}>
             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Create New Key
          </Button>
        </div>

        {/* Success Alert for New Key */}
        {createdKey && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-semibold text-green-800 mb-2">Key Created Successfully!</h4>
                <p className="text-sm text-green-700 mb-3">Copy this key now. You won't be able to see it again.</p>
                <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded border font-mono text-sm flex-1 overflow-hidden text-ellipsis">
                        {createdKey}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        )}

        {/* Keys List */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          No active API keys found.
                      </TableCell>
                  </TableRow>
              ) : (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{key.keyPrefix}...</Badge></TableCell>
                      <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => revokeKey(key.id)}>
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
