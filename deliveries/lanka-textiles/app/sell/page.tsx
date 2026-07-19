import { SALES_ORDERS, meters, money } from "@/lib/data";

const TONE: Record<string, string> = {
  invoiced: "ok", dispatched: "ok", picking: "info", confirmed: "info", quoted: "warn",
};

export default function Sales() {
  const open = SALES_ORDERS.filter((o) => o.status !== "invoiced");
  const value = open.reduce((s, o) => s + o.valueUsd, 0);

  return (
    <div>
      <div className="eyebrow">Order to cash</div>
      <h1>Sales orders</h1>
      <p className="sub">
        B2B orders from quote to invoice. Credit status is checked at
        confirmation — an account on hold can&apos;t confirm new orders without an
        override.
      </p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Open orders</div><div className="kpi-value">{open.length}</div></div>
        <div className="kpi"><div className="kpi-label">Open value</div><div className="kpi-value">{money(value)}</div></div>
      </div>

      <div className="card">
        <h2>Orders</h2>
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Items</th><th className="num">Meters</th><th className="num">Value</th><th>Due</th><th>Status</th></tr>
          </thead>
          <tbody>
            {SALES_ORDERS.map((o) => (
              <tr key={o.id}>
                <td><b>{o.id}</b></td>
                <td>{o.customer}</td>
                <td>{o.items}</td>
                <td className="num">{o.meters ? meters(o.meters) : "—"}</td>
                <td className="num">{money(o.valueUsd)}</td>
                <td>{o.due}</td>
                <td><span className={`pill ${TONE[o.status]}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
