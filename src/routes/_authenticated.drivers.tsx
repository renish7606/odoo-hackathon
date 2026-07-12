import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/status-pill";
import { useStore, type DriverStatus } from "@/lib/transitops-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/drivers")({
  component: DriversPage,
});

const categories = ["LMV", "HMV", "MCWG", "Trans"];

function DriversPage() {
  const { drivers, addDriver } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", licenseNumber: "", licenseCategory: "HMV", licenseExpiry: "", contact: "", safetyScore: 80, status: "Available" as DriverStatus,
  });

  const today = new Date().toISOString().slice(0, 10);
  const filtered = drivers.filter((d) => [d.name, d.licenseNumber, d.status].join(" ").toLowerCase().includes(q.toLowerCase()));

  const submit = () => {
    if (!form.name || !form.licenseNumber || !form.licenseExpiry) return toast.error("Name, license number, and expiry are required");
    addDriver(form);
    toast.success("Driver registered");
    setOpen(false);
    setForm({ name: "", licenseNumber: "", licenseCategory: "HMV", licenseExpiry: "", contact: "", safetyScore: 80, status: "Available" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Crew Logs</h1>
          <p className="text-sm text-muted-foreground">Driver roster, license compliance, and safety scores.</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Register Driver</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>Register driver</SheetTitle></SheetHeader>
            <div className="space-y-3 p-4">
              <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="License Number"><Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></Field>
              <Field label="License Category">
                <Select value={form.licenseCategory} onValueChange={(v) => setForm({ ...form, licenseCategory: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="License Expiry Date"><Input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} /></Field>
              <Field label="Contact Number"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
              <Field label={`Safety Score: ${form.safetyScore}`}>
                <Slider value={[form.safetyScore]} min={0} max={100} step={1} onValueChange={(v) => setForm({ ...form, safetyScore: v[0] })} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DriverStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Available", "On Trip", "Off Duty", "Suspended"] as DriverStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <SheetFooter className="p-4"><Button onClick={submit} className="w-full">Save driver</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by driver name or license status…" className="border-0 shadow-none focus-visible:ring-0" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Safety</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => {
              const expired = d.licenseExpiry < today;
              return (
                <TableRow key={d.id} className={expired ? "bg-red-50/50" : ""}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                  <TableCell>{d.licenseCategory}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{d.licenseExpiry}</span>
                      {expired && <StatusPill value="EXPIRED" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{d.contact}</TableCell>
                  <TableCell className="text-right">{d.safetyScore}</TableCell>
                  <TableCell><StatusPill value={d.status} /></TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No drivers.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
