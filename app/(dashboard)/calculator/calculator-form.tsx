"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { calculateTax } from "@/lib/ephemeral-engine/calculator";
import { RawPayrollRecord, TaxResult } from "@/lib/ephemeral-engine/types";
import { Calculator } from "lucide-react";

export function CalculatorForm() {
  const [salary, setSalary] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [currency, setCurrency] = useState<"USD" | "ZiG">("USD");
  const [result, setResult] = useState<TaxResult | null>(null);

  const handleCalculate = () => {
    const record: RawPayrollRecord = {
        employeeId: "temp",
        name: "What-If Analysis",
        basicSalary: salary,
        allowances: allowances,
        currency: currency,
        isPermanent: true
    };

    const taxResult = calculateTax(record);
    setResult(taxResult);
  };

  // Auto-calculate on change
  useEffect(() => {
    if (salary > 0) handleCalculate();
  }, [salary, allowances, currency]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Input Parameters</CardTitle>
                <CardDescription>Enter salary details to simulate deductions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={(v: "USD" | "ZiG") => setCurrency(v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD (United States Dollar)</SelectItem>
                            <SelectItem value="ZiG">ZiG (Zimbabwe Gold)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Basic Salary</Label>
                    <Input 
                        type="number" 
                        value={salary} 
                        onChange={(e) => setSalary(Number(e.target.value))} 
                        placeholder="0.00" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Allowances (Taxable)</Label>
                    <Input 
                        type="number" 
                        value={allowances} 
                        onChange={(e) => setAllowances(Number(e.target.value))} 
                        placeholder="0.00" 
                    />
                </div>
                <Button className="w-full" onClick={handleCalculate}>Calculate</Button>
            </CardContent>
        </Card>

        <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    <CardTitle>Tax Breakdown</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {result ? (
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between font-medium">
                            <span>Gross Income</span>
                            <span>{currency} {result.grossIncome.toFixed(2)}</span>
                        </div>
                        <div className="border-t my-2" />
                        <div className="flex justify-between text-muted-foreground">
                            <span>NSSA (Pension)</span>
                            <span className="text-red-500">-{result.nssa.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>NEC</span>
                            <span className="text-red-500">-{result.nec.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Taxable Income</span>
                            <span>{result.taxableIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>PAYE (Tax)</span>
                            <span className="text-red-500">-{result.paye.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>AIDS Levy</span>
                            <span className="text-red-500">-{result.aidsLevy.toFixed(2)}</span>
                        </div>
                        <div className="border-t my-2 border-zinc-300 dark:border-zinc-700" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Net Pay</span>
                            <span className="text-green-600">{currency} {result.netPay.toFixed(2)}</span>
                        </div>
                        <div className="border-t my-2 border-zinc-300 dark:border-zinc-700" />
                        <div className="flex justify-between text-muted-foreground text-xs">
                            <span>Employer Cost (SDF - 1%)</span>
                            <span className="text-orange-500">+{result.sdf ? result.sdf.toFixed(2) : "0.00"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-4 text-center">
                            * Estimates based on 2025/2026 Projections
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                        Enter values to see breakdown.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
