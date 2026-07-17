import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { n: "01", title: "Landing", href: "/", desc: "Understand Grabber as a consulting company" },
  { n: "02", title: "Book consultation", href: "/book", desc: "Leave contact + preferred time" },
  { n: "03", title: "Jarvis discovery", href: "/consult", desc: "Describe business · interview · confidence" },
  { n: "04", title: "Analysis & recommendations", href: "/consult", desc: "Gaps, essential vs optional, evidence" },
  { n: "05", title: "Proposal", href: "/consult", desc: "Commercial package · executive briefing" },
  { n: "06", title: "Approve + deposit", href: "http://127.0.0.1:3002/governance", desc: "Governance gates" },
  { n: "07", title: "Factory (internal)", href: "http://127.0.0.1:3000", desc: "DNA → build after approval" },
  { n: "08", title: "Dashboard / portal", href: "http://127.0.0.1:3002/portal", desc: "Status, docs, support" },
];

export default function JourneyPage() {
  return (
    <div className="section pt-12 pb-24">
      <div className="container-x max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Your path with Grabber</h1>
        <p className="mt-3 text-[var(--muted)]">
          Stage 1 product path. Architecture is frozen—this is the journey we make
          usable first.
        </p>
        <ol className="mt-10 space-y-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Link
                href={s.href}
                className="card flex items-start gap-4 transition hover:border-sky-500/30"
              >
                <span className="font-mono text-sm text-sky-300">{s.n}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-[var(--muted)]">{s.desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)]" />
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/book" className="btn btn-primary">
            Book consultation
          </Link>
          <Link href="/consult" className="btn btn-ghost">
            Start discovery
          </Link>
        </div>
      </div>
    </div>
  );
}
