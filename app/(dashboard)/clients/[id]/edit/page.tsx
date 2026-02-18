import { notFound } from "next/navigation";
import { getClient } from "@/app/actions/client";
import { ClientForm } from "@/components/forms/client-form";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: client, success } = await getClient(id);

  if (!success || !client) {
    notFound();
  }

  // Convert Prisma dates to strings or just pass as is if form handles it?
  // ClientForm doesn't use dates.
  
  // Create a clean object for the form
  const formData = {
    id: client.id,
    name: client.name,
    tin: client.tin,
    email: client.email,
    phoneNumber: client.phoneNumber,
    address: client.address,
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ClientForm initialData={formData} isEdit />
    </div>
  );
}
