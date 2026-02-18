"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClient } from "@/app/actions/client";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteClientButtonProps {
  id: string;
  name: string;
}

export function DeleteClientButton({ id, name }: DeleteClientButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      setLoading(true);
      try {
        const result = await deleteClient(id);
        if (result.success) {
            router.refresh();
        } else {
            alert(result.error || "Failed to delete client");
        }
      } catch (error) {
        alert("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete} 
        disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      Delete
    </Button>
  );
}
