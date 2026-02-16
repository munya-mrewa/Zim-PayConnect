"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordChangeValues, passwordChangeSchema } from "@/lib/validations/settings";
import { updatePassword } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";

export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = (data: PasswordChangeValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updatePassword(data);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || "Password updated successfully");
        reset(); // Clear fields on success
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Security</CardTitle>
        </div>
        <CardDescription>Update your password to keep your account secure.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
                id="currentPassword" 
                type="password" 
                {...register("currentPassword")} 
                disabled={isPending} 
            />
            {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword.message}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                    id="newPassword" 
                    type="password" 
                    {...register("newPassword")} 
                    disabled={isPending} 
                />
                {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                    id="confirmPassword" 
                    type="password" 
                    {...register("confirmPassword")} 
                    disabled={isPending} 
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
