"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Zap, Activity, FileText, Lock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function FeatureSection() {
  const containerRef = useRef(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      
      gsap.fromTo(card, 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          }
        }
      );
    });
  }, { scope: containerRef });

  const features = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-white" />,
      title: "Ephemeral Processing",
      desc: "Zero data liability. Your sensitive payroll data exists only in RAM and is permanently destroyed milliseconds after processing.",
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: <CheckCircle2 className="h-10 w-10 text-white" />,
      title: "TaRMS 2025 Compliant",
      desc: "Engineered for ZIMRA's 2025-2026 framework. Includes automatic NSSA POBS (4.5%), AIDS Levy, and precise FDS calculations.",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <Zap className="h-10 w-10 text-white" />,
      title: "Dual Currency Engine",
      desc: "Process ZiG and USD payrolls simultaneously with real-time exchange rate unification and automated reconciliation.",
      gradient: "from-amber-500/20 to-orange-500/20"
    },
    {
      icon: <Activity className="h-10 w-10 text-white" />,
      title: "Live Tax Tables",
      desc: "Always up-to-date with the latest 2025/2026 progressive tax brackets for both local (ZiG) and foreign (USD) currency incomes.",
      gradient: "from-red-500/20 to-rose-500/20"
    },
    {
      icon: <FileText className="h-10 w-10 text-white" />,
      title: "Intelligent Parsing",
      desc: "Robust CSV ingestion engine that strictly validates Employee IDs, TINs, and Salary data before processing begins.",
      gradient: "from-cyan-500/20 to-blue-500/20"
    },
    {
      icon: <Lock className="h-10 w-10 text-white" />,
      title: "Audit-Ready Security",
      desc: "Generate compliant tax returns and pay slips that meet strict statutory reporting standards instantly, without retaining data.",
      gradient: "from-violet-500/20 to-fuchsia-500/20"
    }
  ];

  return (
    <section ref={containerRef} id="features" className="w-full py-24 bg-black relative">
      <div className="container px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Precision Engineering
          </h2>
          <div className="h-1 w-20 bg-zinc-800 mx-auto rounded-full"></div>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Our platform is continuously updated to ensure strict adherence to the latest Zimbabwe statutory requirements.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} ref={el => { cardsRef.current[i] = el; }}>
              <Card className="h-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all duration-500 group overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6 relative z-10">
                  <div className="p-4 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors duration-300 ring-1 ring-white/10">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
