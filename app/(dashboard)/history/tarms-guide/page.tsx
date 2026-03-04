import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function TarmsGuidePage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">TaRMS Submission Guide</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>How to Submit Your ZIMRA Return</CardTitle>
            <CardDescription>Follow these steps to upload your generated XML file to the ZIMRA TaRMS portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/50 dark:text-blue-400">1</div>
              <div>
                <h4 className="font-semibold">Process Your Payroll</h4>
                <p className="text-sm text-muted-foreground mt-1">Upload your payroll CSV file on the <strong>Upload</strong> page. Once processing is complete, download the generated ZIP file.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/50 dark:text-blue-400">2</div>
              <div>
                <h4 className="font-semibold">Extract the XML File</h4>
                <p className="text-sm text-muted-foreground mt-1">Open the downloaded ZIP file and locate the <code>zimra_return.xml</code> file. This file contains all your employee tax calculations in the required TaRMS v1 format.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/50 dark:text-blue-400">3</div>
              <div>
                <h4 className="font-semibold">Log in to ZIMRA TaRMS</h4>
                <p className="text-sm text-muted-foreground mt-1">Navigate to the <a href="https://torms.zimra.co.zw/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">ZIMRA TaRMS portal</a> and log in using your company credentials.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/50 dark:text-blue-400">4</div>
              <div>
                <h4 className="font-semibold">Navigate to Returns</h4>
                <p className="text-sm text-muted-foreground mt-1">Click on <strong>Returns</strong> &gt; <strong>File a Return</strong>. Select <strong>PAYE</strong> as the tax type and choose the relevant period.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/50 dark:text-blue-400">5</div>
              <div>
                <h4 className="font-semibold">Upload the XML</h4>
                <p className="text-sm text-muted-foreground mt-1">Choose the <strong>Upload File</strong> option instead of manual entry. Select the <code>zimra_return.xml</code> file you extracted in Step 2. Wait for the system to validate the file.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/50 dark:text-blue-400">6</div>
              <div>
                <h4 className="font-semibold">Confirm and Submit</h4>
                <p className="text-sm text-muted-foreground mt-1">Review the total liability shown on the TaRMS portal to ensure it matches the summary PDF provided in your ZIP file. If everything is correct, click <strong>Submit</strong>.</p>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-muted p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Common Issues & Troubleshooting</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                  <li><strong>Validation Error (Invalid TIN):</strong> Ensure all employee TINs in your original CSV are exactly 10 digits.</li>
                  <li><strong>File Size Exceeded:</strong> ZIMRA occasionally has limits on file uploads. If your payroll exceeds 5,000 employees, you may need to batch them.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
