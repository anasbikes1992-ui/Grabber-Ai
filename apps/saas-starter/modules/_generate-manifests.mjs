/**
 * One-shot generator for Sprint 5 module manifests.
 * Run: node modules/_generate-manifests.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, object>} */
const MODULES = {
  authentication: {
    version: "1.0.0",
    title: "Authentication",
    requires: [],
    optional: ["notifications"],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking", "ecommerce"],
    entities: ["users", "sessions"],
    endpoints: ["POST /auth/signup", "POST /auth/login", "POST /auth/logout"],
    ui: ["LoginForm", "SignupForm"],
    permissions: ["auth.self"],
  },
  rbac: {
    version: "1.0.0",
    title: "RBAC",
    requires: ["authentication"],
    optional: ["audit"],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking"],
    entities: ["roles", "permissions"],
    endpoints: ["GET /rbac/roles", "PUT /rbac/assignments"],
    ui: ["RoleMatrix"],
    permissions: ["rbac.manage"],
  },
  teams: {
    version: "1.0.0",
    title: "Teams",
    requires: ["authentication", "rbac"],
    optional: ["notifications"],
    conflicts: [],
    supports: ["saas", "crm", "booking"],
    entities: ["teams", "team_members"],
    endpoints: ["GET /teams", "POST /teams", "POST /teams/:id/invite"],
    ui: ["TeamList", "InviteMember"],
    permissions: ["teams.read", "teams.invite"],
  },
  billing: {
    version: "1.2.0",
    title: "Billing",
    requires: ["authentication"],
    optional: ["notifications", "analytics"],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking"],
    entities: ["plans", "subscriptions"],
    endpoints: ["GET /billing/plans", "POST /billing/checkout"],
    ui: ["PlanPicker", "BillingPortal"],
    permissions: ["billing.manage"],
  },
  payments: {
    version: "1.1.0",
    title: "Payments",
    requires: ["authentication"],
    optional: ["notifications", "billing"],
    conflicts: [],
    supports: ["saas", "marketplace", "booking", "ecommerce"],
    entities: ["payments", "payment_methods"],
    endpoints: ["POST /payments/intent", "POST /webhooks/stripe"],
    ui: ["CheckoutButton"],
    permissions: ["payments.create"],
  },
  notifications: {
    version: "1.0.0",
    title: "Notifications",
    requires: ["authentication"],
    optional: [],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking"],
    entities: ["notifications", "notification_prefs"],
    endpoints: ["GET /notifications", "POST /notifications/send"],
    ui: ["NotificationBell"],
    permissions: ["notifications.read"],
  },
  inventory: {
    version: "1.1.0",
    title: "Inventory",
    requires: ["authentication", "rbac"],
    optional: ["products", "analytics"],
    conflicts: [],
    supports: ["marketplace", "ecommerce", "inventory"],
    entities: ["stock_items", "stock_movements"],
    endpoints: ["GET /inventory", "POST /inventory/adjust"],
    ui: ["InventoryTable"],
    permissions: ["inventory.manage"],
  },
  products: {
    version: "1.0.0",
    title: "Products",
    requires: ["authentication"],
    optional: ["inventory", "search", "files"],
    conflicts: [],
    supports: ["marketplace", "ecommerce", "saas"],
    entities: ["products", "categories"],
    endpoints: ["GET /products", "POST /products"],
    ui: ["ProductGrid", "ProductForm"],
    permissions: ["products.read", "products.write"],
  },
  orders: {
    version: "1.0.0",
    title: "Orders",
    requires: ["authentication", "products", "payments"],
    optional: ["notifications", "inventory"],
    conflicts: [],
    supports: ["marketplace", "ecommerce"],
    entities: ["orders", "order_items"],
    endpoints: ["GET /orders", "POST /orders"],
    ui: ["OrderList", "OrderDetail"],
    permissions: ["orders.read", "orders.create"],
  },
  booking: {
    version: "0.9.0",
    title: "Booking",
    requires: ["authentication", "calendar"],
    optional: ["payments", "notifications", "reviews", "search"],
    conflicts: [],
    supports: ["booking", "saas"],
    entities: ["bookings", "resources"],
    endpoints: ["GET /bookings", "POST /bookings", "POST /bookings/:id/cancel"],
    ui: ["BookingCalendar", "BookingForm"],
    permissions: ["bookings.read", "bookings.create"],
  },
  calendar: {
    version: "1.0.0",
    title: "Calendar",
    requires: ["authentication"],
    optional: ["booking", "notifications"],
    conflicts: [],
    supports: ["booking", "saas", "crm"],
    entities: ["events", "availability_slots"],
    endpoints: ["GET /calendar", "PUT /calendar/availability"],
    ui: ["WeekView", "AvailabilityEditor"],
    permissions: ["calendar.manage"],
  },
  customers: {
    version: "1.0.0",
    title: "Customers",
    requires: ["authentication"],
    optional: ["crm", "notifications"],
    conflicts: [],
    supports: ["crm", "saas", "booking", "marketplace"],
    entities: ["customers"],
    endpoints: ["GET /customers", "POST /customers"],
    ui: ["CustomerList"],
    permissions: ["customers.read"],
  },
  crm: {
    version: "1.0.0",
    title: "CRM Pipeline",
    requires: ["authentication", "customers"],
    optional: ["notifications", "analytics", "teams"],
    conflicts: [],
    supports: ["crm", "saas"],
    entities: ["deals", "activities", "pipelines"],
    endpoints: ["GET /crm/deals", "POST /crm/deals", "PATCH /crm/deals/:id/stage"],
    ui: ["PipelineBoard"],
    permissions: ["crm.manage"],
  },
  reviews: {
    version: "1.0.0",
    title: "Reviews",
    requires: ["authentication"],
    optional: ["booking", "products", "notifications"],
    conflicts: [],
    supports: ["booking", "marketplace", "ecommerce"],
    entities: ["reviews"],
    endpoints: ["GET /reviews", "POST /reviews"],
    ui: ["ReviewList", "ReviewForm"],
    permissions: ["reviews.create"],
  },
  search: {
    version: "1.3.0",
    title: "Search",
    requires: ["authentication"],
    optional: ["products", "booking", "customers"],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking", "ecommerce"],
    entities: ["search_index"],
    endpoints: ["GET /search"],
    ui: ["SearchBox"],
    permissions: ["search.use"],
  },
  analytics: {
    version: "1.0.0",
    title: "Analytics",
    requires: ["authentication", "rbac"],
    optional: ["billing", "orders", "booking"],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking"],
    entities: ["events_analytics"],
    endpoints: ["GET /analytics/summary"],
    ui: ["AnalyticsDashboard"],
    permissions: ["analytics.read"],
  },
  files: {
    version: "1.0.0",
    title: "Files",
    requires: ["authentication"],
    optional: ["products", "booking"],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking"],
    entities: ["files"],
    endpoints: ["POST /files/upload", "GET /files/:id"],
    ui: ["FileUploader"],
    permissions: ["files.upload"],
  },
  audit: {
    version: "1.0.0",
    title: "Audit",
    requires: ["authentication", "rbac"],
    optional: [],
    conflicts: [],
    supports: ["saas", "crm", "marketplace", "booking"],
    entities: ["audit_logs"],
    endpoints: ["GET /audit"],
    ui: ["AuditLogTable"],
    permissions: ["audit.read"],
  },
};

