import { CREDIT, PURCHASE_ORDERS, RECEIPTS, SALES_ORDERS, STOCK, money, meters } from "@/lib/data";

export default function Reports() {
  const stockMeters = STOCK.reduce((s, r) => s + r.metersOnHand, 0);
  const salesValue = SALES_ORDERS.reduce((s, o) => s + o.valueUsd, 0);
  const poValue = PURCHASE_ORDERS.reduce((s, p) => s + p.valueUsd, 0);
  const exposure = CREDIT.reduce((s, c) => s + c.exposedUsd, 0);
  const received = RECEIPTS.filter((r) => r.status === "received").length;

  const rows = [
    ["Fabric on hand", meters(stockMeters), "across all lots and warehouses"],
    ["Sales pipeline (month)", money(salesValue), `${SALES_ORDERS.length} orders`],
    ["Purchase commitments", money(poValue), `${PURCHASE_ORDERS.length} purchase orders`],
    ["Credit exposure", money(exposure), `${CREDIT.length} active accounts`],
    ["Containers received (month)", String(received), `${RECEIPTS.length - received} inbound`],
    ["Stock accuracy target", "97%", "with barcode receiving + lot tracking"],
  ] as const;

  return (
    <div>
      <div className="eyebrow">Insight</div>
      <h1>Reports</h1>
      <p className="sub">
        The numbers that run the business, always current — the manual
        month-end spreadsheet becomes a live view.
      </p>

      <div className="card">
        <h2>This month at a glance</h2>
        <table>
          <tbody>
            {rows.map(([label, value, hint]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="num"><b>{value}</b></td>
                <td style={{ color: "var(--muted)" }}>{hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Coming at go-live</h2>
        <table>
          <tbody>
            <tr><td>Aged debtors report</td><td style={{ color: "var(--muted)" }}>exportable, per customer, with dunning status</td></tr>
            <tr><td>Stock valuation (landed cost)</td><td style={{ color: "var(--muted)" }}>freight + duty included per lot</td></tr>
            <tr><td>Supplier scorecards</td><td style={{ color: "var(--muted)" }}>variance, lead time, and quality by supplier</td></tr>
            <tr><td>Reorder suggestions</td><td style={{ color: "var(--muted)" }}>from live consumption, not gut feel</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
