import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JarvisVoiceDock } from "@/components/ui/jarvis-voice-dock";
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
  title: "Jarvis OS · Grabber AI Studio",
  description:
    "Jarvis OS — intelligence and experience layer for the Grabber AI Software Factory. Core stays frozen.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <JarvisVoiceDock />
      </body>
    </html>
  );
}
