import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

/*
 * Three faces, three jobs.
 *
 * Fraunces carries the plate titles: it has real ink traps and a slight wobble,
 * which reads as a printed catalogue rather than a web dashboard. Geist Sans is
 * the quiet counterweight for prose. Geist Mono is reserved for measured data —
 * dates, plate numbers, media type — which is where an archive's texture lives.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apogee — a plate archive of the cosmos",
  description:
    "Travel to any date since 16 June 1995 and see the photograph NASA published of the universe that day.",
  openGraph: {
    title: "Apogee — a plate archive of the cosmos",
    description:
      "Travel to any date since 16 June 1995 and see the photograph NASA published of the universe that day.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
