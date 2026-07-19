import { PURCHASE_ORDERS, money } from "@/lib/data";

const TONE: Record<string, string> = {
  closed: "ok", shipped: "info", confirmed: "info", sent: "warn", draft: "",
};

export default function Purchasing() {
  const open = PURCHASE_ORDERS.filter((p) => p.status !== "closed");
  const value = open.reduce((s, p) => s + p.valueUsd, 0);

  return (
    <div>
      <div className="eyebrow">Procurement</div>
      <h1>Purchasing</h1>
      <p className="sub">
        Purchase orders to import and local suppliers, tracked from draft to
        received — with expected dates feeding the receiving schedule.
      </p>

      <div className="kpis">
        <div className="kpi"><div className="kpi-label">Open POs</div><div className="kpi-value">{open.length}</div></div>
        <div className="kpi"><div className="kpi-label">Committed value</div><div className="kpi-value">{money(value)}</div></div>
      </div>

      <div className="card">
        <h2>Purchase orders</h2>
        <table>
          <thead>
            <tr><th>PO</th><th>Supplier</th><th>Items</th><th className="num">Value</th><th>Placed</th><th>Expected</th><th>Status</th></tr>
          </thead>
          <tbody>
            {PURCHASE_ORDERS.map((p) => (
              <tr key={p.id}>
                <td><b>{p.id}</b></td>
                <td>{p.supplier}</td>
                <td>{p.items}</td>
                <td className="num">{money(p.valueUsd)}</td>
                <td>{p.placed}</td>
                <td>{p.expected}</td>
                <td><span className={`pill ${TONE[p.status]}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
