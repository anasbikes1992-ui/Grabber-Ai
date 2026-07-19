import Link from "next/link";
import { CREDIT, RECEIPTS, SALES_ORDERS, STOCK, money, meters } from "@/lib/data";

export default function Dashboard() {
  const stockMeters = STOCK.reduce((s, r) => s + r.metersOnHand, 0);
  const lowStock = STOCK.filter((r) => r.metersOnHand > 0 && r.metersOnHand < r.reorderAt);
  const openOrders = SALES_ORDERS.filter((o) => o.status !== "invoiced");
  const orderValue = openOrders.reduce((s, o) => s + o.valueUsd, 0);
  const exposure = CREDIT.reduce((s, c) => s + c.exposedUsd, 0);
  const holds = CREDIT.filter((c) => c.status === "hold").length;
  const varianceHolds = RECEIPTS.filter((r) => r.status === "variance hold");

  return (
    <div>
      <div className="eyebrow">Operations overview</div>
      <h1>Good morning, Lanka Textiles</h1>
      <p className="sub">
        Live picture of stock, incoming containers, open orders, and credit —
        the six workflows from your discovery, in one place.
      </p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Fabric on hand</div><div className="kpi-value">{meters(stockMeters)}</div><div className="kpi-hint">across 2 warehouses</div></div>
        <div className="kpi"><div className="kpi-label">Open sales orders</div><div className="kpi-value">{openOrders.length}</div><div className="kpi-hint">{money(orderValue)} pipeline</div></div>
        <div className="kpi"><div className="kpi-label">Credit exposure</div><div className="kpi-value">{money(exposure)}</div><div className="kpi-hint">{holds} account on hold</div></div>
        <div className="kpi"><div className="kpi-label">Low-stock alerts</div><div className="kpi-value">{lowStock.length}</div><div className="kpi-hint">below reorder point</div></div>
      </div>

      <div className="card">
        <h2>Needs your attention</h2>
        <table>
          <tbody>
            {varianceHolds.map((r) => (
              <tr key={r.id}>
                <td><span className="pill warn">variance hold</span></td>
                <td>
                  <b>{r.id}</b> · {r.supplier} — declared {r.declaredKg.toLocaleString()} kg,
                  received {r.receivedKg?.toLocaleString()} kg. Meterage check pending.
                </td>
                <td className="num"><Link href="/receive">Review →</Link></td>
              </tr>
            ))}
            {CREDIT.filter((c) => c.status !== "ok").map((c) => (
              <tr key={c.customer}>
                <td><span className={`pill ${c.status === "hold" ? "bad" : "warn"}`}>{c.status}</span></td>
                <td>
                  <b>{c.customer}</b> — {money(c.exposedUsd)} of {money(c.limitUsd)} limit,
                  oldest invoice {c.oldestInvoiceDays} days.
                </td>
                <td className="num"><Link href="/credit">Review →</Link></td>
              </tr>
            ))}
            {lowStock.map((r) => (
              <tr key={r.lot}>
                <td><span className="pill info">reorder</span></td>
                <td>
                  <b>{r.material}</b> ({r.color}) — {meters(r.metersOnHand)} left, reorder at {meters(r.reorderAt)}.
                </td>
                <td className="num"><Link href="/purchase">Order →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
