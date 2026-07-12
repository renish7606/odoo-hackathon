import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst";
export type VehicleType = "Truck" | "Van";
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintStatus = "Open" | "Closed";
export type ExpenseKind = "Fuel Log" | "Toll" | "Service fee";

export interface Vehicle {
  id: string;
  regNumber: string;
  model: string;
  type: VehicleType;
  maxLoad: number;
  odometer: number;
  cost: number;
  status: VehicleStatus;
  region: string;
}
export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date
  contact: string;
  safetyScore: number;
  status: DriverStatus;
}
export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  distance: number;
  status: TripStatus;
  createdAt: string;
}
export interface Maintenance {
  id: string;
  vehicleId: string;
  issue: string;
  cost: number;
  entryDate: string;
  status: MaintStatus;
}
export interface Expense {
  id: string;
  kind: ExpenseKind;
  vehicleId: string;
  liters?: number;
  amount: number;
  date: string;
}
export interface Activity {
  id: string;
  ts: string;
  text: string;
}
export interface Session {
  email: string;
  role: Role;
}

export interface Settings {
  depotName: string;
  currency: string;
  distanceUnit: "Kilometer" | "Mile";
}

interface State {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: Maintenance[];
  expenses: Expense[];
  activity: Activity[];
  session: Session | null;
  settings: Settings;
  isHydratingAuth: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const seed: State = {
  session: null,
  isHydratingAuth: true,
  settings: { depotName: "Gandhinagar Depot", currency: "INR", distanceUnit: "Kilometer" },
  vehicles: [
    { id: uid(), regNumber: "MH-12-AB-1001", model: "Tata Prima 4028", type: "Truck", maxLoad: 25000, odometer: 84210, cost: 45000, status: "Available", region: "West" },
    { id: uid(), regNumber: "MH-14-CD-2233", model: "Ashok Leyland Dost", type: "Van", maxLoad: 1500, odometer: 32100, cost: 12000, status: "On Trip", region: "West" },
    { id: uid(), regNumber: "DL-01-EF-8899", model: "Eicher Pro 3015", type: "Truck", maxLoad: 15000, odometer: 51000, cost: 28000, status: "In Shop", region: "North" },
    { id: uid(), regNumber: "KA-03-GH-4567", model: "Mahindra Bolero Pickup", type: "Van", maxLoad: 1200, odometer: 18800, cost: 9500, status: "Available", region: "South" },
    { id: uid(), regNumber: "TN-09-JK-3321", model: "BharatBenz 2823R", type: "Truck", maxLoad: 22000, odometer: 120400, cost: 52000, status: "Retired", region: "South" },
  ],
  drivers: [
    { id: uid(), name: "Ravi Sharma", licenseNumber: "MH1420190001", licenseCategory: "HMV", licenseExpiry: "2027-06-15", contact: "9876543210", safetyScore: 88, status: "Available" },
    { id: uid(), name: "Anita Desai", licenseNumber: "DL0120180077", licenseCategory: "LMV", licenseExpiry: "2024-01-10", contact: "9812345678", safetyScore: 74, status: "Off Duty" },
    { id: uid(), name: "Karthik Iyer", licenseNumber: "KA0320210555", licenseCategory: "HMV", licenseExpiry: "2028-11-22", contact: "9900112233", safetyScore: 92, status: "On Trip" },
    { id: uid(), name: "Suresh Patel", licenseNumber: "GJ0120170099", licenseCategory: "HMV", licenseExpiry: "2023-08-01", contact: "9765432198", safetyScore: 65, status: "Suspended" },
  ],
  trips: [],
  maintenance: [],
  expenses: [
    { id: uid(), kind: "Fuel Log", vehicleId: "", liters: 120, amount: 12000, date: new Date().toISOString().slice(0, 10) },
  ],
  activity: [
    { id: uid(), ts: now(), text: "System initialised with seed fleet data" },
  ],
};

const STORAGE_KEY = "transitops:v1";

interface Ctx extends State {
  login: (s: Session) => void;
  logout: () => void;
  addVehicle: (v: Omit<Vehicle, "id">) => string | null;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  addDriver: (d: Omit<Driver, "id">) => void;
  addTrip: (t: Omit<Trip, "id" | "createdAt" | "status"> & { status?: TripStatus }) => void;
  updateTripStatus: (id: string, status: TripStatus) => void;
  addMaintenance: (m: Omit<Maintenance, "id">) => void;
  toggleMaintenance: (id: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const StoreContext = createContext<Ctx | null>(null);

function loadInitial(): State {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      // Merge with seed so any new fields (e.g. settings) are always present
      return { ...seed, ...parsed, settings: { ...seed.settings, ...(parsed.settings ?? {}) } };
    }
  } catch {}
  // fix seed: link first expense to first vehicle
  const s = { ...seed };
  if (s.vehicles[0]) s.expenses = s.expenses.map((e) => ({ ...e, vehicleId: e.vehicleId || s.vehicles[0].id }));
  return s;
}

export function TransitOpsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitial());
    setHydrated(true);
    
    // Auth Hydration
    const token = localStorage.getItem("transitops_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const roleMap: Record<string, Role> = {
            FleetManager: "Fleet Manager",
            Driver: "Dispatcher",
            SafetyOfficer: "Safety Officer",
            FinancialAnalyst: "Financial Analyst"
          };
          setState(s => ({ ...s, session: { email: data.user.email, role: roleMap[data.user.role] || "Fleet Manager" }, isHydratingAuth: false }));
        } else {
          localStorage.removeItem("transitops_token");
          setState(s => ({ ...s, session: null, isHydratingAuth: false }));
        }
      })
      .catch(() => {
        setState(s => ({ ...s, session: null, isHydratingAuth: false }));
      });
    } else {
      setState(s => ({ ...s, session: null, isHydratingAuth: false }));
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, session: null })); // Do not persist session in mock store anymore
  }, [state, hydrated]);

  const value = useMemo<Ctx>(() => {
    const pushActivity = (text: string) =>
      setState((s) => ({ ...s, activity: [{ id: uid(), ts: now(), text }, ...s.activity].slice(0, 50) }));

    return {
      ...state,
      login: (session) => {
        setState((s) => ({ ...s, session }));
      },
      logout: () => {
        localStorage.removeItem("transitops_token");
        setState((s) => ({ ...s, session: null }));
      },
      addVehicle: (v) => {
        if (state.vehicles.some((x) => x.regNumber.toLowerCase() === v.regNumber.toLowerCase())) return null;
        const id = uid();
        setState((s) => ({ ...s, vehicles: [...s.vehicles, { ...v, id }] }));
        pushActivity(`Vehicle ${v.regNumber} registered`);
        return id;
      },
      updateVehicle: (id, patch) =>
        setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      addDriver: (d) => {
        setState((s) => ({ ...s, drivers: [...s.drivers, { ...d, id: uid() }] }));
        pushActivity(`Driver ${d.name} registered`);
      },
      addTrip: (t) => {
        const id = uid();
        const status: TripStatus = t.status ?? "Dispatched";
        setState((s) => ({
          ...s,
          trips: [{ ...t, id, status, createdAt: now() }, ...s.trips],
          vehicles: s.vehicles.map((v) => (v.id === t.vehicleId && status === "Dispatched" ? { ...v, status: "On Trip" } : v)),
          drivers: s.drivers.map((d) => (d.id === t.driverId && status === "Dispatched" ? { ...d, status: "On Trip" } : d)),
        }));
        pushActivity(`Trip ${t.source} → ${t.destination} dispatched`);
      },
      updateTripStatus: (id, status) => {
        setState((s) => {
          const trip = s.trips.find((t) => t.id === id);
          const next = { ...s, trips: s.trips.map((t) => (t.id === id ? { ...t, status } : t)) };
          if (trip && (status === "Completed" || status === "Cancelled")) {
            next.vehicles = s.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "Available" } : v));
            next.drivers = s.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d));
          }
          return next;
        });
        pushActivity(`Trip status → ${status}`);
      },
      addMaintenance: (m) => {
        setState((s) => ({
          ...s,
          maintenance: [{ ...m, id: uid() }, ...s.maintenance],
          vehicles: m.status === "Open" ? s.vehicles.map((v) => (v.id === m.vehicleId ? { ...v, status: "In Shop" } : v)) : s.vehicles,
        }));
        pushActivity(`Maintenance log created (${m.status})`);
      },
      toggleMaintenance: (id) => {
        setState((s) => {
          const m = s.maintenance.find((x) => x.id === id);
          if (!m) return s;
          const newStatus: MaintStatus = m.status === "Open" ? "Closed" : "Open";
          const vehicles = s.vehicles.map((v) => {
            if (v.id !== m.vehicleId) return v;
            if (newStatus === "Open") return { ...v, status: "In Shop" as VehicleStatus };
            return { ...v, status: "Available" as VehicleStatus };
          });
          return {
            ...s,
            maintenance: s.maintenance.map((x) => (x.id === id ? { ...x, status: newStatus } : x)),
            vehicles,
          };
        });
      },
      addExpense: (e) => {
        setState((s) => ({ ...s, expenses: [{ ...e, id: uid() }, ...s.expenses] }));
        pushActivity(`${e.kind} logged: $${e.amount}`);
      },
      updateSettings: (patch) => {
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
        pushActivity("Depot settings updated");
      },
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside TransitOpsProvider");
  return ctx;
}
