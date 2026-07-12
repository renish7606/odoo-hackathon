import { Role } from "./transitops-store";

export type PermissionLevel = "full" | "view" | "none";

type Module = "fleet" | "drivers" | "trips" | "fuel_exp" | "analytics";

export const ROLE_PERMISSIONS: Record<Role, Record<Module, PermissionLevel>> = {
  "Fleet Manager": {
    fleet: "full",
    drivers: "full",
    trips: "none",
    fuel_exp: "none",
    analytics: "full",
  },
  Dispatcher: {
    fleet: "view",
    drivers: "none",
    trips: "full",
    fuel_exp: "none",
    analytics: "none",
  },
  "Safety Officer": {
    fleet: "none",
    drivers: "full",
    trips: "view",
    fuel_exp: "none",
    analytics: "none",
  },
  "Financial Analyst": {
    fleet: "view",
    drivers: "none",
    trips: "none",
    fuel_exp: "full",
    analytics: "full",
  },
};

export function canAccessPage(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  const p = ROLE_PERMISSIONS[role];
  
  if (path.startsWith("/dashboard") || path.startsWith("/analysis")) {
    return p.analytics !== "none";
  }
  if (path.startsWith("/fleet") || path.startsWith("/vehicles") || path.startsWith("/maintenance")) {
    return p.fleet !== "none";
  }
  if (path.startsWith("/drivers")) {
    return p.drivers !== "none";
  }
  if (path.startsWith("/trips")) {
    return p.trips !== "none";
  }
  if (path.startsWith("/reports")) {
    // "report page can be viewed by every role"
    return true;
  }
  if (path.startsWith("/settings")) {
    return true;
  }
  
  return false;
}

export function canMutate(role: Role | undefined, module: Module): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][module] === "full";
}

export function getDefaultRoute(role: Role): string {
  const p = ROLE_PERMISSIONS[role];
  if (p.analytics !== "none") return "/dashboard";
  if (p.fleet !== "none") return "/fleet";
  if (p.trips !== "none") return "/trips";
  if (p.drivers !== "none") return "/drivers";
  return "/reports";
}
