"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const WORKSPACE_IMAGES = [
  {
    src: "/images/landing/workspace-1.png",
    alt: "Professional workspace with multi-screen setup and natural light",
    caption: "Built for focus",
  },
  {
    src: "/images/landing/workspace-2.png",
    alt: "Developer in deep work at dual-monitor setup",
    caption: "Engineered for precision",
  },
  {
    src: "/images/landing/workspace-3.png",
    alt: "Overhead view of dual-monitor development environment",
    caption: "Designed for clarity",
  },
];

export function WorkspaceSection() {
  const containerRef = useRef(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);

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

    imagesRef.current.forEach((el, index) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: index * 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      id="workspace"
      className="w-full py-24 bg-black border-t border-zinc-800/80 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-zinc-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2
            ref={headingRef}
            className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Built for Professionals
          </h2>
          <div className="h-1 w-20 bg-zinc-800 mx-auto rounded-full" />
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            The same care that goes into your workspace goes into Ephemeral
            Engine — precise, secure, and designed for high-stakes payroll.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
          {WORKSPACE_IMAGES.map((item, i) => (
            <div
              key={i}
              ref={(el) => {
                imagesRef.current[i] = el;
              }}
              className="group relative"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 ring-1 ring-white/5 shadow-2xl shadow-black/50">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-sm font-medium tracking-wide text-zinc-200">
                    {item.caption}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
