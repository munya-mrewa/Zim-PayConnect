import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 container py-12 md:py-24">
        <div className="mx-auto max-w-3xl prose dark:prose-invert">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
