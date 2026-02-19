"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, Table } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateBatchZip } from "@/lib/pdf-generator";
import { saveAs } from "file-saver";

interface ColumnMapping {
  employeeId: string;
  name: string;
  basicSalary: string;
  currency?: string;
  tin?: string;
  isPermanent?: string;
  ytdGross?: string;
  ytdTaxPaid?: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error" | "mapping">("idle");
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [processingMonth, setProcessingMonth] = useState<number>(new Date().getMonth() + 1);
  
  // Mapping State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setResult(null);
      setMapping({});
      setCsvHeaders([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("processingMonth", processingMonth.toString());
    
    // Send mapping if we have it
    if (Object.keys(mapping).length > 0) {
        formData.append("mapping", JSON.stringify(mapping));
    }

    try {
      const res = await fetch("/api/ephemeral/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 422 && data.code === "MAPPING_REQUIRED") {
        setCsvHeaders(data.headers);
        setStatus("mapping");
        // Pre-fill mapping with guesses if possible? 
        // For now start empty or user selects.
        return;
      }

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult(data);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  const submitMapping = () => {
    // Validate mapping (ensure required fields are mapped)
    if (!mapping.employeeId || !mapping.name || !mapping.basicSalary) {
        alert("Please map at least ID, Name, and Basic Salary.");
        return;
    }
    handleUpload();
  };

  const handleDownload = async () => {
    if (!result || !result.data) return;
    
    try {
      setGenerating(true);
      const logoUrl = result.meta?.logoUrl;
      const orgName = result.meta?.orgName || "Zim-PayConnect Client";
      const tin = result.meta?.tin; // Optional
      const isWhiteLabeled = result.meta?.isWhiteLabeled || false;

      const blob = await generateBatchZip(result.data, orgName, logoUrl, tin, isWhiteLabeled);
      saveAs(blob, `Payroll_Reports_${new Date().toISOString().split('T')[0]}.zip`);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate reports.");
    } finally {
      setGenerating(false);
    }
  };

  const mapField = (field: keyof ColumnMapping, header: string) => {
    setMapping(prev => ({ ...prev, [field]: header }));
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Upload Payroll</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {status === "mapping" ? (
             <Card>
                <CardHeader>
                    <CardTitle>Map Columns</CardTitle>
                    <CardDescription>
                        We couldn't automatically match your columns. Please map them below.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Employee ID *</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("employeeId", e.target.value)}
                                value={mapping.employeeId || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("name", e.target.value)}
                                value={mapping.name || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Basic Salary *</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("basicSalary", e.target.value)}
                                value={mapping.basicSalary || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>TIN (Optional)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("tin", e.target.value)}
                                value={mapping.tin || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Currency (Optional)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("currency", e.target.value)}
                                value={mapping.currency || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                         <div className="space-y-2">
                            <Label>Permanent? (Optional)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("isPermanent", e.target.value)}
                                value={mapping.isPermanent || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>YTD Gross (Optional - FDS)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("ytdGross", e.target.value)}
                                value={mapping.ytdGross || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>YTD Tax Paid (Optional - FDS)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => mapField("ytdTaxPaid", e.target.value)}
                                value={mapping.ytdTaxPaid || ""}
                            >
                                <option value="">Select Column...</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={submitMapping} className="w-full">Confirm & Process</Button>
                </CardFooter>
             </Card>
        ) : (
            <Card>
           <CardHeader>
              <CardTitle>Select File</CardTitle>
              <CardDescription>
                 Upload your payroll CSV file for processing.
              </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                 <Label htmlFor="month-select">Processing Month</Label>
                 <select 
                    id="month-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={processingMonth}
                    onChange={(e) => setProcessingMonth(parseInt(e.target.value))}
                 >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                 </select>
                 <p className="text-[0.8rem] text-muted-foreground">
                    Required for accurate FDS calculations.
                 </p>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                 <Label htmlFor="payroll-file">Payroll CSV</Label>
                 <div className="flex items-center gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                       <input
                          id="payroll-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                       />
                    </div>
                 </div>
              </div>

              {file && (
                 <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 grid gap-1">
                       <p className="text-sm font-medium leading-none">{file.name}</p>
                       <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                       </p>
                    </div>
                 </div>
              )}

              <Button 
                 onClick={handleUpload} 
                 disabled={!file || status === "uploading"} 
                 className="w-full"
              >
                 {status === "uploading" ? (
                    <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Processing...
                    </>
                 ) : (
                    <>
                       <Upload className="mr-2 h-4 w-4" />
                       Process Payroll
                    </>
                 )}
              </Button>
           </CardContent>
           <CardFooter className="flex-col items-start gap-2 border-t bg-muted/20 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <AlertCircle className="h-4 w-4" />
                 <span>Ephemeral Processing Mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                 Your file will be processed in-memory. No employee data (names, salaries, TINs) will be saved to our database.
                 Once the output files are generated, the raw data is permanently destroyed.
              </p>
           </CardFooter>
        </Card>
        )}

        <div className="space-y-6">
           {status === "error" && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900">
                 <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <CardTitle className="text-lg font-medium text-red-900 dark:text-red-300">
                       Processing Failed
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-sm text-red-800 dark:text-red-200">
                       There was an error processing your file. Please check the CSV format and try again.
                    </p>
                 </CardContent>
              </Card>
           )}

           {status === "success" && result && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
                 <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-lg font-medium text-green-900 dark:text-green-300">
                       Processing Complete
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-green-800 dark:text-green-200">Records Processed:</span>
                       <span className="font-bold text-green-900 dark:text-green-100">{result.processedRecords}</span>
                    </div>
                    
                    <div className="rounded-md bg-background/50 p-4 font-mono text-xs overflow-auto max-h-[200px] border">
                       {JSON.stringify(result.data, null, 2)}
                    </div>
                    
                    <div className="flex gap-2">
                       <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={handleDownload}
                          disabled={generating}
                       >
                          {generating ? (
                             <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                             </>
                          ) : (
                             <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Payslips (ZIP)
                             </>
                          )}
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           )}
           
           {status === "idle" && !result && (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                 <div>
                    <FileText className="mx-auto h-10 w-10 opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">No Results Yet</h3>
                    <p className="text-sm">Upload a file to see processing results here.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
