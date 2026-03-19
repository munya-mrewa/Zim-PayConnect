"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Loader2, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreditBalanceProps {
  credits: number;
}

export function CreditBalance({ credits }: CreditBalanceProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Pay-Per-Process Credits</CardTitle>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
            Process reports without a monthly subscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
            <div className="space-y-1">
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-50">{credits}</p>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Available Credits</p>
            </div>
            <Button size="sm" onClick={handleBuyCredit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Buy Credit ($5)
            </Button>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
            1 Credit = 1 Full Payroll Batch Process
        </p>
      </CardFooter>
    </Card>
  );
}
