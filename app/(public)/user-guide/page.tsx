import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CheckCircle2, FileText, Upload, Sliders, Calculator, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "User Guide",
  description: "Comprehensive guide for using Zim-PayConnect. Learn how to process compliant Zimbabwean payrolls securely.",
};

export default function UserGuidePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Zim-PayConnect User Guide
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your comprehensive guide to mastering the ephemeral payroll engine. Process with confidence, compliance, and zero footprint.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/register">
            <Button size="lg" variant="luxury">Start Processing Now</Button>
          </Link>
          <Link href="mailto:munya.mrewa@vextraldigital.com">
             <Button variant="outline">Contact Support</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
        <Card className="bg-card/50 backdrop-blur border-muted">
          <CardHeader>
            <Sliders className="h-10 w-10 text-primary mb-2" />
            <CardTitle>1. Organization Setup</CardTitle>
            <CardDescription>Configure your company profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Navigate to <strong>Settings</strong>.</li>
              <li>Enter your Organization Name, TIN, and Address.</li>
              <li>Upload your company logo (Enterprise plans only).</li>
              <li>Set your default currency (USD/ZiG).</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-muted">
          <CardHeader>
            <Calculator className="h-10 w-10 text-primary mb-2" />
            <CardTitle>2. Tax & Rates</CardTitle>
            <CardDescription>Automated compliance engine.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Enable <strong>Auto-Fetch</strong> for daily RBZ/market exchange rates.</li>
              <li>Configure NSSA (4.5%), NEC, and SDF settings.</li>
              <li>Rates automatically update ZiG tax bands and NSSA ceilings.</li>
              <li>Casual workers are automatically exempt from NSSA/NEC.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-muted">
          <CardHeader>
            <Upload className="h-10 w-10 text-primary mb-2" />
            <CardTitle>3. Upload & FDS</CardTitle>
            <CardDescription>Smart mapping and FDS logic.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Select <strong>Processing Month</strong> for accurate FDS averaging.</li>
              <li>Map <strong>YTD Gross</strong> and <strong>YTD Tax Paid</strong> for cumulative calculation.</li>
              <li>Map <strong>Tax Exempt Allowances</strong> to reduce liability correctly.</li>
              <li>Set "Permanent" column to <code>FALSE</code> for 20% Flat Tax.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-muted">
          <CardHeader>
            <FileText className="h-10 w-10 text-primary mb-2" />
            <CardTitle>4. Reports & GL</CardTitle>
            <CardDescription>Accounting ready exports.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Download <strong>PDF Payslips</strong> (zipped).</li>
              <li>Get ZIMRA <strong>P2 Returns</strong> (XML) for TaRMS.</li>
              <li>Export <strong>General Ledger</strong> CSVs for Sage or QuickBooks.</li>
              <li>Auditable "Payroll Summary" included in every batch.</li>
            </ul>
          </CardContent>
        </Card>

         <Card className="bg-card/50 backdrop-blur border-muted">
          <CardHeader>
            <ShieldCheck className="h-10 w-10 text-primary mb-2" />
            <CardTitle>5. Privacy & Security</CardTitle>
            <CardDescription>Zero-knowledge architecture.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>We do <strong>not</strong> store employee PII.</li>
              <li>Only aggregate audit logs (file name, record count) are saved.</li>
              <li>Two-Factor Authentication (2FA) protects your account.</li>
              <li>All processing happens in volatile memory.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-muted">
          <CardHeader>
            <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
            <CardTitle>6. Payments & Credits</CardTitle>
            <CardDescription>Flexible pricing for your needs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Start with a <strong>3-Day Free Trial</strong>.</li>
              <li>Subscribe monthly for unlimited processing.</li>
              <li>Or buy <strong>Credits</strong> for pay-as-you-go.</li>
              <li>Secure payments via Pesepay (EcoCash, Visa/Mastercard).</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 p-8 rounded-lg border border-muted text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Ready to simplify your payroll?</h2>
        <p className="text-muted-foreground mb-6">
          Join hundreds of Zimbabwean businesses using the most secure, compliant, and ephemeral payroll engine.
        </p>
        <Link href="/register">
          <Button size="lg" variant="luxury" className="w-full sm:w-auto min-w-[200px]">Create Free Account</Button>
        </Link>
      </div>
    </div>
  );
}
