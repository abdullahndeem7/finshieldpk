import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinshieldPK | AI-Powered Fraud Detection Agent",
  description: "AI-powered fraud detection dashboard for Pakistani banks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-slate-50 text-slate-900 flex flex-col">
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="font-semibold tracking-wide text-slate-900">
              FinShield PK
            </Link>
            <nav className="flex items-center gap-3 text-sm text-slate-600">
              <Link href="/dashboard" className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">
                Dashboard
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Logout
                </button>
              </form>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 text-xs text-slate-500 sm:px-6">
            Fraud detection demo for Pakistani banking workflows.
          </div>
        </footer>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}