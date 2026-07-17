import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EnterpriseShell } from "@/components/shell";
import { JarvisVoiceDock } from "@/components/jarvis-voice-dock";
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
  title: "Grabber Enterprise v3.0",
  description:
    "Business OS, Client Portal, Ops, Delivery, Marketing Intelligence — Track B on frozen Grabber Core",
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
        <EnterpriseShell>{children}</EnterpriseShell>
        <JarvisVoiceDock />
      </body>
    </html>
  );
}
