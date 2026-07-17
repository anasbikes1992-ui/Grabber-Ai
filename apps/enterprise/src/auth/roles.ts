export type AuthRole =
  | "viewer"
  | "operator"
  | "admin"
  | "consultant"
  | "developer"
  | "finance"
  | "client";

export type AccessRole = "viewer" | "operator" | "admin";

const ACCESS_ROLE_RANK: Record<AccessRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export function normalizeAuthRole(raw: string | null | undefined): AuthRole | null {
  if (!raw) return null;

  const value = raw.toLowerCase();

  if (value === "viewer" || value === "read" || value === "read_only") return "viewer";
  if (value === "operator" || value === "write" || value === "editor") return "operator";
  if (value === "admin" || value === "owner" || value === "enterprise_admin") return "admin";
  if (value === "consultant") return "consultant";
  if (value === "developer") return "developer";
  if (value === "finance") return "finance";
  if (value === "client") return "client";

  return null;
}

export function toAccessRole(role: AuthRole): AccessRole {
  if (role === "admin") return "admin";
  if (role === "operator") return "operator";
  if (role === "consultant" || role === "developer" || role === "finance") return "operator";
  return "viewer";
}

export function hasRequiredAccess(actual: AccessRole, required: AccessRole) {
  return ACCESS_ROLE_RANK[actual] >= ACCESS_ROLE_RANK[required];
}
