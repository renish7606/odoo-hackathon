import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type ExpenseKind } from "@/lib/transitops-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const REVENUE_PER_KM = 2.5; // demo rate

function ReportsPage() {
  const { vehicles, trips, expenses, maintenance, addExpense } = useStore();
  const [form, setForm] = useState({
    kind: "Fuel Log" as ExpenseKind, vehicleId: "", liters: 0, amount: 0, date: new Date().toISOString().slice(0, 10),
  });

  const submit = () => {
    if (!form.vehicleId || form.amount <= 0) return toast.error("Vehicle and amount are required");
    addExpense(form);
    toast.success("Expense logged");
    setForm({ kind: form.kind, vehicleId: "", liters: 0, amount: 0, date: new Date().toISOString().slice(0, 10) });
  };

  const rows = useMemo(() => vehicles.map((v) => {
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
    const distance = vTrips.reduce((s, t) => s + t.distance, 0);
    const vExpenses = expenses.filter((e) => e.vehicleId === v.id);
    const fuelLiters = vExpenses.filter((e) => e.kind === "Fuel Log").reduce((s, e) => s + (e.liters || 0), 0);
    const expenseTotal = vExpenses.reduce((s, e) => s + e.amount, 0);
    const maintTotal = maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const costs = expenseTotal + maintTotal;
    const revenue = distance * REVENUE_PER_KM;
    const efficiency = fuelLiters > 0 ? distance / fuelLiters : 0;
    const roi = v.cost > 0 ? ((revenue - costs) / v.cost) * 100 : 0;
    return { v, distance, fuelLiters, efficiency, costs, revenue, roi };
  }), [vehicles, trips, expenses, maintenance]);

  const exportCsv = () => {
    const header = ["Reg Number", "Model", "Distance (km)", "Fuel (L)", "Efficiency (km/L)", "Total Costs ($)", "Revenue ($)", "ROI (%)"];
    const lines = [header.join(",")];
    rows.forEach((r) => lines.push([
      r.v.regNumber, `"${r.v.model}"`, r.distance, r.fuelLiters, r.efficiency.toFixed(2), r.costs.toFixed(2), r.revenue.toFixed(2), r.roi.toFixed(2),
    ].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transitops-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Ledger &amp; Insights</h1>
          <p className="text-sm text-muted-foreground">Log expenses and analyze per-vehicle efficiency and ROI.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Log expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Type">
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as ExpenseKind })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Fuel Log", "Toll", "Service fee"] as ExpenseKind[]).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vehicle">
            <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fuel (Liters)">
            <Input type="number" value={form.liters} disabled={form.kind !== "Fuel Log"} onChange={(e) => setForm({ ...form, liters: +e.target.value })} />
          </Field>
          <Field label="Amount ($)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        </div>
        <div className="mt-3 flex justify-end"><Button onClick={submit}>Add entry</Button></div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Per-vehicle analytics</h2>
          <span className="text-[11px] text-muted-foreground">Revenue estimated at ${REVENUE_PER_KM}/km · ROI = (Revenue − Costs) ÷ Acquisition</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Distance (km)</TableHead>
              <TableHead className="text-right">Fuel (L)</TableHead>
              <TableHead className="text-right">Efficiency (km/L)</TableHead>
              <TableHead className="text-right">Total Costs</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.v.id}>
                <TableCell><div className="font-mono text-xs">{r.v.regNumber}</div><div className="text-[11px] text-muted-foreground">{r.v.model}</div></TableCell>
                <TableCell className="text-right">{r.distance.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.fuelLiters.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.efficiency.toFixed(2)}</TableCell>
                <TableCell className="text-right">${r.costs.toLocaleString()}</TableCell>
                <TableCell className="text-right">${r.revenue.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-medium ${r.roi >= 0 ? "text-emerald-700" : "text-red-700"}`}>{r.roi.toFixed(1)}%</TableCell>
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