for (const [id, def] of Object.entries(MODULES)) {
  const dir = join(root, id);
  for (const sub of ["schema", "api", "frontend", "backend", "tests", "docs"]) {
    mkdirSync(join(dir, sub), { recursive: true });
  }

  writeFileSync(
    join(dir, "builder.json"),
    JSON.stringify(
      {
        id: `module.${id}`,
        name: id,
        title: def.title,
        version: def.version,
        kind: "business_module",
        requires: def.requires,
        optional: def.optional,
        conflicts: def.conflicts,
        supports: def.supports,
        surfaces: {
          schema: "schema/",
          api: "api/",
          frontend: "frontend/",
          backend: "backend/",
          tests: "tests/",
          docs: "docs/",
        },
        artifacts: {
          entities: def.entities,
          endpoints: def.endpoints,
          ui: def.ui,
          permissions: def.permissions,
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(dir, "project-dna.fragment.json"),
    JSON.stringify(
      {
        module: id,
        version: def.version,
        contributes: {
          modules: [id],
          entities: def.entities,
          endpoints: def.endpoints,
          ui: def.ui,
          permissions: def.permissions,
          integrations:
            id === "billing" || id === "payments"
              ? ["stripe"]
              : id === "files"
                ? ["supabase"]
                : id === "authentication"
                  ? ["supabase"]
                  : [],
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(dir, "schema", "entities.json"),
    JSON.stringify({ module: id, entities: def.entities }, null, 2) + "\n",
  );
  writeFileSync(
    join(dir, "api", "endpoints.json"),
    JSON.stringify({ module: id, endpoints: def.endpoints }, null, 2) + "\n",
  );
  writeFileSync(
    join(dir, "frontend", "components.json"),
    JSON.stringify({ module: id, components: def.ui }, null, 2) + "\n",
  );
  writeFileSync(
    join(dir, "backend", "services.json"),
    JSON.stringify(
      {
        module: id,
        services: def.entities.map((e) => `${e}Service`),
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(dir, "tests", "acceptance.json"),
    JSON.stringify(
      {
        module: id,
        cases: def.endpoints.map((ep) => ({
          id: `${id}-${ep.split(" ")[0].toLowerCase()}`,
          endpoint: ep,
          expect: "2xx_authenticated",
        })),
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(dir, "docs", "README.md"),
    `# ${def.title} (\`${id}\`)\n\nVersion **${def.version}** — business module for Product Factory assembly.\n\nRequires: ${def.requires.join(", ") || "—"}\nSupports: ${def.supports.join(", ")}\n`,
  );
}

// Registry index
writeFileSync(
  join(root, "registry.json"),
  JSON.stringify(
    {
      version: "1.0.0",
      kind: "factory_registry",
      modules: Object.fromEntries(
        Object.entries(MODULES).map(([id, def]) => [
          id,
          {
            version: def.version,
            title: def.title,
            path: `./${id}`,
            requires: def.requires,
            optional: def.optional,
            conflicts: def.conflicts,
            supports: def.supports,
          },
        ]),
      ),
    },
    null,
    2,
  ) + "\n",
);

console.log(`generated ${Object.keys(MODULES).length} modules + registry.json`);
