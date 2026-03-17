"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Settings, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  subscriptionTier: string;
}

export function DashboardStats({ subscriptionTier }: DashboardStatsProps) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRate = (force = false) => {
    setLoading(true);
    const url = force ? "/api/rates?refresh=true" : "/api/rates";
    fetch(url)
        .then(res => res.json())
        .then(data => {
            setRate(data.usd_zig);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
  };

  useEffect(() => {
    fetchRate(false);
  }, []);

  return (
    <>
      <Card className="relative overflow-hidden border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="relative space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="text-xl md:text-2xl font-bold tracking-tight whitespace-normal">
              {subscriptionTier} Plan
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase whitespace-nowrap",
                subscriptionTier === "MICRO"
                  ? "bg-zinc-800 text-zinc-300"
                  : subscriptionTier === "BUSINESS"
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/40"
                  : subscriptionTier === "AGENCY"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/40"
              )}
            >
              {subscriptionTier === "MICRO"
                ? "Starter"
                : subscriptionTier === "BUSINESS"
                ? "Growth"
                : subscriptionTier === "AGENCY"
                ? "Agency"
                : "Enterprise"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            {subscriptionTier === "MICRO"
              ? "Basic TaRMS compliance for small teams."
              : "Advanced features, white‑labelling and priority support."}
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/70 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Exchange Rate (ZiG)</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => fetchRate(true)}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="sr-only">Refresh Rate</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">
            {loading ? "..." : rate ? rate.toFixed(4) : "Error"}
          </div>
          <p className="text-xs text-muted-foreground">
            Current RBZ reference rate for 1 USD in ZiG.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
