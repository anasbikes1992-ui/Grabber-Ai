import { CREDIT, money } from "@/lib/data";

const TONE: Record<string, string> = { ok: "ok", watch: "warn", hold: "bad" };

export default function Credit() {
  const exposure = CREDIT.reduce((s, c) => s + c.exposedUsd, 0);
  const overdue = CREDIT.filter((c) => c.oldestInvoiceDays > 30).length;

  return (
    <div>
      <div className="eyebrow">Cash protection</div>
      <h1>Customer credit</h1>
      <p className="sub">
        Limits enforced automatically: exposure vs limit per customer, oldest
        invoice ageing, and holds that block new confirmations until cleared.
      </p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Total exposure</div><div className="kpi-value">{money(exposure)}</div></div>
        <div className="kpi"><div className="kpi-label">Aged &gt; 30 days</div><div className="kpi-value">{overdue}</div><div className="kpi-hint">accounts</div></div>
        <div className="kpi"><div className="kpi-label">On hold</div><div className="kpi-value">{CREDIT.filter((c) => c.status === "hold").length}</div></div>
      </div>

      <div className="card">
        <h2>Accounts</h2>
        <table>
          <thead>
            <tr><th>Customer</th><th>Terms</th><th className="num">Limit</th><th className="num">Exposure</th><th style={{ width: 150 }}>Utilisation</th><th className="num">Oldest inv.</th><th>Status</th></tr>
          </thead>
          <tbody>
            {CREDIT.map((c) => {
              const pct = Math.min(100, Math.round((c.exposedUsd / c.limitUsd) * 100));
              return (
                <tr key={c.customer}>
                  <td><b>{c.customer}</b></td>
                  <td>{c.terms}</td>
                  <td className="num">{money(c.limitUsd)}</td>
                  <td className="num">{money(c.exposedUsd)}</td>
                  <td>
                    <div className={`bar ${pct >= 85 ? "hot" : ""}`}><span style={{ width: `${pct}%` }} /></div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 4 }}>{pct}%</div>
                  </td>
                  <td className="num">{c.oldestInvoiceDays ? `${c.oldestInvoiceDays} d` : "—"}</td>
                  <td><span className={`pill ${TONE[c.status]}`}>{c.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
