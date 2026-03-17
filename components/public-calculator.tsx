"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { calculateTax } from "@/lib/ephemeral-engine/calculator";
import { RawPayrollRecord, TaxResult } from "@/lib/ephemeral-engine/types";
import { NSSA_CONFIG } from "@/lib/ephemeral-engine/tax-tables";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

export function PublicCalculator() {
  const [currency, setCurrency] = useState<"USD" | "ZiG">("USD");
  const [basicSalary, setBasicSalary] = useState<string>("");
  const [allowances, setAllowances] = useState<string>("0");
  const [result, setResult] = useState<TaxResult | null>(null);

  const handleCalculate = () => {
    const salary = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;

    const record: RawPayrollRecord = {
        employeeId: "demo",
        name: "Demo Employee",
        basicSalary: salary,
        allowances: allow,
        currency: currency,
        isPermanent: true, // Standard PAYE
    };

    const taxResult = calculateTax(record, {
        nssaEnabled: true,
        necEnabled: false, // Simple default
        sdfEnabled: false, // Employer cost, usually not relevant for "My Net Pay" check
    });

    setResult(taxResult);
  };

  useEffect(() => {
      handleCalculate();
  }, [basicSalary, allowances, currency]);

  const chartData = result ? [
      { name: 'Net Pay', value: result.netPay, color: '#10b981' }, // emerald-500
      { name: 'PAYE Tax', value: result.paye + result.aidsLevy, color: '#ef4444' }, // red-500
      { name: 'NSSA', value: result.nssa, color: '#3b82f6' }, // blue-500
  ] : [];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Enter Salary Details</CardTitle>
            <CardDescription className="text-zinc-400">
              Input your gross income to see the breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-zinc-200">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "ZiG")}>
                <SelectTrigger id="currency" className="bg-zinc-950 border-zinc-700 text-white">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (United States Dollar)</SelectItem>
                  <SelectItem value="ZiG">ZiG (Zimbabwe Gold)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basicSalary" className="text-zinc-200">Basic Salary</Label>
              <Input 
                id="basicSalary" 
                type="number" 
                placeholder="0.00" 
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                className="bg-zinc-950 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowances" className="text-zinc-200">Taxable Allowances</Label>
              <Input 
                id="allowances" 
                type="number" 
                placeholder="0.00" 
                value={allowances}
                onChange={(e) => setAllowances(e.target.value)}
                className="bg-zinc-950 border-zinc-700 text-white"
              />
            </div>
            
            <div className="pt-4">
                 <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCalculate}>
                    Calculate
                 </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-400">
            <h4 className="font-semibold text-zinc-200 mb-2">How it works</h4>
            <ul className="list-disc list-inside space-y-1">
                <li>Uses current 2025 ZIMRA Tax Tables.</li>
                <li>Includes Standard NSSA Contribution (4.5% up to ceiling).</li>
                <li>Includes AIDS Levy (3% of PAYE).</li>
                <li>Assumes "Primary" employment (Standard PAYE table).</li>
            </ul>
        </div>
      </div>

      <div className="space-y-6">
        {result && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Payslip Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex flex-col md:flex-row items-center gap-8">
                   {/* Chart */}
                   <div className="h-[200px] w-[200px] relative">
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                               <Pie
                                   data={chartData}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                                   stroke="none"
                               >
                                   {chartData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                   ))}
                               </Pie>
                               <RechartsTooltip 
                                  formatter={(value: any) => [result.currency + " " + Number(value).toFixed(2), "Amount"]}
                                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                  itemStyle={{ color: '#fff' }}
                               />
                           </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-xs text-zinc-500">Net Pay</span>
                            <span className="text-xl font-bold text-white">{result.currency} {result.netPay.toFixed(2)}</span>
                       </div>
                   </div>

                   {/* Table */}
                   <div className="flex-1 w-full space-y-3">
                       <div className="flex justify-between text-sm">
                           <span className="text-zinc-400">Gross Income</span>
                           <span className="text-white font-medium">{result.currency} {result.grossIncome.toFixed(2)}</span>
                       </div>
                       <div className="h-[1px] bg-zinc-800" />
                       <div className="flex justify-between text-sm">
                           <span className="text-blue-400">NSSA Pension (4.5%)</span>
                           <span className="text-white">{result.currency} {result.nssa.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                           <span className="text-red-400">PAYE Tax</span>
                           <span className="text-white">{result.currency} {result.paye.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                           <span className="text-red-400">AIDS Levy (3%)</span>
                           <span className="text-white">{result.currency} {result.aidsLevy.toFixed(2)}</span>
                       </div>
                       <div className="h-[1px] bg-zinc-800" />
                       <div className="flex justify-between text-base font-bold">
                           <span className="text-emerald-400">Net Pay</span>
                           <span className="text-emerald-400">{result.currency} {result.netPay.toFixed(2)}</span>
                       </div>
                   </div>
               </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-blue-900/30 bg-blue-950/10">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Need a full payroll run?</h3>
                <p className="text-zinc-400 mb-4 text-sm">
                    Process bulk payrolls for your entire company, generate payslips, ZIMRA returns, and bank files in seconds.
                </p>
                <Button asChild className="w-full bg-white text-black hover:bg-zinc-200">
                    <Link href="/register">Start Free Trial</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
