"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ClientData, createClient, updateClient } from "@/app/actions/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  tin: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  initialData?: ClientData;
  isEdit?: boolean;
}

export function ClientForm({ initialData, isEdit = false }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || "",
      tin: initialData?.tin || "",
      email: initialData?.email || "",
      phoneNumber: initialData?.phoneNumber || "",
      address: initialData?.address || "",
    },
  });

  async function onSubmit(data: ClientFormValues) {
    setLoading(true);
    setError(null);

    try {
      // Clean up empty strings to null/undefined if needed, but actions handle it?
      // Actually, Prisma handles empty strings fine, but optional fields might need to be undefined if empty.
      // Let's just pass data as is, the action expects strings or nulls.
      // But Zod returns strings.
      
      const payload: ClientData = {
          ...data,
          email: data.email || null,
          tin: data.tin || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null
      };

      let result;
      if (isEdit && initialData?.id) {
        result = await updateClient(initialData.id, payload);
      } else {
        result = await createClient(payload);
      }

      if (!result.success) {
        setError(result.error || "Something went wrong");
        return;
      }

      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {isEdit ? "Edit Client" : "Add New Client"}
        </h2>
        <p className="text-muted-foreground">
          {isEdit
            ? "Update the client's details below."
            : "Enter the client's information to add them to your account."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Client Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="e.g. Acme Corp"
            {...form.register("name")}
            disabled={loading}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label htmlFor="tin">Taxpayer Identification Number (TIN)</Label>
            <Input
                id="tin"
                placeholder="e.g. 12345678"
                {...form.register("tin")}
                disabled={loading}
            />
            </div>

            <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                {...form.register("email")}
                disabled={loading}
            />
            {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            placeholder="+263 77 123 4567"
            {...form.register("phoneNumber")}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="123 Samora Machel Ave, Harare"
            {...form.register("address")}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
            <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
            >
                Cancel
            </Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update Client" : "Create Client"}
            </Button>
        </div>
      </form>
    </div>
  );
}
