export type Role = "ADMIN" | "USER";

export const Roles: Record<Role, Role> = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const ADMIN_ONLY: Role[] = [Roles.ADMIN];
export const ADMIN_AND_USER: Role[] = [Roles.ADMIN, Roles.USER];

export function assertRole(role: Role | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}

export function hasRole(role: Role | undefined, allowed: Role[]) {
  return !!role && allowed.includes(role);
}
