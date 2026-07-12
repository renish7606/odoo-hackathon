import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/status-pill";
import { canMutate } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { useStore, type MaintStatus } from "@/lib/transitops-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const { vehicles, maintenance, addMaintenance, toggleMaintenance, settings, session } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "", issue: "", cost: 0, entryDate: new Date().toISOString().slice(0, 10), status: "Open" as MaintStatus,
  });

  const submit = async () => {
    if (!form.vehicleId || !form.issue) return toast.error("Vehicle and issue description are required");
    try {
      await addMaintenance({ ...form, cost: form.cost / settings.exchangeRate });
      toast.success(form.status === "Open" ? "Log opened — vehicle moved to In Shop" : "Log recorded");
      setOpen(false);
      setForm({ vehicleId: "", issue: "", cost: 0, entryDate: new Date().toISOString().slice(0, 10), status: "Open" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create maintenance record");
    }
  };

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.regNumber ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Repair Logbook</h1>
          <p className="text-sm text-muted-foreground">Track service history and workshop assignments.</p>
        </div>
        {canMutate(session?.role, "fleet") && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="shadow-sm"><Plus className="h-4 w-4 mr-2" /> Log Maintenance</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>New maintenance record</SheetTitle></SheetHeader>
              <div className="space-y-3 p-4">
                <Field label="Vehicle">
                  <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber} · {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Issue Description"><Input value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></Field>
                <Field label={`Target Repair Cost (${settings.currency})`}><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></Field>
                <Field label="Entry Date"><Input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} /></Field>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">Log status: {form.status}</div>
                    <div className="text-[11px] text-muted-foreground">Open moves the vehicle to “In Shop”.</div>
                  </div>
                  <Switch checked={form.status === "Open"} onCheckedChange={(c) => setForm({ ...form, status: c ? "Open" : "Closed" })} />
                </div>
              </div>
              <SheetFooter className="p-4"><Button onClick={submit} className="w-full">Save record</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>Automation rule:</strong> Opening a maintenance log automatically moves the selected vehicle to
          <em> In Shop</em>, removing it from trip dispatch selection until the log is closed.
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Toggle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenance.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No maintenance records.</TableCell></TableRow>}
            {maintenance.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{vehicleName(m.vehicleId)}</TableCell>
                <TableCell>{m.issue}</TableCell>
                <TableCell className="text-right">{formatCurrency(m.cost, settings.currency, false, settings.exchangeRate)}</TableCell>
                <TableCell>{m.entryDate}</TableCell>
                <TableCell><StatusPill value={m.status} /></TableCell>
                <TableCell className="text-right">
                  {canMutate(session?.role, "fleet") && (
                    <Button size="sm" variant="outline" onClick={() => toggleMaintenance(m.id)}>
                      Mark {m.status === "Open" ? "Closed" : "Open"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
