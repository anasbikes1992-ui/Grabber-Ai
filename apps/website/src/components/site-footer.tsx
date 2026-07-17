import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-12">
      <div className="container-x grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-semibold">Grabber AI Studio</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Business discovery → governed factory → production software.
          </p>
        </div>
        <div className="text-sm text-[var(--muted)]">
          <p className="mb-2 font-medium text-white">Product</p>
          <ul className="space-y-1">
            <li>
              <Link href="/consult">AI Consultant</Link>
            </li>
            <li>
              <Link href="/#how">How it works</Link>
            </li>
            <li>
              <Link href="/#pricing">Pricing</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-[var(--muted)]">
          <p className="mb-2 font-medium text-white">Company</p>
          <p>Launch Phase 1 — customer acquisition</p>
          <p className="mt-2">Core frozen · Factory mature · Experience shipping</p>
        </div>
      </div>
      <div className="container-x mt-10 text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} Grabber AI Studio. Patterns & best practices —
        never proprietary copies.
      </div>
    </footer>
  );
}
