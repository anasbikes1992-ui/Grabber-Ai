import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lanka Textiles — Operations Platform",
  description:
    "Wholesale textile operations: receiving, stock, purchasing, sales, credit, and reporting. Built by Grabber Studio.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/receive", label: "Receiving" },
  { href: "/stock", label: "Stock" },
  { href: "/purchase", label: "Purchasing" },
  { href: "/sell", label: "Sales" },
  { href: "/credit", label: "Credit" },
  { href: "/report", label: "Reports" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-mark">LT</span>
              <div>
                <b>Lanka Textiles</b>
                <span>Operations platform</span>
              </div>
            </div>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="nav-link">
                {n.label}
              </Link>
            ))}
            <div className="preview-tag">
              Preview build · demo data
              <br />
              Delivered by Grabber Studio
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
