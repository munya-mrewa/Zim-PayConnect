"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BrandingFormProps {
  initialLogoUrl: string | null;
  subscriptionTier: string;
}

export function BrandingForm({ initialLogoUrl, subscriptionTier }: BrandingFormProps) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = ['AGENCY', 'ENTERPRISE'].includes(subscriptionTier);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/upload-logo", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Upload failed");
        }

        setLogoUrl(data.url);
        router.refresh();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Branding & White-Labeling</CardTitle>
        </div>
        <CardDescription>Customize the look of your generated payslips.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canEdit && (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/20">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            Upgrade to the <strong>Agency</strong> plan to upload your custom logo.
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-2">
            <Label>Organization Logo</Label>
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8">
                {logoUrl ? (
                    <div className="relative h-32 w-full max-w-[200px]">
                         <Image 
                            src={logoUrl} 
                            alt="Company Logo" 
                            fill 
                            className="object-contain"
                            unoptimized 
                         />
                         {canEdit && (
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                                onClick={() => setLogoUrl(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                         )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-10 w-10 opacity-50" />
                        <span className="text-sm">No logo uploaded</span>
                    </div>
                )}
                
                {canEdit && (
                     <div className="relative">
                        <Button variant="outline" disabled={loading} asChild>
                             <label>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {logoUrl ? "Change Logo" : "Upload Logo"}
                                <input 
                                    type="file" 
                                    accept="image/png, image/jpeg" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                             </label>
                        </Button>
                    </div>
                )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
                Recommended size: 200x100px. Max size: 2MB. Format: PNG or JPG.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
