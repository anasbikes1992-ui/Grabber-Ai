import { STOCK, kg, meters } from "@/lib/data";

export default function Stock() {
  return (
    <div>
      <div className="eyebrow">Inventory</div>
      <h1>Stock by lot</h1>
      <p className="sub">
        Roll and meterage tracking per lot, per warehouse. Received weight stays
        linked to measured meters, so valuation and stock checks reconcile.
      </p>

      <div className="card">
        <h2>On hand</h2>
        <table>
          <thead>
            <tr>
              <th>Lot</th><th>Material</th><th>Warehouse</th>
              <th className="num">Rolls</th><th className="num">Meters</th>
              <th className="num">Received</th><th style={{ width: 160 }}>Vs reorder point</th>
            </tr>
          </thead>
          <tbody>
            {STOCK.map((r) => {
              const usesMeters = r.metersOnHand > 0;
              const pct = usesMeters
                ? Math.min(100, Math.round((r.metersOnHand / (r.reorderAt * 2)) * 100))
                : Math.min(100, Math.round((r.kgReceived / (r.reorderAt * 2)) * 100));
              const low = usesMeters ? r.metersOnHand < r.reorderAt : r.kgReceived < r.reorderAt;
              return (
                <tr key={r.lot}>
                  <td><b>{r.lot}</b><br /><span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{r.sku}</span></td>
                  <td>{r.material}<br /><span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{r.color}</span></td>
                  <td>{r.warehouse}</td>
                  <td className="num">{r.rolls || "—"}</td>
                  <td className="num">{usesMeters ? meters(r.metersOnHand) : "—"}</td>
                  <td className="num">{kg(r.kgReceived)}</td>
                  <td>
                    <div className={`bar ${low ? "hot" : ""}`}><span style={{ width: `${pct}%` }} /></div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 4 }}>
                      {low ? "below reorder point" : "healthy"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
