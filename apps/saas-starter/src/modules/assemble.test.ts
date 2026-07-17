import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assembleModules } from "./assemble";
import { resolveModuleCompatibility, normalizeAlias } from "./compatibility";
import { listRegisteredModules, loadRegistry } from "./registry";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("factory registry lists business modules", () => {
  const names = listRegisteredModules(appRoot);
  assert.ok(names.includes("authentication"));
  assert.ok(names.includes("booking"));
  assert.ok(names.includes("billing"));
  assert.ok(names.length >= 15);
  const reg = loadRegistry(appRoot);
  assert.equal(reg.kind, "factory_registry");
});

test("aliases map intake modules to registry ids", () => {
  assert.equal(normalizeAlias("users"), "authentication");
  assert.equal(normalizeAlias("bookings"), "booking");
  assert.equal(normalizeAlias("tenants"), "teams");
  assert.equal(normalizeAlias("deals"), "crm");
});

test("compatibility auto-adds requires", () => {
  const report = resolveModuleCompatibility(["billing"], {
    productType: "saas",
    cwd: appRoot,
  });
  assert.equal(report.ok, true);
  assert.ok(report.resolved.includes("authentication"));
  assert.ok(report.resolved.includes("billing"));
  // authentication before billing
  assert.ok(
    report.resolved.indexOf("authentication") <
      report.resolved.indexOf("billing"),
  );
});

test("unknown module fails compatibility", () => {
  const report = resolveModuleCompatibility(["not-a-real-module"], {
    cwd: appRoot,
  });
  assert.equal(report.ok, false);
  assert.ok(report.issues.some((i) => i.code === "UNKNOWN_MODULE"));
});

test("saas assembly is high reuse catalog composition", () => {
  const a = assembleModules(
    ["authentication", "teams", "billing", "notifications", "analytics"],
    { productType: "saas", cwd: appRoot },
  );
  assert.equal(a.ok, true, a.errors.join("; "));
  assert.equal(a.module_reuse_rate, 1);
  assert.ok(a.composition.entities.includes("users"));
  assert.ok(a.composition.endpoints.some((e) => e.includes("/billing")));
  assert.ok(a.modules.every((m) => m.version));
});

test("booking proving-ground assembly pulls calendar + payments graph", () => {
  const a = assembleModules(
    ["booking", "payments", "reviews", "search", "files", "analytics"],
    { productType: "booking", cwd: appRoot },
  );
  assert.equal(a.ok, true, a.errors.join("; "));
  assert.ok(a.resolved.includes("calendar")); // required by booking
  assert.ok(a.resolved.includes("authentication"));
  assert.ok(a.module_reuse_rate >= 0.99);
  assert.ok(a.composition.ui.includes("BookingCalendar"));
});
