/**
 * Client-readable executive package (HTML). Not code generation.
 */

export function renderExecutiveHtml(engagement) {
  const c = engagement.consulting || {};
  const pkg = c.solution_package || {};
  const exec = c.executive_presentation || pkg.executive_presentation || {};
  const sections = exec.sections || {};
  const conf = c.confidence_dimensions || pkg.confidence || {};
  const recs = (c.gap_analysis?.decision_briefs || []).slice(0, 12);
  const pricing = engagement.commercial?.pricing || pkg.commercial?.pricing || {};
  const llm = c.llm || {};

  const confRows = Object.entries(conf)
    .map(
      ([k, v]) =>
        `<tr><td>${esc(humanize(k))}</td><td>${Math.round(Number(v) * 100)}%</td></tr>`,
    )
    .join('');

  const recRows = recs
    .map((r) => {
      const sources = (r.evidence || r.sources || []).join('; ');
      return `<tr>
        <td><strong>${esc(r.recommendation)}</strong><br/><span class="muted">${esc(r.classification || r.required_or_optional || '')}</span></td>
        <td>${esc(r.reason || r.why || '')}</td>
        <td>${Math.round((r.confidence_pct || (r.confidence || 0) * 100) || 0)}%</td>
        <td class="muted small">${esc(sources)}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(exec.title || `Executive briefing — ${engagement.client_name}`)}</title>
<style>
  body { font-family: system-ui, Segoe UI, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; line-height: 1.5; }
  h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.1rem; margin-top: 1.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.35rem; }
  .muted { color: #64748b; }
  .small { font-size: 0.85rem; }
  .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.75rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.9rem; }
  th, td { text-align: left; vertical-align: top; padding: 0.5rem 0.4rem; border-bottom: 1px solid #e2e8f0; }
  th { color: #64748b; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-top: 0.75rem; }
  footer { margin-top: 2.5rem; font-size: 0.8rem; color: #94a3b8; }
</style>
</head>
<body>
  <p class="badge">Grabber AI Studio · Consulting briefing</p>
  <h1>${esc(exec.title || engagement.client_name)}</h1>
  <p class="muted">${esc(engagement.industry || '')} · ${esc(new Date().toISOString().slice(0, 10))}</p>
  <p>${esc(exec.client_message || 'Prepared by your Grabber consulting team. Manufacturing begins only after approval and deposit.')}</p>

  <h2>Executive summary</h2>
  <div class="box">${esc(sections.executive_summary || engagement.analysis?.executive_summary || '—')}</div>

  <h2>Business problems</h2>
  <ul>${listHtml(sections.business_problems || engagement.analysis?.pain_points)}</ul>

  <h2>Recommended future state</h2>
  <div class="box">${esc(sections.recommended_future_state || c.gap_analysis?.future_state_summary || '—')}</div>

  <h2>Confidence</h2>
  <table><thead><tr><th>Dimension</th><th>Score</th></tr></thead><tbody>${confRows || '<tr><td colspan="2">—</td></tr>'}</tbody></table>

  <h2>Recommendations (explainable)</h2>
  <table>
    <thead><tr><th>Recommendation</th><th>Why</th><th>Conf.</th><th>Evidence sources</th></tr></thead>
    <tbody>${recRows || '<tr><td colspan="4">Run gap analysis for decision briefs</td></tr>'}</tbody>
  </table>
  <p class="muted small">Evidence sources are playbooks, patterns, and interview signals — not fabricated project counts.</p>

  <h2>Investment (indicative)</h2>
  <div class="box">
    Total: <strong>${pricing.total != null ? `$${Number(pricing.total).toLocaleString()}` : '—'}</strong>
    · Deposit: ${pricing.deposit != null ? `$${Number(pricing.deposit).toLocaleString()}` : '—'}
    <br/><span class="muted small">${esc(pricing.payment_terms || '')}</span>
  </div>

  <h2>ROI narrative</h2>
  <div class="box">${esc(c.roi?.narrative || sections.expected_roi?.narrative || '—')}</div>

  <h2>Next steps</h2>
  <ul>${listHtml(sections.next_steps)}</ul>

  <footer>
    LLM path: ${llm.used ? esc(llm.model || 'on') : 'deterministic fallback'} ·
    Grabber consulting package — factory remains internal until governance.
  </footer>
</body>
</html>`;
}

function listHtml(items) {
  if (!items) return '<li class="muted">—</li>';
  if (!Array.isArray(items)) return `<li>${esc(String(items))}</li>`;
  if (!items.length) return '<li class="muted">—</li>';
  return items.map((i) => `<li>${esc(typeof i === 'string' ? i : JSON.stringify(i))}</li>`).join('');
}

function humanize(k) {
  return String(k).replace(/_/g, ' ');
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
