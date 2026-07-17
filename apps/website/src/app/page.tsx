import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Factory,
  Layers,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

const INDUSTRIES = [
  "Hospitality",
  "Wholesale & textile",
  "Retail",
  "Healthcare",
  "Education",
  "Logistics",
  "Construction",
  "Professional services",
];

const STEPS = [
  {
    title: "Describe your business",
    body: "Not software requirements — your operations, pains, and goals.",
  },
  {
    title: "Jarvis consults",
    body: "Interview, industry patterns, gap analysis, multi-specialist review.",
  },
  {
    title: "Blueprint & commercial",
    body: "Analysis, proposal, SOW draft, clear essential vs optional scope.",
  },
  {
    title: "Approve & deposit",
    body: "Governance gates protect both sides before any factory build.",
  },
  {
    title: "Deterministic factory",
    body: "Approved Project DNA → modules → validated production app.",
  },
  {
    title: "Portal & support",
    body: "Delivery tracking, documents, tickets, maintenance renewals.",
  },
];

const PORTFOLIO = [
  { name: "Hotel booking platform", tag: "Hospitality", note: "Booking golden path" },
  { name: "B2B wholesale ERP blueprint", tag: "Wholesale", note: "Consulting-led package" },
  { name: "CRM & marketplace refs", tag: "SaaS", note: "Factory blueprints" },
];

const FAQS = [
  {
    q: "Do I need to write technical requirements?",
    a: "No. Describe your business. Jarvis interviews you and produces a reviewable blueprint before software is generated.",
  },
  {
    q: "Is this just AI writing code?",
    a: "No. Competitive edge is the full loop: discovery → commercial intelligence → governance → deterministic factory → support → learning.",
  },
  {
    q: "When does building start?",
    a: "Only after dual approval and deposit. Incomplete requests never skip to the factory.",
  },
  {
    q: "Do you copy other ERP systems?",
    a: "We learn industry patterns and best practices. We never copy proprietary code, pixel UIs, or confidential material.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="section pt-16 md:pt-24">
        <div className="container-x">
          <div className="badge mb-5">
            <Sparkles className="h-3 w-3 text-sky-300" />
            Launch Phase 1 · Customer acquisition
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.05]">
            Turn a business problem into{" "}
            <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">
              production software
            </span>
            — without writing a requirements document.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            Grabber is an <strong className="text-white">AI consulting firm</strong>{" "}
            that engineers better businesses—not a code chatbot. You describe the
            business. Our consulting team delivers the blueprint, commercial path,
            and governed implementation. You never see prompts or internal tooling.
          </p>
          <p className="mt-3 text-sm text-sky-200/90">
            We don&apos;t just build software. We engineer better businesses.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="btn btn-primary">
              Book consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/consult" className="btn btn-ghost">
              Start discovery now
            </Link>
            <Link href="/journey" className="btn btn-ghost">
              See the full journey
            </Link>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Workflow, t: "Business first", d: "Discovery before code" },
              { icon: ShieldCheck, t: "Governed", d: "Approval + deposit gates" },
              { icon: Factory, t: "Deterministic factory", d: "Modules · blueprints · DNA" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="card flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-[var(--muted)]">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies / industries */}
      <section id="industries" className="section border-t border-[var(--border)]">
        <div className="container-x">
          <p className="badge mb-3">Industries we build for</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Companies we modernize
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Industry knowledge packs and playbooks guide discovery — not generic
            one-size-fits-all prompts.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {INDUSTRIES.map((name) => (
              <div key={name} className="card flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-violet-300" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Consultation highlight */}
      <section id="consult-cta" className="section border-t border-[var(--border)]">
        <div className="container-x">
          <div className="card overflow-hidden p-0 md:grid md:grid-cols-2">
            <div className="p-8 md:p-10">
              <p className="badge mb-3">AI consultation</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Talk to Jarvis about your business
              </h2>
              <p className="mt-3 text-[var(--muted)]">
                No prompt engineering. No “build me an ERP.” Jarvis interviews you
                like a senior consultant, challenges assumptions, and produces a
                blueprint with essential vs optional scope before any factory run.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "Business discovery until confidence is high",
                  "Industry patterns & competitor benchmarks (legal patterns only)",
                  "Gap analysis with business justification",
                  "Proposal path — factory only after approval",
                ].map((x) => (
                  <li key={x} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                <Link href="/book" className="btn btn-primary">
                  Book consultation
                </Link>
                <Link href="/consult" className="btn btn-ghost">
                  Start free discovery
                </Link>
              </div>
            </div>
            <div className="border-t border-[var(--border)] bg-black/20 p-8 md:border-l md:border-t-0 md:p-10">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                Example opening
              </p>
              <blockquote className="mt-3 text-sm leading-relaxed text-zinc-300">
                “I own a textile raw material wholesale business in Sri Lanka. I
                want to modernize my operations. Help me design the right system —
                interview me thoroughly, challenge my assumptions, and produce a
                complete business blueprint before software is designed.”
              </blockquote>
              <p className="mt-6 text-xs text-[var(--muted)]">
                That is enough to start. Jarvis takes over.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section border-t border-[var(--border)]">
        <div className="container-x">
          <p className="badge mb-3">How it works</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Full company path — not a chat toy
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card">
                <p className="text-xs font-mono text-sky-300">0{i + 1}</p>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="section border-t border-[var(--border)]">
        <div className="container-x">
          <p className="badge mb-3">Portfolio</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Patterns we deliver from
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Factory blueprints and consulting packs compound. Case studies deepen
            as OR/CR real projects complete.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {PORTFOLIO.map((p) => (
              <div key={p.name} className="card">
                <p className="text-xs text-violet-300">{p.tag}</p>
                <h3 className="mt-2 font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section border-t border-[var(--border)]">
        <div className="container-x">
          <p className="badge mb-3">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Clear commercial path
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Exact quotes come from the consulting package after discovery — not a
            one-size price before we understand your business.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="card">
              <Layers className="h-5 w-5 text-sky-300" />
              <h3 className="mt-3 font-semibold">Discovery</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Interview, analysis, recommendations. Start free on the website.
              </p>
              <p className="mt-4 text-2xl font-semibold">Start free</p>
            </div>
            <div className="card ring-1 ring-sky-400/30">
              <ShieldCheck className="h-5 w-5 text-violet-300" />
              <h3 className="mt-3 font-semibold">Delivery project</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Fixed commercial package after blueprint: deposit, milestones, SOW.
              </p>
              <p className="mt-4 text-2xl font-semibold">Quoted after blueprint</p>
            </div>
            <div className="card">
              <Factory className="h-5 w-5 text-emerald-300" />
              <h3 className="mt-3 font-semibold">Maintenance</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Monitoring, support, renewals via client portal after go-live.
              </p>
              <p className="mt-4 text-2xl font-semibold">Annual plans</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/book" className="btn btn-primary">
              Book a call
            </Link>
            <Link href="/consult" className="btn btn-ghost">
              Get a blueprint path
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section border-t border-[var(--border)]">
        <div className="container-x">
          <p className="badge mb-3">FAQ</p>
          <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Book */}
      <section className="section border-t border-[var(--border)] pb-24">
        <div className="container-x text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ready to modernize operations?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
            Book a consultation by starting with your business story. Jarvis handles
            the interview.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/book" className="btn btn-primary">
              Book consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/consult" className="btn btn-ghost">
              Open Jarvis discovery
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
