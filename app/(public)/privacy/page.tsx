import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Our commitment to Zero Data Liability and ephemeral processing.",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last Updated: February 12, 2026</p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Our Core Principle: Ephemeral Processing</h2>
        <p>
          Zim-PayConnect is built on a "Zero Data Liability" architecture. We believe that the best way to protect sensitive 
          payroll data is to not have it.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 my-4">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            We process your data in Random Access Memory (RAM) only. Once the processing session is complete and your output files 
            are generated, all raw employee data is immediately and permanently destroyed from our active memory.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Information We Collect</h2>
        <p>We only collect and store the minimum information necessary to manage your account and subscription:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> Name, email address, and encrypted password.</li>
          <li><strong>Organization Details:</strong> Company name, Taxpayer ID (TIN), billing address, and <strong>Tax/Exchange Rate Configuration</strong>.</li>
          <li><strong>Transaction Logs:</strong> Metadata about processing events (e.g., "File processed at 10:00 AM", "Success/Fail status", "Record count"). <strong>We do NOT log employee names, salaries, or IDs.</strong></li>
          <li><strong>Payment Info:</strong> We do not store credit card details. Payments are processed by Pesepay.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. How We Process Payroll Data</h2>
        <p>When you upload a payroll file:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>The file is transmitted via an encrypted (SSL/TLS) connection.</li>
          <li>The data is loaded into volatile memory (RAM) for validation and calculation.</li>
          <li>Output files (Tax returns, Pay slips) are generated and sent back to your browser.</li>
          <li>The memory is cleared. No copy of the file is written to our disk storage.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Data Retention</h2>
        <p>
          <strong>Payroll History:</strong> We do NOT retain a history of your past payrolls, employee lists, or salary trends. 
          You are responsible for downloading and saving your generated reports.
        </p>
        <p>
          <strong>Account Data:</strong> We retain account and subscription data as long as your account is active. You may request 
          deletion of your account at any time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
        <p>
          We use trusted third-party services for specific functions:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Pesepay:</strong> For payment processing.</li>
          <li><strong>Vercel/AWS:</strong> For hosting infrastructure (encrypted and transient).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at privacy@zim-payconnect.com.
        </p>
      </section>
    </div>
  );
}
