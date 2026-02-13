import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommonGround — Where Democracy Finds Agreement",
  description:
    "AI-powered analysis of Congressional speeches, finding genuine common ground between parties through steelmanned positions and democratic principles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b border-card-border bg-card">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                Common<span className="text-purple-accent">Ground</span>
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/" className="hover:text-foreground transition-colors">
                Today
              </Link>
              <Link href="/proof" className="hover:text-foreground transition-colors">
                Proof It Works
              </Link>
              <Link
                href="/about"
                className="hover:text-foreground transition-colors"
              >
                How It Works
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
