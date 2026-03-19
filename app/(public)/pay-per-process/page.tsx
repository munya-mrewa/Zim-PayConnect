import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Coins, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAY_PER_PROCESS_COST } from "@/lib/config/pricing";

export const metadata: Metadata = {
  title: "Pay Per Process",
  description:
    "Process one payroll batch at a fixed price without a monthly subscription.",
};

export default function PayPerProcessPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">Pay Per Process</h1>
        <p className="text-xl text-zinc-400">
          Run one full payroll batch for ${PAY_PER_PROCESS_COST}, no monthly plan required.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-amber-400" />
          <p className="text-zinc-200 m-0">1 credit = 1 full payroll batch process</p>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <p className="text-zinc-200 m-0">Ephemeral processing with no data retention</p>
        </div>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-blue-400" />
          <p className="text-zinc-200 m-0">Buy credits from your dashboard anytime</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/register" className="no-underline">
          <Button className="w-full sm:w-auto">
            Create Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/login" className="no-underline">
          <Button variant="outline" className="w-full sm:w-auto">
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
