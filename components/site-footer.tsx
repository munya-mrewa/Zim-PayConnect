import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-black py-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 md:h-auto md:flex-row md:py-8">
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm leading-loose text-zinc-500 md:text-left">
            © 2026 Zim-PayConnect. All rights reserved.
          </p>
          <p className="text-center text-sm text-zinc-500 md:text-left">
            Contact: <a href="mailto:munya.mrewa@vextraldigital.com" className="hover:text-white transition-colors">munya.mrewa@vextraldigital.com</a>
          </p>
        </div>
        <div className="flex gap-6">
           <Link href="/terms" className="text-sm font-medium text-zinc-500 hover:text-white transition-colors underline-offset-4 hover:underline">Terms</Link>
           <Link href="/privacy" className="text-sm font-medium text-zinc-500 hover:text-white transition-colors underline-offset-4 hover:underline">Privacy</Link>
        </div>
      </div>
      <div className="container border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        <p>
          Disclaimer: This platform is designed to assist with tax compliance calculations. 
          While we strive for accuracy, users are responsible for verifying all outputs against current ZIMRA regulations. 
          The platform does not store personal data and is not a substitute for professional tax advice.
        </p>
      </div>
    </footer>
  );
}
