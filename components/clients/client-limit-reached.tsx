"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClientLimitReached({ orgId, maxClients }: { orgId: string; maxClients: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pesepay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, type: "EXTRA_CLIENT" }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate payment");
      }

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error(error);
      alert("Payment initiation failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Client Limit Reached</CardTitle>
        <CardDescription className="text-orange-700">
          You have reached the maximum of {maxClients} clients allowed on your current plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-orange-800 mb-4">
          To add more clients without upgrading, you can purchase an additional client slot for a one-time fee of <strong>$15.00</strong>.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePurchase} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
          )}
          Buy Extra Slot ($15)
        </Button>
      </CardFooter>
    </Card>
  );
}
