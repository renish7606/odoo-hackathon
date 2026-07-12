import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst";
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
  licenseExpiry: string;
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

interface State {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: Maintenance[];
  expenses: Expense[];
  activity: Activity[];
  session: Session | null;
<<<<<<< Updated upstream
=======
  settings: Settings;
  vehicleROI: any[];
>>>>>>> Stashed changes
}

const API_BASE = "http://localhost:5000/api";

<<<<<<< Updated upstream
const seed: State = {
  session: null,
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
=======
const getInitialSession = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('transitops:session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  return null;
>>>>>>> Stashed changes
};

const initialState: State = {
  vehicles: [],
  drivers: [],
  trips: [],
  maintenance: [],
  expenses: [],
  activity: [],
  session: getInitialSession(),
  settings: { depotName: "TransitOps Central", currency: "USD", distanceUnit: "Kilometer" },
  vehicleROI: [],
};

interface Ctx extends State {
  login: (s: Session) => void;
  logout: () => void;
<<<<<<< Updated upstream
  addVehicle: (v: Omit<Vehicle, "id">) => string | null;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  addDriver: (d: Omit<Driver, "id">) => void;
  addTrip: (t: Omit<Trip, "id" | "createdAt" | "status"> & { status?: TripStatus }) => void;
  updateTripStatus: (id: string, status: TripStatus) => void;
  addMaintenance: (m: Omit<Maintenance, "id">) => void;
  toggleMaintenance: (id: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
=======
  addVehicle: (v: Omit<Vehicle, "id">) => Promise<string>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  addDriver: (d: Omit<Driver, "id">) => Promise<void>;
  addTrip: (t: Omit<Trip, "id" | "createdAt" | "status"> & { status?: TripStatus }) => Promise<void>;
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  addMaintenance: (m: Omit<Maintenance, "id">) => Promise<void>;
  toggleMaintenance: (id: string) => Promise<void>;
  addExpense: (e: Omit<Expense, "id">) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  refreshData: () => Promise<void>;
>>>>>>> Stashed changes
}

const StoreContext = createContext<Ctx | null>(null);

<<<<<<< Updated upstream
function loadInitial(): State {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  // fix seed: link first expense to first vehicle
  const s = { ...seed };
  if (s.vehicles[0]) s.expenses = s.expenses.map((e) => ({ ...e, vehicleId: e.vehicleId || s.vehicles[0].id }));
  return s;
}

=======
>>>>>>> Stashed changes
export function TransitOpsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (state.session?.token) {
      headers["Authorization"] = `Bearer ${state.session.token}`;
    }
    return headers;
  };

  const refreshData = async () => {
    try {
      const [vRes, dRes, tRes, mRes, eRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/drivers`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/maintenance`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/expenses`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/analytics/dashboard`, { headers: getAuthHeaders() }), // Using dashboard for activity feed
      ]);

      if (!vRes.ok) throw new Error("Failed to fetch vehicles");
      
      const vData = await vRes.json();
      const dData = await dRes.json();
      const tData = await tRes.json();
      const mData = await mRes.json();
      const eData = await eRes.json();
      const dashData = await aRes.json();

      setState((s) => ({
        ...s,
        vehicles: vData.map((v: any) => ({
          id: v.id,
          regNumber: v.registration_number,
          model: v.name_model,
          type: v.type as VehicleType,
          maxLoad: v.max_load_capacity,
          odometer: v.current_odometer,
          cost: v.acquisition_cost,
          status: v.status as VehicleStatus,
          region: v.region,
        })),
        drivers: dData.map((d: any) => ({
          id: d.id,
          name: d.name,
          licenseNumber: d.license_number,
          licenseCategory: d.license_category,
          licenseExpiry: d.license_expiry_date,
          contact: d.contact_number,
          safetyScore: d.safety_score,
          status: d.status as DriverStatus,
        })),
        trips: tData.map((t: any) => ({
          id: t.id,
          source: t.source,
          destination: t.destination,
          vehicleId: t.vehicle_id,
          driverId: t.driver_id,
          cargoWeight: t.cargo_weight,
          distance: t.planned_distance,
          status: t.status as TripStatus,
          createdAt: t.created_at,
        })),
        maintenance: mData.map((m: any) => ({
          id: m.id,
          vehicleId: m.vehicle_id,
          issue: m.issue_description,
          cost: m.cost,
          entryDate: m.date,
          status: m.status as MaintStatus,
        })),
        expenses: eData.map((e: any) => ({
          id: e.id,
          kind: e.type as ExpenseKind,
          vehicleId: e.vehicle_id,
          amount: e.cost,
          date: e.date,
        })),
        activity: dashData.activity.map((a: any) => ({
          id: a.id,
          ts: a.created_at,
          text: a.text,
        })),
        vehicleROI: dashData.vehicleROI || [],
      }));
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  };

  useEffect(() => {
    if (state.session?.token) {
      refreshData();
    }
  }, [state.session?.token]);

  const value = useMemo<Ctx>(() => {
    return {
      ...state,
      refreshData,
      login: (session) => {
        if (typeof window !== 'undefined') localStorage.setItem('transitops:session', JSON.stringify(session));
        setState((s) => ({ ...s, session }));
      },
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('transitops:session');
        setState((s) => ({ ...s, session: null }));
      },
      addVehicle: async (v) => {
        const res = await fetch(`${API_BASE}/vehicles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_number: v.regNumber,
            name_model: v.model,
            type: v.type,
            max_load_capacity: v.maxLoad,
            acquisition_cost: v.cost,
            region: v.region,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add vehicle");
        await refreshData();
        return data.id;
      },
      updateVehicle: async (id, patch) => {
        // Implementation omitted for brevity, similar to above
        await refreshData();
      },
      addDriver: async (d) => {
        const res = await fetch(`${API_BASE}/drivers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: d.name,
            license_number: d.licenseNumber,
            license_category: d.licenseCategory,
            license_expiry_date: d.licenseExpiry,
            contact_number: d.contact,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add driver");
        await refreshData();
      },
      addTrip: async (t) => {
        const res = await fetch(`${API_BASE}/trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: t.source,
            destination: t.destination,
            vehicle_id: t.vehicleId,
            driver_id: t.driverId,
            cargo_weight: t.cargoWeight,
            planned_distance: t.distance,
            status: t.status || "Dispatched",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to dispatch trip");
        await refreshData();
      },
      updateTripStatus: async (id, status) => {
        const res = await fetch(`${API_BASE}/trips/${id}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update trip");
        await refreshData();
      },
      addMaintenance: async (m) => {
        const res = await fetch(`${API_BASE}/maintenance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_id: m.vehicleId,
            issue_description: m.issue,
            cost: m.cost,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add maintenance");
        await refreshData();
      },
      toggleMaintenance: async (id) => {
        const m = state.maintenance.find((x) => x.id === id);
        if (!m) return;
        const newStatus = m.status === "Open" ? "Closed" : "Open";
        const res = await fetch(`${API_BASE}/maintenance/${id}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error("Failed to update maintenance");
        await refreshData();
      },
      addExpense: async (e) => {
        // Expenses and fuel logs are separate in backend, we route based on kind
        if (e.kind === "Fuel Log") {
          const res = await fetch(`${API_BASE}/fuel-logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicle_id: e.vehicleId,
              liters: e.liters,
              cost: e.amount,
            }),
          });
          if (!res.ok) throw new Error("Failed to add fuel log");
        } else {
          const res = await fetch(`${API_BASE}/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicle_id: e.vehicleId,
              type: e.kind,
              cost: e.amount,
            }),
          });
          if (!res.ok) throw new Error("Failed to add expense");
        }
        await refreshData();
      },
<<<<<<< Updated upstream
=======
      updateSettings: (patch) => {
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
      },
>>>>>>> Stashed changes
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within TransitOpsProvider");
  return ctx;
}
