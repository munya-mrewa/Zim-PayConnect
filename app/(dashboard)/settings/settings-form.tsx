"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsValues, settingsSchema } from "@/lib/validations/settings";
import { updateOrganization } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Loader2 } from "lucide-react";

interface SettingsFormProps {
  initialData: {
    name: string;
    tin: string;
    contactEmail: string;
    address: string;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const onSubmit = (data: SettingsValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateOrganization(data);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || "Updated successfully");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Organization Profile</CardTitle>
        </div>
        <CardDescription>Update your company details and tax information.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" {...register("name")} disabled={isPending} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin">Taxpayer ID (TIN)</Label>
              <Input id="tin" {...register("tin")} disabled={isPending} />
              {errors.tin && <p className="text-sm text-red-500">{errors.tin.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" {...register("contactEmail")} disabled={isPending} />
              {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input id="address" {...register("address")} disabled={isPending} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
