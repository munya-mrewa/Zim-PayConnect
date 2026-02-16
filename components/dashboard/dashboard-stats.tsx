"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, Settings, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  subscriptionTier: string;
}

export function DashboardStats({ subscriptionTier }: DashboardStatsProps) {
  const [rate, setRate] = useState<number | null>(null);
  const [processed, setProcessed] = useState<number | null>(null);
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionTier} Plan</div>
            <p className="text-xs text-muted-foreground">
              {subscriptionTier === 'MICRO' ? 'Basic Features' : 'Advanced Features'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Rate (ZiG)</CardTitle>
            <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-primary" onClick={() => fetchRate(true)}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                <span className="sr-only">Refresh Rate</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : rate ? rate.toFixed(4) : "Error"}
            </div>
            <p className="text-xs text-muted-foreground">
              Current RBZ Rate (1 USD)
            </p>
          </CardContent>
        </Card>
    </>
  );
}
