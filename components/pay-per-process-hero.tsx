"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  ShieldCheck,
  FileText,
  ArrowRight,
  Loader2,
  Check,
  Coins,
} from "lucide-react";
import { PAY_PER_PROCESS_COST } from "@/lib/config/pricing";
import posthog from "posthog-js";
import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "Buy a Credit",
    desc: "One credit costs $5. Secure checkout via Pesepay — no subscription required.",
    icon: Coins,
  },
  {
    num: "02",
    title: "Upload Your CSV",
    desc: "Upload your payroll CSV from the dashboard. Our engine validates and processes it in RAM.",
    icon: FileText,
  },
  {
    num: "03",
    title: "Download Your Report",
    desc: "Get your ZIMRA TaRMS-ready files, payslips, and tax breakdown — instantly.",
    icon: Zap,
  },
];

const VALUE_PROPS = [
  "No monthly subscription",
  "Full TaRMS 2025/2026 compliance",
  "FDS & Non-FDS split included",
  "PDF payslips generated",
  "Zero data retention",
  "Dual currency (ZiG & USD)",
];

export function PayPerProcessHero() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBuyCredit = async () => {
    if (!session) {
      router.push("/register?credit=1");
      return;
    }

    if (!session.user.organizationId) {
      console.error("User has no organization ID");
      return;
    }

    setLoading(true);
    try {
      posthog.capture("ppp_credit_purchase_initiated", {
        source: "public_page",
        amount: PAY_PER_PROCESS_COST,
      });

      const res = await fetch("/api/pesepay/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 1 }),
      });

      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-20">
      {/* Hero */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          No Subscription Required
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          One Report.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300">
            One Credit.
          </span>
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Process a full ZIMRA TaRMS-compliant payroll batch for just{" "}
          <span className="text-white font-semibold">${PAY_PER_PROCESS_COST}</span>.
          No commitment, no recurring fees — pay only when you need it.
        </p>
      </div>

      {/* Pricing card */}
      <div className="max-w-md mx-auto">
        <Card className="border border-zinc-800 bg-zinc-900/60 backdrop-blur overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  Per Report
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-5xl font-bold text-white tracking-tight">
                    ${PAY_PER_PROCESS_COST}
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">USD</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-zinc-800 ring-1 ring-white/10 flex items-center justify-center">
                <Coins className="h-7 w-7 text-zinc-300" />
              </div>
            </div>

            <div className="h-px bg-zinc-800 mb-6" />

            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              1 Credit = 1 Full Payroll Batch. Includes FDS/Non-FDS split,
              payslips, and all TaRMS-ready output files.
            </p>

            <Button
              size="lg"
              className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-[1.02] font-semibold"
              onClick={handleBuyCredit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : session ? (
                <>
                  Buy Credit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure checkout via Pesepay</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.num} className="relative group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-zinc-900 border border-zinc-800 ring-1 ring-white/5 flex items-center justify-center group-hover:border-zinc-700 transition-colors duration-300">
                  <step.icon className="h-6 w-6 text-zinc-300" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                  Step {step.num}
                </span>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
          Everything Included
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
          {VALUE_PROPS.map((prop) => (
            <div key={prop} className="flex items-center gap-3 py-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-zinc-300 text-sm">{prop}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div className="max-w-3xl mx-auto text-center space-y-6 py-8 border-t border-zinc-800/80">
        <p className="text-zinc-500 text-sm">
          Need to process payroll regularly?
        </p>
        <Link href="/#pricing">
          <Button
            variant="outline"
            className="border-zinc-700 hover:border-white/50 text-zinc-300 hover:text-white"
          >
            View Subscription Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
