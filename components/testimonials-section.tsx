"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, BadgeCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote:
      "We needed a solution that could handle FDS and Non-FDS split for ZIMRA without retaining employee data. Ephemeral Engine delivered exactly that — our audit team and board are both satisfied.",
    author: "Tendai M.",
    role: "Finance Director",
    badge: "TaRMS Early Adopter",
    location: "Harare",
  },
  {
    quote:
      "The peace of mind that comes from zero data storage is unmatched. We run payroll, get our TaRMS-ready files, and nothing sensitive ever touches disk. This is how payroll should work in 2025.",
    author: "Rumbidzai K.",
    role: "HR & Compliance Lead",
    badge: "Verified",
    location: "Bulawayo",
  },
  {
    quote:
      "From CSV upload to ZIMRA-ready output in minutes. The dual-currency engine and live tax tables mean we're always compliant. We've reduced reconciliation time by more than half.",
    author: "Farai C.",
    role: "Accountant",
    badge: "Enterprise",
    location: "Harare",
  },
];

export function TestimonialsSection() {
  const containerRef = useRef(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    if (!headingRef.current) return;
    gsap.fromTo(
      headingRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      }
    );

    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(
        card,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: index * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      id="testimonials"
      className="w-full py-24 bg-black border-t border-zinc-800/80 relative"
    >
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-zinc-900/30 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2
            ref={headingRef}
            className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Trusted by Finance Leaders
          </h2>
          <div className="h-1 w-20 bg-zinc-800 mx-auto rounded-full" />
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Teams across Zimbabwe rely on Ephemeral Engine for ZIMRA TaRMS
            compliance and secure, ephemeral payroll processing.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
            >
              <Card className="h-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 transition-all duration-500 group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-8 flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <Quote className="h-10 w-10 text-zinc-700 shrink-0 mt-1" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      <BadgeCheck className="h-3 w-3 text-emerald-500/80" />
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed flex-1 text-[15px]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-8 pt-6 border-t border-zinc-800">
                    <p className="font-semibold text-white">{t.author}</p>
                    <p className="text-sm text-zinc-500">
                      {t.role}
                      {t.location && (
                        <span className="text-zinc-600"> · {t.location}</span>
                      )}
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
