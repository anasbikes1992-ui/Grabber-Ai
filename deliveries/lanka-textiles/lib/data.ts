/**
 * Preview dataset for the Lanka Textiles operations platform.
 * Realistic wholesale-textile records (rolls, meterage, credit terms) so the
 * client can evaluate the workflows. Replaced by live data at go-live.
 */

export type Roll = {
  lot: string;
  sku: string;
  material: string;
  color: string;
  warehouse: "Colombo A" | "Colombo B";
  rolls: number;
  metersOnHand: number;
  kgReceived: number;
  reorderAt: number;
};

export const STOCK: Roll[] = [
  { lot: "LOT-2417", sku: "YRN-CT-30s", material: "Cotton yarn 30s", color: "Ecru", warehouse: "Colombo A", rolls: 140, metersOnHand: 0, kgReceived: 3200, reorderAt: 1200 },
  { lot: "LOT-2418", sku: "FAB-PL-150", material: "Polyester fabric 150gsm", color: "White", warehouse: "Colombo A", rolls: 86, metersOnHand: 10320, kgReceived: 1890, reorderAt: 4000 },
  { lot: "LOT-2421", sku: "FAB-CT-180", material: "Cotton twill 180gsm", color: "Navy", warehouse: "Colombo B", rolls: 54, metersOnHand: 6480, kgReceived: 1420, reorderAt: 3000 },
  { lot: "LOT-2423", sku: "FAB-VS-120", material: "Viscose 120gsm", color: "Black", warehouse: "Colombo A", rolls: 32, metersOnHand: 3840, kgReceived: 610, reorderAt: 4500 },
  { lot: "LOT-2426", sku: "DYE-RX-05", material: "Reactive dye RX-5", color: "Crimson", warehouse: "Colombo B", rolls: 0, metersOnHand: 0, kgReceived: 480, reorderAt: 150 },
  { lot: "LOT-2427", sku: "FAB-LN-140", material: "Linen blend 140gsm", color: "Natural", warehouse: "Colombo B", rolls: 41, metersOnHand: 4920, kgReceived: 980, reorderAt: 2500 },
];

export type Receipt = {
  id: string;
  supplier: string;
  origin: string;
  container: string;
  eta: string;
  declaredKg: number;
  receivedKg: number | null;
  measuredMeters: number | null;
  status: "in transit" | "at port" | "receiving" | "received" | "variance hold";
};

export const RECEIPTS: Receipt[] = [
  { id: "GRN-1042", supplier: "Bharat Textile Mills", origin: "Mumbai, IN", container: "MSKU-482119-0", eta: "2026-07-14", declaredKg: 2400, receivedKg: 2388, measuredMeters: 28450, status: "received" },
  { id: "GRN-1043", supplier: "Ningbo Fabric Co", origin: "Ningbo, CN", container: "TGHU-771204-3", eta: "2026-07-18", declaredKg: 1850, receivedKg: 1811, measuredMeters: 21260, status: "variance hold" },
  { id: "GRN-1044", supplier: "Bharat Textile Mills", origin: "Mumbai, IN", container: "MSKU-490332-8", eta: "2026-07-24", declaredKg: 3100, receivedKg: null, measuredMeters: null, status: "at port" },
  { id: "GRN-1045", supplier: "Gujarat Yarn Exports", origin: "Ahmedabad, IN", container: "CMAU-118845-1", eta: "2026-08-02", declaredKg: 2750, receivedKg: null, measuredMeters: null, status: "in transit" },
];

export type PurchaseOrder = {
  id: string;
  supplier: string;
  items: string;
  valueUsd: number;
  placed: string;
  expected: string;
  status: "draft" | "sent" | "confirmed" | "shipped" | "closed";
};

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-2088", supplier: "Bharat Textile Mills", items: "Cotton twill 180gsm × 3,000m", valueUsd: 18400, placed: "2026-07-01", expected: "2026-07-24", status: "shipped" },
  { id: "PO-2089", supplier: "Ningbo Fabric Co", items: "Polyester 150gsm × 12,000m", valueUsd: 22100, placed: "2026-07-03", expected: "2026-07-18", status: "shipped" },
  { id: "PO-2090", supplier: "Gujarat Yarn Exports", items: "Cotton yarn 30s × 2,750kg", valueUsd: 9600, placed: "2026-07-10", expected: "2026-08-02", status: "confirmed" },
  { id: "PO-2091", supplier: "Colombo Dye House", items: "Reactive dyes assorted × 300kg", valueUsd: 4150, placed: "2026-07-16", expected: "2026-07-29", status: "sent" },
];

export type SalesOrder = {
  id: string;
  customer: string;
  items: string;
  meters: number;
  valueUsd: number;
  due: string;
  status: "quoted" | "confirmed" | "picking" | "dispatched" | "invoiced";
};

export const SALES_ORDERS: SalesOrder[] = [
  { id: "SO-5121", customer: "Ceylon Garments Ltd", items: "Polyester 150gsm, White", meters: 4200, valueUsd: 9660, due: "2026-07-21", status: "picking" },
  { id: "SO-5122", customer: "Kandy Apparel Co", items: "Cotton twill 180gsm, Navy", meters: 2600, valueUsd: 7540, due: "2026-07-23", status: "confirmed" },
  { id: "SO-5123", customer: "Negombo Fashionwear", items: "Viscose 120gsm, Black", meters: 1800, valueUsd: 4950, due: "2026-07-25", status: "quoted" },
  { id: "SO-5124", customer: "Galle Export House", items: "Linen blend 140gsm, Natural", meters: 3100, valueUsd: 10230, due: "2026-07-28", status: "confirmed" },
  { id: "SO-5120", customer: "Ceylon Garments Ltd", items: "Cotton yarn 30s", meters: 0, valueUsd: 6200, due: "2026-07-15", status: "invoiced" },
];

export type CreditAccount = {
  customer: string;
  limitUsd: number;
  exposedUsd: number;
  terms: string;
  oldestInvoiceDays: number;
  status: "ok" | "watch" | "hold";
};

export const CREDIT: CreditAccount[] = [
  { customer: "Ceylon Garments Ltd", limitUsd: 30000, exposedUsd: 21400, terms: "45 days", oldestInvoiceDays: 38, status: "watch" },
  { customer: "Kandy Apparel Co", limitUsd: 20000, exposedUsd: 7540, terms: "30 days", oldestInvoiceDays: 12, status: "ok" },
  { customer: "Negombo Fashionwear", limitUsd: 10000, exposedUsd: 9950, terms: "30 days", oldestInvoiceDays: 41, status: "hold" },
  { customer: "Galle Export House", limitUsd: 25000, exposedUsd: 10230, terms: "60 days", oldestInvoiceDays: 9, status: "ok" },
  { customer: "Matara Uniforms", limitUsd: 8000, exposedUsd: 0, terms: "30 days", oldestInvoiceDays: 0, status: "ok" },
];

export const money = (n: number) => `$${n.toLocaleString()}`;
export const meters = (n: number) => `${n.toLocaleString()} m`;
export const kg = (n: number) => `${n.toLocaleString()} kg`;
