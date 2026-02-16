import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link href="/" className="text-sm font-semibold text-primary hover:text-primary/90 flex items-center gap-2">
           ← Back to Home
        </Link>
      </div>
      <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Link href="/" className="flex items-center space-x-2 font-bold text-2xl">
            <span>Zim-PayConnect</span>
          </Link>
          <p className="text-sm text-muted-foreground">
             Secure Ephemeral Payroll Processing
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
