"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toggleTwoFactor } from "@/app/actions/security";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SecurityFormProps {
  initialEnabled: boolean;
}

export function SecurityForm({ initialEnabled }: SecurityFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    startTransition(async () => {
      await toggleTwoFactor(checked);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Security</CardTitle>
        </div>
        <CardDescription>Manage your account security settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
             <Label htmlFor="2fa-toggle" className="font-medium">Two-Factor Authentication</Label>
             <span className="text-sm text-muted-foreground">
                Require an email code when signing in.
             </span>
          </div>
          <div className="flex items-center gap-2">
             {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
             <Switch 
                id="2fa-toggle" 
                checked={enabled} 
                onCheckedChange={handleToggle} 
                disabled={isPending}
             />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
