"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAccountManager } from "./actions"; // Verify this path
import { useState } from "react";

type Agent = {
  id: string;
  fullName: string | null;
  email: string;
};

export function AccountManagerSelect({
  orgId,
  currentManagerId,
  agents,
}: {
  orgId: string;
  currentManagerId: string | null;
  agents: Agent[];
}) {
  const [loading, setLoading] = useState(false);

  const handleValueChange = async (value: string) => {
    setLoading(true);
    try {
      await updateAccountManager(orgId, value);
    } catch (error) {
      console.error(error);
      alert("Failed to update manager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      onValueChange={handleValueChange}
      defaultValue={currentManagerId || "unassigned"}
      disabled={loading}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.fullName || agent.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
