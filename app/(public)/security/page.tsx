import { ShieldCheck, Lock, Trash2, Zap, Server, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityWhitepaper() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <ShieldCheck className="mx-auto h-16 w-16 text-blue-500" />
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
          Security & Privacy Whitepaper
        </h1>
        <p className="text-xl text-zinc-400">
          How Zim-PayConnect protects your payroll data through Zero-Persistence architecture.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-zinc-800 pb-2">Executive Summary</h2>
        <p className="text-zinc-300 leading-relaxed">
          Traditional payroll systems store sensitive employee data (TINs, Basic Salaries, Names) in persistent databases for years. 
          Zim-PayConnect introduces the <strong>Ephemeral Engine</strong>, a paradigm shift where employee data exists only in memory 
          during the processing cycle. We facilitate compliance with ZIMRA's 2025/2026 TaRMS framework without creating a permanent 
          data liability for your organization.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-blue-400" />
              In-Memory Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400 text-sm">
            Uploaded CSV data is streamed directly into an isolated memory buffer. Calculations are performed on-the-fly, 
            and the raw data is never written to a database disk.
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-blue-400" />
              AES-256 Encryption
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400 text-sm">
            Generated outputs (PDFs, XMLs) are encrypted using industry-standard AES-256-CBC before being saved to a 
            secure, short-term cache.
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trash2 className="h-5 w-5 text-blue-400" />
              Auto-Purge Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400 text-sm">
            All processed files are automatically purged from our servers within 24 hours. A permanent record of this 
            destruction is logged in your Audit Trail as a "Data Disposal" event.
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Server className="h-5 w-5 text-blue-400" />
              Data Sovereignty
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-400 text-sm">
            Zim-PayConnect utilizes localized processing nodes to ensure that ZIMRA-specific data logic remains 
            compliant with Zimbabwean data protection regulations.
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-zinc-800 pb-2">Compliance Framework</h2>
        <div className="prose prose-invert max-w-none text-zinc-300">
          <p>
            Our architecture is specifically designed to meet the requirements of the <strong>ZIMRA 2025/2026 TaRMS</strong> system:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>FDS Calculations:</strong> Real-time cumulative tax projections without storing YTD history on our servers.</li>
            <li><strong>XML Generation:</strong> Secure transformation of CSV data into encrypted ZIMRA-compliant XML returns.</li>
            <li><strong>Auditability:</strong> Detailed logs of when data was processed and when it was destroyed, providing a clear chain of custody.</li>
          </ul>
        </div>
      </section>

      <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ready to process secure payroll?</h3>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Zim-PayConnect allows you to focus on compliance without the risk of long-term data retention.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Get Started
          </a>
          <a href="/login" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
