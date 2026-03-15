"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteOrganization } from "../actions";
import { Trash2, Loader2 } from "lucide-react";

interface OrgActionsClientProps {
  orgId: string;
  orgName: string;
}

export function OrgActionsClient({ orgId, orgName }: OrgActionsClientProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`CRITICAL: Are you sure you want to PERMANENTLY DELETE organization "${orgName}" and ALL its users/data? This action CANNOT be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await deleteOrganization(orgId);
      if (!res.success) alert(res.error);
    } catch (err) {
      alert("An unexpected error occurred during deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
        Delete Subscription
      </Button>
    </div>
  );
}
