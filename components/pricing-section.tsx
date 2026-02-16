"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/lib/config/pricing";

interface PricingSectionProps {
  isTrial?: boolean;
}

export function PricingSection({ isTrial = false }: PricingSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!session) {
      router.push(`/register?plan=${plan.id}`);
      return;
    }

    if (!session.user.organizationId) {
       console.error("User has no organization ID");
       return;
    }

    setLoadingId(plan.id);

    try {
      if (isTrial) {
        const res = await fetch("/api/subscription/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan.id }),
        });
        
        if (!res.ok) throw new Error("Failed to update trial plan");
        
        router.refresh();
        router.push("/dashboard");
        return;
      }

      const res = await fetch("/api/pesepay/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          orgId: session.user.organizationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Ideally show a toast notification here
      alert("Failed to process request. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section id="pricing" className="w-full py-24 bg-zinc-950 border-t border-zinc-800 relative">
       {/* Background glow */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-blue-900/10 blur-[100px] pointer-events-none rounded-full"></div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Investment Plans</h2>
            <p className="max-w-[900px] text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Transparent pricing for ephemeral security. No hidden retention fees.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2 lg:grid-cols-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className="flex flex-col border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-zinc-400">
                   {plan.maxEmployees === 'Unlimited' ? 'Unlimited' : `Up to ${plan.maxEmployees}`} Employees
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="text-4xl font-bold mb-6 text-white tracking-tight">
                  ${plan.price}
                  <span className="text-sm font-medium text-zinc-500 ml-1">
                    /{plan.period === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                <div className="w-full h-[1px] bg-zinc-800 mb-6"></div>
                <ul className="space-y-3 text-sm text-zinc-300">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="mr-3 h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button 
                  className="w-full bg-white text-black hover:bg-zinc-200 shadow-none border-0" 
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingId === plan.id}
                >
                  {loadingId === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    isTrial ? `Start ${plan.name} Trial` : (session ? "Select Plan" : "Get Started")
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
