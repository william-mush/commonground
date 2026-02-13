import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { websiteSchema } from "@/lib/json-ld";
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
  metadataBase: new URL("https://commonground-two.vercel.app"),
  title: {
    default: "CommonGround — Where Democracy Finds Agreement",
    template: "%s | CommonGround",
  },
  description:
    "AI-powered analysis of Congressional speeches, finding genuine common ground between parties through steelmanned positions and democratic principles.",
  openGraph: {
    type: "website",
    siteName: "CommonGround",
    title: "CommonGround — Where Democracy Finds Agreement",
    description:
      "AI-powered analysis of Congressional speeches, finding genuine common ground between parties.",
  },
  twitter: {
    card: "summary",
    title: "CommonGround — Where Democracy Finds Agreement",
    description:
      "AI-powered analysis of Congressional speeches, finding genuine common ground between parties.",
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
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
        <JsonLd data={websiteSchema()} />
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
              <Link href="/archive" className="hover:text-foreground transition-colors">
                Archive
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
