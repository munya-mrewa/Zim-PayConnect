import { CalculatorForm } from "./calculator-form";

export default function CalculatorPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="space-y-2">
         <h2 className="text-3xl font-bold tracking-tight">"What-If" Calculator</h2>
         <p className="text-muted-foreground">
            Simulate salary changes and tax implications instantly.
         </p>
      </div>

      <CalculatorForm />
    </div>
  );
}
