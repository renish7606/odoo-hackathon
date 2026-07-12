import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Gauge } from "lucide-react";
import { useStore, type VehicleType, type VehicleStatus } from "@/lib/transitops-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const typeOptions: (VehicleType | "All")[] = ["All", "Truck", "Van"];
const statusOptions: (VehicleStatus | "All")[] = ["All", "Available", "On Trip", "In Shop"];

function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs border transition-colors",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const { vehicles, drivers, trips, activity } = useStore();
  const [type, setType] = useState<(VehicleType | "All")>("All");
  const [status, setStatus] = useState<(VehicleStatus | "All")>("All");
  const [region, setRegion] = useState<string>("All");

  const regions = useMemo(() => ["All", ...Array.from(new Set(vehicles.map((v) => v.region)))], [vehicles]);

  const filtered = vehicles.filter((v) =>
    (type === "All" || v.type === type) &&
    (status === "All" || v.status === status) &&
    (region === "All" || v.region === region),
  );

  const active = filtered.filter((v) => v.status === "On Trip").length;
  const available = filtered.filter((v) => v.status === "Available").length;
  const inShop = filtered.filter((v) => v.status === "In Shop").length;
  const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
  const pendingTrips = trips.filter((t) => t.status === "Draft").length;
  const onDuty = drivers.filter((d) => d.status === "On Trip").length;
  const utilization = filtered.length ? Math.round((active / filtered.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Operations Overview</h1>
        <p className="text-sm text-slate-500">Live snapshot of fleet, drivers, and trip activity.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Vehicle type:</span>
        {typeOptions.map((t) => <Pill key={t} active={type === t} onClick={() => setType(t)}>{t}</Pill>)}
        <span className="text-xs text-slate-500 ml-3 mr-1">Status:</span>
        {statusOptions.map((s) => <Pill key={s} active={status === s} onClick={() => setStatus(s)}>{s}</Pill>)}
        <span className="text-xs text-slate-500 ml-3 mr-1">Region:</span>
        {regions.map((r) => <Pill key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Pill>)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <Kpi label="Active Vehicles" value={active} icon={Truck} />
        <Kpi label="Available" value={available} icon={CheckCircle2} />
        <Kpi label="In Maintenance" value={inShop} icon={Wrench} />
        <Kpi label="Active Trips" value={activeTrips} icon={RouteIcon} />
        <Kpi label="Pending Trips" value={pendingTrips} icon={Clock} />
        <Kpi label="Drivers On Duty" value={onDuty} icon={Users} />
        <Kpi label="Fleet Utilization" value={`${utilization}%`} icon={Gauge} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          <span className="text-xs text-slate-500">{activity.length} events</span>
        </div>
        <ul className="divide-y divide-slate-100 max-h-96 overflow-auto">
          {activity.length === 0 && <li className="p-4 text-sm text-slate-500">No activity yet.</li>}
          {activity.map((a) => (
            <li key={a.id} className="px-4 py-3 flex items-start gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-800">{a.text}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{new Date(a.ts).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
