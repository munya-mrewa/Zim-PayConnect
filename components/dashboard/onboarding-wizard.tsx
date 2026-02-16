"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Step {
    id: string;
    label: string;
    completed: boolean;
    href: string;
}

export function OnboardingWizard({ steps }: { steps: Step[] }) {
    const nextStep = steps.find(s => !s.completed);

    if (!nextStep) return null; 

    return (
        <Card className="border-zinc-800 bg-zinc-900/50 mb-8 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-lg text-white">Getting Started</CardTitle>
                <CardDescription className="text-zinc-400">
                    Complete these steps to fully set up your account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-zinc-800/50">
                            {step.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <Circle className="h-5 w-5 text-zinc-600" />
                            )}
                            <span className={step.completed ? "text-zinc-500 line-through" : "font-medium text-zinc-200"}>
                                {step.label}
                            </span>
                             {!step.completed && step.id === nextStep.id && (
                                <Link 
                                    href={step.href} 
                                    className="ml-auto"
                                >
                                    <Button size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-300 hover:text-white hover:border-white/50 bg-transparent">
                                        Do it now <ArrowRight className="ml-2 h-3 w-3" />
                                    </Button>
                                </Link>
                             )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
