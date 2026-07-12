import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Role = "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst";
export type VehicleType = "Truck" | "Van";
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintStatus = "Open" | "Closed";
export type ExpenseKind = "Fuel Log" | "Toll" | "Service fee";

// Maps for normalizing backend enum values to frontend display values
const VEHICLE_STATUS_MAP: Record<string, VehicleStatus> = {
  Available: "Available",
  OnTrip: "On Trip",
  InShop: "In Shop",
  Retired: "Retired",
};

const DRIVER_STATUS_MAP: Record<string, DriverStatus> = {
  Available: "Available",
  OnTrip: "On Trip",
  OffDuty: "Off Duty",
  Suspended: "Suspended",
};

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
  token?: string;
}

export interface Settings {
  depotName: string;
  currency: string;
  distanceUnit: "Kilometer" | "Mile";
  exchangeRate: number;
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
  vehicleROI: any[];
}

const API_BASE = "http://localhost:5000/api";

const getInitialSession = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('transitops:session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  return null;
};

const initialState: State = {
  vehicles: [],
  drivers: [],
  trips: [],
  maintenance: [],
  expenses: [],
  activity: [],
  session: getInitialSession(),
  settings: { depotName: "TransitOps Central",    currency: "USD",
    distanceUnit: "Kilometer",
    exchangeRate: 1,
  },
  vehicleROI: [],
};

interface Ctx extends State {
  login: (s: Session) => void;
  logout: () => void;
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
}

const StoreContext = createContext<Ctx | null>(null);

export function TransitOpsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);

  // Use a ref for the token so callbacks don't go stale (C-07 fix)
  const tokenRef = useRef(state.session?.token);
  useEffect(() => {
    tokenRef.current = state.session?.token;
  }, [state.session?.token]);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (tokenRef.current) {
      headers["Authorization"] = `Bearer ${tokenRef.current}`;
    }
    return headers;
  }, []);

  // Global 401 handler — clears session on token expiry (W-13)
  const handleUnauthorized = useCallback((res: Response) => {
    if (res.status === 401) {
      if (typeof window !== 'undefined') localStorage.removeItem('transitops:session');
      setState((s) => ({ ...s, session: null }));
      throw new Error("Session expired. Please log in again.");
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [vRes, dRes, tRes, mRes, eRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles`, { headers }),
        fetch(`${API_BASE}/drivers`, { headers }),
        fetch(`${API_BASE}/trips`, { headers }),
        fetch(`${API_BASE}/maintenance`, { headers }),
        fetch(`${API_BASE}/expenses`, { headers }),
        fetch(`${API_BASE}/analytics/dashboard`, { headers }),
      ]);

      // Handle 401 on any response (W-13)
      if (vRes.status === 401 || dRes.status === 401) {
        handleUnauthorized(vRes.status === 401 ? vRes : dRes);
        return;
      }

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
          status: VEHICLE_STATUS_MAP[v.status] || v.status,
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
          status: DRIVER_STATUS_MAP[d.status] || d.status,
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
        activity: dashData.activity?.map((a: any) => ({
          id: a.id,
          ts: a.created_at,
          text: a.text,
        })) || [],
        vehicleROI: dashData.vehicleROI || [],
      }));
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  }, [getAuthHeaders, handleUnauthorized]);

  useEffect(() => {
    if (state.session?.token) {
      refreshData();
    }
  }, [state.session?.token, refreshData]);

  // Stable function references via useCallback (C-07 fix)
  const login = useCallback((session: Session) => {
    if (typeof window !== 'undefined') localStorage.setItem('transitops:session', JSON.stringify(session));
    setState((s) => ({ ...s, session }));
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem('transitops:session');
    setState((s) => ({ ...s, session: null }));
  }, []);

  const addVehicle = useCallback(async (v: Omit<Vehicle, "id">) => {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        registration_number: v.regNumber,
        name_model: v.model,
        type: v.type,
        max_load_capacity: v.maxLoad,
        acquisition_cost: v.cost,
        region: v.region,
      }),
    });
    handleUnauthorized(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add vehicle");
    await refreshData();
    return data.id;
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const updateVehicle = useCallback(async (id: string, patch: Partial<Vehicle>) => {
    const body: Record<string, any> = {};
    if (patch.regNumber !== undefined) body.registration_number = patch.regNumber;
    if (patch.model !== undefined) body.name_model = patch.model;
    if (patch.type !== undefined) body.type = patch.type;
    if (patch.maxLoad !== undefined) body.max_load_capacity = patch.maxLoad;
    if (patch.odometer !== undefined) body.current_odometer = patch.odometer;
    if (patch.cost !== undefined) body.acquisition_cost = patch.cost;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.region !== undefined) body.region = patch.region;
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    handleUnauthorized(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update vehicle");
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const addDriver = useCallback(async (d: Omit<Driver, "id">) => {
    const res = await fetch(`${API_BASE}/drivers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: d.name,
        license_number: d.licenseNumber,
        license_category: d.licenseCategory,
        license_expiry_date: d.licenseExpiry,
        contact_number: d.contact,
      }),
    });
    handleUnauthorized(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add driver");
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const addTrip = useCallback(async (t: Omit<Trip, "id" | "createdAt" | "status"> & { status?: TripStatus }) => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: "POST",
      headers: getAuthHeaders(),
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
    handleUnauthorized(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to dispatch trip");
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const updateTripStatus = useCallback(async (id: string, status: TripStatus) => {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    handleUnauthorized(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update trip");
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const addMaintenance = useCallback(async (m: Omit<Maintenance, "id">) => {
    const res = await fetch(`${API_BASE}/maintenance`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        vehicle_id: m.vehicleId,
        issue_description: m.issue,
        cost: m.cost,
      }),
    });
    handleUnauthorized(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add maintenance");
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const toggleMaintenance = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE}/maintenance/${id}/toggle`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    handleUnauthorized(res);
    if (!res.ok) throw new Error("Failed to update maintenance");
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const addExpense = useCallback(async (e: Omit<Expense, "id">) => {
    if (e.kind === "Fuel Log") {
      const res = await fetch(`${API_BASE}/fuel-logs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          vehicle_id: e.vehicleId,
          liters: e.liters,
          cost: e.amount,
          date: e.date,
        }),
      });
      handleUnauthorized(res);
      if (!res.ok) throw new Error("Failed to add fuel log");
    } else {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          vehicle_id: e.vehicleId,
          type: e.kind,
          cost: e.amount,
          date: e.date,
        }),
      });
      handleUnauthorized(res);
      if (!res.ok) throw new Error("Failed to add expense");
    }
    await refreshData();
  }, [getAuthHeaders, handleUnauthorized, refreshData]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    if (patch.currency) {
      if (patch.currency === "USD") {
        patch.exchangeRate = 1;
      } else {
        try {
          const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
          const data = await res.json();
          patch.exchangeRate = data.rates[patch.currency] || 1;
        } catch (e) {
          console.error("Failed to fetch exchange rate", e);
        }
      }
    }
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  // Stable context value — functions are memoized via useCallback (C-07 fix)
  const value = useMemo<Ctx>(() => ({
    ...state,
    refreshData,
    login,
    logout,
    addVehicle,
    updateVehicle,
    addDriver,
    addTrip,
    updateTripStatus,
    addMaintenance,
    toggleMaintenance,
    addExpense,
    updateSettings,
  }), [state, refreshData, login, logout, addVehicle, updateVehicle, addDriver, addTrip, updateTripStatus, addMaintenance, toggleMaintenance, addExpense, updateSettings]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within TransitOpsProvider");
  return ctx;
}
