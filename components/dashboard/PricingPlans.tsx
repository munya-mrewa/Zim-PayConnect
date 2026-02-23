"use client";

import { useState } from "react";
import { SUBSCRIPTION_PLANS, SubscriptionPlanId, PAY_PER_PROCESS_COST } from "@/lib/config/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export function PricingPlans() {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (item: { tierId?: SubscriptionPlanId, type?: 'CREDIT', amount?: number }) => {
    const loadingKey = item.type === 'CREDIT' ? 'CREDIT' : item.tierId!;
    try {
      setLoading(loadingKey);
      const response = await fetch("/api/pesepay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to initiate payment");
      }

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error: any) {
      console.error("Payment Error:", error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Pay-As-You-Go Card */}
       <Card className="flex flex-col border-dashed border-2 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Pay As You Go</CardTitle>
            <CardDescription>
              Perfect for one-off reports without commitment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-3xl font-bold mb-4">
              ${PAY_PER_PROCESS_COST}
              <span className="text-sm font-normal text-muted-foreground">
                /report
              </span>
            </div>
            <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Single Report Generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Instant Access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  No Subscription Required
                </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handlePurchase({ type: 'CREDIT', amount: 1 })}
              disabled={loading !== null}
            >
              {loading === 'CREDIT' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Buy 1 Credit"
              )}
            </Button>
          </CardFooter>
        </Card>

      {SUBSCRIPTION_PLANS.map((plan) => (
        <Card key={plan.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription className="flex flex-col gap-2 min-h-[3rem]">
              <span>{plan.description}</span>
              <span className="font-medium text-foreground">
                {plan.maxEmployees === 'Unlimited' 
                  ? 'Unlimited Employees' 
                  : `Up to ${plan.maxEmployees} Employees`}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-3xl font-bold mb-4">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">
                /{plan.period === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handlePurchase({ tierId: plan.id })}
              disabled={loading !== null}
            >
              {loading === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade"
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
