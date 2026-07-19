import { RECEIPTS, kg } from "@/lib/data";

const TONE: Record<string, string> = {
  received: "ok",
  "variance hold": "warn",
  receiving: "info",
  "at port": "info",
  "in transit": "",
};

export default function Receiving() {
  return (
    <div>
      <div className="eyebrow">Goods in</div>
      <h1>Receiving</h1>
      <p className="sub">
        Containers are weighed on receipt and measured in meters before stock is
        sellable — declared vs received variance is tracked on every GRN, so
        meterage mismatches are caught at the door, not at the sale.
      </p>

      <div className="card">
        <h2>Inbound containers</h2>
        <table>
          <thead>
            <tr>
              <th>GRN</th><th>Supplier</th><th>Container</th><th>ETA</th>
              <th className="num">Declared</th><th className="num">Received</th>
              <th className="num">Measured</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {RECEIPTS.map((r) => {
              const variance =
                r.receivedKg != null ? r.receivedKg - r.declaredKg : null;
              return (
                <tr key={r.id}>
                  <td><b>{r.id}</b></td>
                  <td>{r.supplier}<br /><span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{r.origin}</span></td>
                  <td>{r.container}</td>
                  <td>{r.eta}</td>
                  <td className="num">{kg(r.declaredKg)}</td>
                  <td className="num">
                    {r.receivedKg != null ? kg(r.receivedKg) : "—"}
                    {variance != null && variance !== 0 ? (
                      <div style={{ color: variance < 0 ? "var(--warn)" : "var(--success)", fontSize: "0.72rem" }}>
                        {variance > 0 ? "+" : ""}{variance} kg
                      </div>
                    ) : null}
                  </td>
                  <td className="num">{r.measuredMeters != null ? `${r.measuredMeters.toLocaleString()} m` : "—"}</td>
                  <td><span className={`pill ${TONE[r.status]}`}>{r.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
