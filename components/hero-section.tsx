"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);
  const bgRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Background fade in
    tl.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 2 });

    // Title reveal (text rise up)
    tl.fromTo(
      titleRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 },
      "-=1.5"
    );

    // Subtitle reveal
    tl.fromTo(
      subtitleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 },
      "-=0.8"
    );

    // Buttons reveal
    tl.fromTo(
      buttonsRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      "-=0.6"
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full min-h-[90vh] flex flex-col justify-center items-center overflow-hidden">
      {/* Cinematic Background Gradient */}
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none opacity-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 
            ref={titleRef} 
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white bg-clip-text"
            style={{ textShadow: "0 0 40px rgba(255,255,255,0.1)" }}
          >
            <span className="block mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              The Future of Payroll
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 text-3xl md:text-5xl lg:text-6xl font-light italic">
              Is Ephemeral.
            </span>
          </h1>
          
          <p 
            ref={subtitleRef}
            className="mx-auto max-w-[800px] text-zinc-400 md:text-xl lg:text-2xl font-light tracking-wide leading-relaxed opacity-0"
          >
            Compliant with ZIMRA TaRMS 2025-2026. <br className="hidden md:block" />
            Processed in memory. Vanishes without a trace.
          </p>

          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 opacity-0">
            <Link href="#pricing">
              <Button size="lg" variant="luxury" className="min-w-[200px]">
                Start 3-Day Free Trial
              </Button>
            </Link>
            <Link href="/user-guide">
              <Button size="lg" variant="outline" className="min-w-[200px] border-zinc-700 hover:border-white/50 text-zinc-300 hover:text-white">
                User Guide
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="min-w-[200px] border-zinc-700 hover:border-white/50 text-zinc-300 hover:text-white">
                Discover How
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-zinc-500 to-transparent"></div>
      </div>
    </section>
  );
}
