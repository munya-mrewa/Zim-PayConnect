"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserStatus, deleteUser } from "../actions";
import { UserMinus, UserCheck, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserActionsClientProps {
  userId: string;
  isActive: boolean;
  userEmail: string;
}

export function UserActionsClient({ userId, isActive, userEmail }: UserActionsClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (!confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} ${userEmail}?`)) return;
    
    setLoading(true);
    try {
      const res = await toggleUserStatus(userId, isActive);
      if (!res.success) alert(res.error);
    } catch (err) {
      alert("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`CRITICAL: Are you sure you want to PERMANENTLY DELETE ${userEmail}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await deleteUser(userId);
      if (!res.success) alert(res.error);
    } catch (err) {
      alert("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleToggle}
        disabled={loading}
        className={isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isActive ? <UserMinus className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />)}
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
        Delete
      </Button>
    </div>
  );
}
