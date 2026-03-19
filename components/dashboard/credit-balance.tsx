"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Loader2, Plus } from "lucide-react";

interface CreditBalanceProps {
  credits: number;
}

export function CreditBalance({ credits }: CreditBalanceProps) {
  const [loading, setLoading] = useState(false);

  const handleBuyCredit = async () => {
    setLoading(true);
    try {
        const res = await fetch("/api/pesepay/buy-credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1 })
        });
        
        const data = await res.json();
        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
        } else {
            alert("Failed to initiate payment");
        }
    } catch (e) {
        console.error(e);
        alert("Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pay-Per-Process</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{credits}</div>
        <p className="text-xs text-muted-foreground mb-3">
          Available Credits
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleBuyCredit}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-2 h-3.5 w-3.5" />
          )}
          Buy Credit ($5)
        </Button>
      </CardContent>
    </Card>
  );
}
