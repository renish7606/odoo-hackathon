import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/status-pill";
import { useStore, type VehicleStatus, type VehicleType } from "@/lib/transitops-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const { vehicles, addVehicle } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    regNumber: "", model: "", type: "Truck" as VehicleType, maxLoad: 1000, odometer: 0, cost: 0, status: "Available" as VehicleStatus, region: "West",
  });

  const filtered = vehicles.filter((v) =>
    [v.regNumber, v.model, v.type, v.region].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const submit = () => {
    if (!form.regNumber || !form.model) return toast.error("Registration number and model are required");
    const id = addVehicle(form);
    if (!id) return toast.error("Registration number must be unique");
    toast.success("Vehicle added");
    setOpen(false);
    setForm({ regNumber: "", model: "", type: "Truck", maxLoad: 1000, odometer: 0, cost: 0, status: "Available", region: "West" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fleet Registry</h1>
          <p className="text-sm text-muted-foreground">Master data for every vehicle in your operation.</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Vehicle</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>Register vehicle</SheetTitle></SheetHeader>
            <div className="space-y-3 p-4">
              <Field label="Registration Number (unique)"><Input value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} /></Field>
              <Field label="Model Name"><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
              <Field label="Vehicle Type">
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as VehicleType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Truck">Truck</SelectItem><SelectItem value="Van">Van</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Max Load Capacity (kg)"><Input type="number" value={form.maxLoad} onChange={(e) => setForm({ ...form, maxLoad: +e.target.value })} /></Field>
              <Field label="Odometer (km)"><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} /></Field>
              <Field label="Acquisition Cost ($)"><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></Field>
              <Field label="Region"><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Available", "On Trip", "In Shop", "Retired"] as VehicleStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <SheetFooter className="p-4">
              <Button onClick={submit} className="w-full">Save vehicle</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by registration, model, region…" className="border-0 shadow-none focus-visible:ring-0" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reg Number</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Max Load (kg)</TableHead>
              <TableHead className="text-right">Odometer (km)</TableHead>
              <TableHead className="text-right">Acquisition ($)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.regNumber}</TableCell>
                <TableCell>{v.model}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell className="text-right">{v.maxLoad.toLocaleString()}</TableCell>
                <TableCell className="text-right">{v.odometer.toLocaleString()}</TableCell>
                <TableCell className="text-right">${v.cost.toLocaleString()}</TableCell>
                <TableCell><StatusPill value={v.status} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No vehicles match your search.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
