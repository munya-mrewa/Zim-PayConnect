"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TrialIndicatorProps {
  daysLeft: number;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED';
  tier?: string;
}

export function TrialIndicator({ daysLeft, status, tier }: TrialIndicatorProps) {
  if (status === 'ACTIVE' || status === 'CANCELLED') return null;

  const isExpired = status === 'EXPIRED' || (status === 'TRIAL' && daysLeft <= 0);
  const isUrgent = daysLeft <= 3 && !isExpired;

  return (
    <Card className={cn(
      "border-l-4 shadow-sm mb-6",
      isExpired ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10" : 
      isUrgent ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10" : 
      "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
    )}>
      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isExpired ? (
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <Clock className={cn("h-5 w-5", isUrgent ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400")} />
            )}
            <h3 className="font-semibold text-lg">
              {isExpired ? "Trial Expired" : "Free Trial Active"}
            </h3>
          </div>
          <p className="text-muted-foreground max-w-xl">
            {isExpired 
              ? "Your 7-day free trial has ended. To continue processing payrolls and accessing your reports, please upgrade to a paid plan."
              : `You have ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining in your free trial. Upgrade now to ensure uninterrupted access.`
            }
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isExpired ? (
             <Button asChild variant="destructive" className="w-full md:w-auto">
                <Link href="/upgrade">Upgrade Now</Link>
             </Button>
          ) : (
             <Button asChild className={cn("w-full md:w-auto", isUrgent ? "bg-orange-600 hover:bg-orange-700 text-white" : "")}>
                <Link href="/upgrade">
                   Upgrade Plan
                </Link>
             </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
