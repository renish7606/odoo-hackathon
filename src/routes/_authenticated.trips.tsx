import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusPill } from "@/components/status-pill";
import { useStore, type TripStatus } from "@/lib/transitops-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

function TripsPage() {
  const { vehicles, drivers, trips, addTrip, updateTripStatus } = useStore();
  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter((d) => d.status === "Available");

  const [form, setForm] = useState({
    source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: 0, distance: 0,
  });

  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === form.vehicleId), [vehicles, form.vehicleId]);
  const overload = !!selectedVehicle && form.cargoWeight > selectedVehicle.maxLoad;
  const canSubmit = form.source && form.destination && form.vehicleId && form.driverId && form.cargoWeight > 0 && form.distance > 0 && !overload;

  const submit = () => {
    if (!canSubmit) return;
    addTrip(form);
    toast.success("Trip dispatched");
    setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: 0, distance: 0 });
  };

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.regNumber ?? "—";
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Route Control</h1>
        <p className="text-sm text-slate-500">Create trips with capacity checks, then track lifecycle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-slate-900">Create new trip</h2>
          <Field label="Source"><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
          <Field label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
          <Field label="Available Vehicle">
            <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {availableVehicles.length === 0 && <div className="p-2 text-xs text-slate-500">No available vehicles</div>}
                {availableVehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber} · {v.model} (max {v.maxLoad}kg)</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Available Driver">
            <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
              <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                {availableDrivers.length === 0 && <div className="p-2 text-xs text-slate-500">No available drivers</div>}
                {availableDrivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cargo Weight (kg)"><Input type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: +e.target.value })} /></Field>
          <Field label="Planned Distance (km)"><Input type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: +e.target.value })} /></Field>

          {overload && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Cargo weight exceeds vehicle capacity limit ({selectedVehicle?.maxLoad}kg).</span>
            </div>
          )}

          <Button disabled={!canSubmit} onClick={submit} className="w-full">Dispatch trip</Button>
        </div>

        <div className="lg:col-span-3 rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200"><h2 className="text-sm font-semibold text-slate-900">Trips</h2></div>
          <ul className="divide-y divide-slate-100">
            {trips.length === 0 && <li className="p-6 text-sm text-slate-500 text-center">No trips yet.</li>}
            {trips.map((t) => (
              <li key={t.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{t.source} → {t.destination}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {vehicleName(t.vehicleId)} · {driverName(t.driverId)} · {t.cargoWeight}kg · {t.distance}km
                  </div>
                </div>
                <StatusPill value={t.status} />
                {(t.status === "Draft" || t.status === "Dispatched") && (
                  <Select value={t.status} onValueChange={(v) => updateTripStatus(t.id, v as TripStatus)}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Draft", "Dispatched", "Completed", "Cancelled"] as TripStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-slate-600">{label}</Label>{children}</div>;
}
