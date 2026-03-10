"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, Table, HelpCircle, XCircle, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { saveAs } from "file-saver";
import { ColumnMapping } from "@/lib/ephemeral-engine/types";
import { GLFormat } from "@/lib/ephemeral-engine/gl-exporter";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error" | "mapping">("idle");
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [processingMonth, setProcessingMonth] = useState<number>(new Date().getMonth() + 1);
  const [glFormat, setGlFormat] = useState<GLFormat>("STANDARD");
  
  // Progress and Retry State
  const [progress, setProgress] = useState(0);
  const [xhrRequest, setXhrRequest] = useState<XMLHttpRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("There was an error processing your file.");

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
      setProgress(0);
    }
  };

  const downloadSample = () => {
    const headers = "EmployeeID,Name,TIN,Basic Salary,Allowances,Tax Exempt Allowances,Currency,Permanent,YTD Gross,YTD Tax Paid";
    const row1 = "E001,John Doe,123456,1000,200,50,USD,true,0,0";
    const row2 = "C001,Jane Casual,987654,500,0,0,USD,false,0,0";
    const content = `${headers}\n${row1}\n${row2}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "payroll_sample.csv");
  };

  const pollJobStatus = async (jobId: string) => {
    setStatus("processing");
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/ephemeral/status/${jobId}`);
        const data = await response.json();

        if (data.status === "completed") {
          setResult(data);
          setStatus("success");
          return true;
        } else if (data.status === "failed") {
          setErrorMessage(data.error || "Background processing failed.");
          setStatus("error");
          return true;
        }
        return false;
      } catch (e) {
        console.error("Polling error", e);
        return false;
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const isDone = await checkStatus();
      if (isDone) clearInterval(interval);
    }, 2000);
  };

  const handleUpload = () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("processingMonth", processingMonth.toString());
    
    if (Object.keys(mapping).length > 0) {
        formData.append("mapping", JSON.stringify(mapping));
    }

    const xhr = new XMLHttpRequest();
    setXhrRequest(xhr);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.jobId) {
            pollJobStatus(data.jobId);
          } else {
            setResult(data);
            setStatus("success");
          }
        } catch (e) {
          setErrorMessage("Failed to parse server response.");
          setStatus("error");
        }
      } else if (xhr.status === 422) {
         try {
             const data = JSON.parse(xhr.responseText);
             if (data.code === "MAPPING_REQUIRED") {
                 setCsvHeaders(data.headers);
                 setStatus("mapping");
             } else {
                 setErrorMessage(data.error || "Validation failed.");
                 setStatus("error");
             }
         } catch(e) {
             setStatus("error");
         }
      } else {
         try {
             const data = JSON.parse(xhr.responseText);
             setErrorMessage(data.error || `Server error: ${xhr.status}`);
         } catch(e) {
             setErrorMessage(`Server error: ${xhr.status}`);
         }
         setStatus("error");
      }
      setXhrRequest(null);
    };

    xhr.onerror = () => {
      setErrorMessage("Network error occurred.");
      setStatus("error");
      setXhrRequest(null);
    };

    xhr.open("POST", "/api/ephemeral/process");
    xhr.send(formData);
  };

  const cancelUpload = () => {
    if (xhrRequest) {
      xhrRequest.abort();
    }
  };

  const submitMapping = () => {
    if (!mapping.employeeId || !mapping.name || !mapping.basicSalary) {
        alert("Please map at least ID, Name, and Basic Salary.");
        return;
    }
    handleUpload();
  };

  const handleDownload = async () => {
    if (!result || !result.fileId) {
        alert("The file ID was not returned.");
        return;
    }

    try {
      setGenerating(true);
      window.location.href = `/api/ephemeral/download?fileId=${result.fileId}`;
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to download reports.");
    } finally {
      setTimeout(() => setGenerating(false), 2000);
    }
  };

  const mapField = (field: keyof ColumnMapping, header: string) => {
    setMapping(prev => ({ ...prev, [field]: header }));
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Upload Payroll</h2>
        <Button variant="outline" size="sm" onClick={downloadSample}>
            <Download className="mr-2 h-4 w-4" />
            Download Sample CSV
        </Button>
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
                 Upload your payroll CSV file for background processing.
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
                    disabled={status !== "idle" && status !== "error"}
                 >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                 </select>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                 <Label htmlFor="payroll-file">Payroll CSV</Label>
                 <input
                    id="payroll-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={status !== "idle" && status !== "error"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 />
              </div>

              {(status === "uploading" || status === "processing") && (
                 <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <p className="text-sm font-medium">
                        {status === "uploading" ? `Uploading... ${progress}%` : "Processing in background..."}
                      </p>
                    </div>
                    {status === "uploading" && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                           <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                 </div>
              )}

              {status === "idle" || status === "error" ? (
                 <Button 
                    onClick={handleUpload} 
                    disabled={!file} 
                    className="w-full"
                 >
                    <Upload className="mr-2 h-4 w-4" />
                    Process Payroll
                 </Button>
              ) : status === "uploading" ? (
                 <Button variant="destructive" onClick={cancelUpload} className="w-full">
                    Cancel Upload
                 </Button>
              ) : null}

           </CardContent>
           <CardFooter className="flex-col items-start gap-2 border-t bg-muted/20 p-6">
              <p className="text-xs text-muted-foreground">
                 Ephemeral Mode: No employee data is saved. ZIPs are encrypted and deleted after 24h.
              </p>
           </CardFooter>
        </Card>
        )}

        <div className="space-y-6">
           {status === "error" && (
              <Card className="border-red-200 bg-red-50">
                 <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-lg font-medium">Processing Failed</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-sm text-red-800">{errorMessage}</p>
                    <Button variant="outline" onClick={() => setStatus("idle")} className="w-full mt-4">Try Again</Button>
                 </CardContent>
              </Card>
           )}

           {status === "success" && result && (
              <Card className="border-green-200 bg-green-50">
                 <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg font-medium">Processing Complete</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <p className="text-sm text-green-800">
                        Processed {result.recordCount} employees successfully.
                    </p>
                    
                    <div className="flex gap-2">
                       <Button 
                          variant="default" 
                          className="w-full" 
                          onClick={handleDownload}
                          disabled={generating}
                       >
                          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          Download ZIP
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           )}
           
           {status === "idle" && (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                 <div>
                    <FileText className="mx-auto h-10 w-10 opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Ready</h3>
                    <p className="text-sm">Upload a file to begin processing.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
