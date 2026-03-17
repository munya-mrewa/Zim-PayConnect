"use client";

import { Button } from "@/components/ui/button";
import { startImpersonation } from "@/actions/impersonate";
import { Eye } from "lucide-react";
import { useState } from "react";

export function ImpersonateButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    setLoading(true);
    try {
      await startImpersonation(orgId);
    } catch (error) {
      console.error("Failed to start impersonation:", error);
      alert("Failed to start impersonation");
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleImpersonate} 
      disabled={loading}
      title="View Dashboard as Client"
    >
      <Eye className="h-4 w-4" />
      <span className="sr-only">Impersonate</span>
    </Button>
  );
}
