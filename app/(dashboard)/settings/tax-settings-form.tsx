"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaxSettingsValues, taxSettingsSchema } from "@/lib/validations/settings";
import { updateTaxSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2, RefreshCw } from "lucide-react";

interface TaxSettingsFormProps {
  initialData: TaxSettingsValues;
}

export function TaxSettingsForm({ initialData }: TaxSettingsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaxSettingsValues>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: initialData,
  });

  const nssaEnabled = watch("nssaEnabled");
  const necEnabled = watch("necEnabled");
  const sdfEnabled = watch("sdfEnabled");
  const autoUpdate = watch("autoUpdateRates");

  const handleSync = async (e: React.MouseEvent) => {
      e.preventDefault();
      setSyncing(true);
      try {
          const res = await fetch("/api/rates?refresh=true");
          const data = await res.json();
          if (data.usd_zig) {
              setValue("currentExchangeRate", data.usd_zig, { shouldDirty: true });
              setSuccess("Rate synced successfully!");
          }
      } catch (e) {
          console.error(e);
          setError("Failed to sync rate.");
      } finally {
          setSyncing(false);
      }
  };

  const onSubmit = (data: TaxSettingsValues) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateTaxSettings(data);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || "Updated successfully");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Statutory Deductions</CardTitle>
        </div>
        <CardDescription>Configure tax rates and ceilings for your organization.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
            
            {/* Currency */}
            <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select 
                    defaultValue={initialData.defaultCurrency} 
                    onValueChange={(val) => setValue("defaultCurrency", val as "USD" | "ZiG")}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD (United States Dollar)</SelectItem>
                        <SelectItem value="ZiG">ZiG (Zimbabwe Gold)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border-t" />

            {/* Exchange Rate */}
            <div className="space-y-4">
                <Label className="font-semibold">Exchange Rate (USD to ZiG)</Label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="autoUpdateRates" 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            {...register("autoUpdateRates")} 
                        />
                        <Label htmlFor="autoUpdateRates" className="font-normal">Auto-Fetch Daily Rate</Label>
                    </div>
                </div>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label>Current Rate (1 USD = X ZiG)</Label>
                        <Input 
                            type="number" 
                            step="0.0001" 
                            {...register("currentExchangeRate")} 
                            disabled={autoUpdate}
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={handleSync} 
                        disabled={syncing || !autoUpdate}
                        title="Sync now (Requires Auto-Fetch enabled)"
                    >
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="ml-2">Sync</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Used to calculate NSSA ceilings and tax bands in local currency.
                </p>
            </div>

            <div className="border-t" />

            {/* NSSA */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="nssaEnabled" 
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...register("nssaEnabled")} 
                    />
                    <Label htmlFor="nssaEnabled" className="font-semibold">NSSA (National Social Security)</Label>
                </div>
                
                {nssaEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                         <div className="space-y-2">
                            <Label>Rate (0.045 = 4.5%)</Label>
                            <Input type="number" step="0.0001" {...register("nssaRate")} />
                            {errors.nssaRate && <p className="text-sm text-red-500">{errors.nssaRate.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Ceiling (USD)</Label>
                            <Input type="number" step="0.01" {...register("nssaCeilingUSD")} />
                        </div>
                         <div className="space-y-2">
                            <Label>Ceiling (ZiG)</Label>
                            <Input type="number" step="0.01" {...register("nssaCeilingZiG")} />
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t" />

            {/* NEC */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                     <input 
                        type="checkbox" 
                        id="necEnabled" 
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...register("necEnabled")} 
                    />
                    <Label htmlFor="necEnabled" className="font-semibold">NEC (Employment Council)</Label>
                </div>
                 {necEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                         <div className="space-y-2">
                            <Label>Rate (e.g. 0.02 = 2%)</Label>
                            <Input type="number" step="0.0001" {...register("necRate")} />
                             {errors.necRate && <p className="text-sm text-red-500">{errors.necRate.message}</p>}
                        </div>
                    </div>
                )}
            </div>

             <div className="border-t" />

             {/* SDF */}
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                     <input 
                        type="checkbox" 
                        id="sdfEnabled" 
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...register("sdfEnabled")} 
                    />
                    <Label htmlFor="sdfEnabled" className="font-semibold">SDF (Standards Development)</Label>
                </div>
                 {sdfEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                         <div className="space-y-2">
                            <Label>Rate (Default 0.01 = 1%)</Label>
                            <Input type="number" step="0.0001" {...register("sdfRate")} />
                             {errors.sdfRate && <p className="text-sm text-red-500">{errors.sdfRate.message}</p>}
                        </div>
                    </div>
                )}
            </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
