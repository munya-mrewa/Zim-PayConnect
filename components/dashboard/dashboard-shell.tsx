"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  Settings, 
  LogOut,
  User,
  Menu,
  X,
  Calculator,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export type SubscriptionStatus = {
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED';
  daysLeft?: number;
  message?: string;
};

interface DashboardShellProps {
  children: React.ReactNode;
  subscriptionStatus: SubscriptionStatus;
}

export function DashboardShell({
  children,
  subscriptionStatus
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (subscriptionStatus.status === 'EXPIRED' && pathname !== '/upgrade') {
      router.push('/upgrade');
    }
  }, [subscriptionStatus, pathname, router]);

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/upload", label: "Upload Payroll", icon: Upload },
    { href: "/calculator", label: "Tax Calculator", icon: Calculator },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen bg-muted/40 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-6">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span>Zim-PayConnect</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    isActive 
                      ? "bg-muted text-primary" 
                      : "text-muted-foreground"
                  )}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Subscription Status Indicator in Sidebar */}
        <div className="px-4 py-2">
            {subscriptionStatus.status === 'TRIAL' && (
                <div className={cn(
                    "rounded-md p-3 text-xs border",
                    (subscriptionStatus.daysLeft ?? 0) <= 1 ? "bg-red-50 text-red-900 border-red-200" : "bg-blue-50 text-blue-900 border-blue-200"
                )}>
                    <div className="font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Trial Active
                    </div>
                    <div className="mt-1">
                        {subscriptionStatus.daysLeft} day(s) remaining.
                    </div>
                    <Link href="/upgrade" className="mt-2 block underline">Upgrade Plan</Link>
                </div>
            )}
             {subscriptionStatus.status === 'EXPIRED' && (
                <div className="rounded-md p-3 text-xs bg-red-50 text-red-900 border border-red-200">
                    <div className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Trial Expired
                    </div>
                    <div className="mt-1">
                        Please subscribe to continue processing.
                    </div>
                    <Link href="/upgrade" className="mt-2 block underline font-bold">Subscribe Now</Link>
                </div>
            )}
        </div>

        <div className="mt-auto p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
             <LogOut className="h-4 w-4" />
             Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-lg transform transition-transform duration-200 ease-in-out md:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center justify-between border-b px-6">
          <Link className="font-semibold" href="/" onClick={() => setIsSidebarOpen(false)}>
            Zim-PayConnect
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    isActive 
                      ? "bg-muted text-primary" 
                      : "text-muted-foreground"
                  )}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Mobile Subscription Status */}
        <div className="px-4 py-2">
             {subscriptionStatus.status === 'TRIAL' && (
                <div className="rounded-md p-3 text-xs bg-blue-50 text-blue-900 border border-blue-200">
                    <span className="font-semibold">Trial Active:</span> {subscriptionStatus.daysLeft} days left.
                    <Link href="/upgrade" className="block mt-1 underline">Upgrade</Link>
                </div>
            )}
             {subscriptionStatus.status === 'EXPIRED' && (
                <div className="rounded-md p-3 text-xs bg-red-50 text-red-900 border border-red-200">
                    <span className="font-semibold">Trial Expired.</span>
                    <Link href="/upgrade" className="block mt-1 underline">Subscribe</Link>
                </div>
            )}
        </div>

        <div className="mt-auto p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
             <LogOut className="h-4 w-4" />
             Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6 dark:bg-gray-800/50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden -ml-2"
            onClick={() => setIsSidebarOpen(true)}
          >
             <Menu className="h-5 w-5" />
             <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="w-full flex-1">
             {/* Alert Banner in Header if Critical */}
             {subscriptionStatus.status === 'EXPIRED' && (
                 <div className="hidden md:flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Your trial has expired. Features are limited.</span>
                    <Link href="/upgrade" className="font-semibold underline hover:text-red-800">Subscribe Now</Link>
                 </div>
             )}
              {subscriptionStatus.status === 'TRIAL' && (subscriptionStatus.daysLeft ?? 10) <= 1 && (
                 <div className="hidden md:flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                    <Clock className="h-4 w-4" />
                    <span>Trial ends soon ({subscriptionStatus.daysLeft} day left).</span>
                    <Link href="/upgrade" className="font-semibold underline hover:text-orange-800">Upgrade</Link>
                 </div>
             )}
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
             </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
