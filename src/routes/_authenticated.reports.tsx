import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Download,
  FileText,
  Fuel,
  Printer,
  Receipt,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type ExpenseKind } from "@/lib/transitops-store";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

type PeriodPreset = "last30" | "last90" | "quarter" | "ytd" | "all" | "custom";
type DateRange = { start: Date | null; end: Date; label: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "last30", label: "Last 30 days" },
  { value: "last90", label: "Last 90 days" },
  { value: "quarter", label: "Current quarter" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All records" },
  { value: "custom", label: "Custom range" },
];
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

function ReportsPage() {
  const { vehicles, drivers, trips, expenses, maintenance, addExpense, settings } = useStore();
  const [period, setPeriod] = useState<PeriodPreset>("last90");
  const [customStart, setCustomStart] = useState(() => dateInput(addDays(new Date(), -89)));
  const [customEnd, setCustomEnd] = useState(() => dateInput(new Date()));
  const [form, setForm] = useState({
    kind: "Fuel Log" as ExpenseKind,
    vehicleId: "",
    liters: "",
    amount: "",
    date: dateInput(new Date()),
  });

  const currency = (value: number, compact = false) =>
    formatCurrency(value, settings.currency, compact, settings.exchangeRate);

  const range = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);

  const report = useMemo(() => {
    const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const scopedTrips = trips.filter((trip) => trip.status === "Completed" && isWithinRange(trip.createdAt, range));
    const scopedExpenses = expenses.filter((expense) => isWithinRange(expense.date, range));
    const scopedMaintenance = maintenance.filter((item) => isWithinRange(item.entryDate, range));
    const openMaintenance = maintenance.filter((item) => item.status === "Open");
    const today = startOfDay(new Date());
    const licenseWindowEnd = addDays(today, 45);
    const expiredDrivers = drivers.filter((driver) => {
      const expiry = parseDate(driver.licenseExpiry);
      return expiry ? expiry < today : false;
    });
    const expiringDrivers = drivers.filter((driver) => {
      const expiry = parseDate(driver.licenseExpiry);
      return expiry ? expiry >= today && expiry <= licenseWindowEnd : false;
    });

    const fuelExpenses = scopedExpenses.filter((expense) => expense.kind === "Fuel Log");
    const fuelSpend = fuelExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const fuelLiters = fuelExpenses.reduce((sum, expense) => sum + (expense.liters ?? 0), 0);
    const tollSpend = scopedExpenses.filter((expense) => expense.kind === "Toll").reduce((sum, expense) => sum + expense.amount, 0);
    const serviceSpend = scopedExpenses
      .filter((expense) => expense.kind === "Service fee")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const maintenanceSpend = scopedMaintenance.reduce((sum, item) => sum + item.cost, 0);
    const totalSpend = fuelSpend + tollSpend + serviceSpend + maintenanceSpend;
    const totalDistance = scopedTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const costPerKm = totalDistance ? totalSpend / totalDistance : 0;
    const missingFuelQuantity = fuelExpenses.filter((expense) => !expense.liters).length;

    const statementRows = vehicles
      .map((vehicle) => {
        const vehicleTrips = scopedTrips.filter((trip) => trip.vehicleId === vehicle.id);
        const vehicleExpenses = scopedExpenses.filter((expense) => expense.vehicleId === vehicle.id);
        const vehicleMaintenance = scopedMaintenance.filter((item) => item.vehicleId === vehicle.id);
        const distance = vehicleTrips.reduce((sum, trip) => sum + trip.distance, 0);
        const expenseSpend = vehicleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const repairSpend = vehicleMaintenance.reduce((sum, item) => sum + item.cost, 0);
        const openIssues = openMaintenance.filter((item) => item.vehicleId === vehicle.id).length;
        const lastTrip = [...vehicleTrips].sort((a, b) => dateTime(b.createdAt) - dateTime(a.createdAt))[0];

        return {
          vehicle,
          distance,
          expenseSpend,
          repairSpend,
          totalSpend: expenseSpend + repairSpend,
          costPerKm: distance ? (expenseSpend + repairSpend) / distance : 0,
          openIssues,
          lastTripDate: lastTrip?.createdAt,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend || b.distance - a.distance);

    const ledgerRows = [
      ...scopedExpenses.map((expense) => ({
        id: expense.id,
        date: expense.date,
        source: "Expense",
        category: expense.kind,
        vehicle: vehicleById.get(expense.vehicleId)?.regNumber ?? "Unassigned",
        detail: expense.kind === "Fuel Log" && expense.liters ? `${expense.liters.toLocaleString()} L fuel` : expense.kind,
        amount: expense.amount,
      })),
      ...scopedMaintenance.map((item) => ({
        id: item.id,
        date: item.entryDate,
        source: "Maintenance",
        category: item.status,
        vehicle: vehicleById.get(item.vehicleId)?.regNumber ?? "Unassigned",
        detail: item.issue,
        amount: item.cost,
      })),
    ].sort((a, b) => dateTime(b.date) - dateTime(a.date));

    const exceptions = [
      ...expiredDrivers.map((driver) => ({
        id: `expired-${driver.id}`,
        severity: "High" as const,
        area: "Driver license",
        owner: driver.name,
        detail: `Expired on ${formatDate(driver.licenseExpiry)}`,
      })),
      ...expiringDrivers.map((driver) => ({
        id: `expiring-${driver.id}`,
        severity: "Medium" as const,
        area: "Driver license",
        owner: driver.name,
        detail: `Renews by ${formatDate(driver.licenseExpiry)}`,
      })),
      ...openMaintenance.map((item) => ({
        id: `maint-${item.id}`,
        severity: "Medium" as const,
        area: "Open maintenance",
        owner: vehicleById.get(item.vehicleId)?.regNumber ?? "Vehicle",
        detail: item.issue,
      })),
      ...vehicles
        .filter((vehicle) => vehicle.status === "In Shop")
        .map((vehicle) => ({
          id: `shop-${vehicle.id}`,
          severity: "Low" as const,
          area: "Workshop status",
          owner: vehicle.regNumber,
          detail: `${vehicle.model} is unavailable for dispatch`,
        })),
    ];

    const topSpendVehicle = statementRows.find((row) => row.totalSpend > 0);
    const breakdown = [
      { label: "Fuel", value: fuelSpend, color: "bg-cyan-500" },
      { label: "Maintenance", value: maintenanceSpend, color: "bg-amber-500" },
      { label: "Tolls", value: tollSpend, color: "bg-emerald-500" },
      { label: "Service fees", value: serviceSpend, color: "bg-rose-500" },
    ];
    const maxBreakdown = Math.max(...breakdown.map((item) => item.value), 1);

    return {
      breakdown,
      costPerKm,
      exceptions,
      expiringDrivers,
      expiredDrivers,
      fuelLiters,
      ledgerRows,
      maxBreakdown,
      missingFuelQuantity,
      openMaintenance,
      scopedExpenses,
      scopedMaintenance,
      scopedTrips,
      statementRows,
      tollSpend,
      totalDistance,
      totalSpend,
      topSpendVehicle,
    };
  }, [drivers, expenses, maintenance, range, trips, vehicles]);

  const insights = useMemo(() => buildInsights(report, currency), [report, currency]);

  const submit = async () => {
    const amount = parseNumberInput(form.amount);
    const liters = parseNumberInput(form.liters);

    if (!form.vehicleId || amount <= 0) return toast.error("Vehicle and amount are required");
    if (form.kind === "Fuel Log" && liters <= 0) return toast.error("Fuel quantity is required for fuel logs");

    try {
      await addExpense({
        kind: form.kind,
        vehicleId: form.vehicleId,
        liters: form.kind === "Fuel Log" ? liters : undefined,
        amount: amount / settings.exchangeRate,
        date: form.date,
      });
      toast.success("Expense logged");
      setForm({ kind: form.kind, vehicleId: "", liters: "", amount: "", date: dateInput(new Date()) });
    } catch (err: any) {
      toast.error(err.message || "Failed to log expense");
    }
  };

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["TransitOps report", "Fleet operating packet"],
      ["Period", range.label],
      ["Generated", formatDate(new Date().toISOString())],
      [],
      ["Summary"],
      ["Completed trips", report.scopedTrips.length],
      ["Ledger entries", report.scopedExpenses.length + report.scopedMaintenance.length],
      ["Distance", `${report.totalDistance.toFixed(0)} km`],
      ["Spend", currency(report.totalSpend)],
      ["Cost per km", currency(report.costPerKm)],
      ["Compliance exceptions", report.exceptions.length],
      [],
      ["Vehicle operating statement"],
      ["Vehicle", "Model", "Region", "Distance", "Expense spend", "Maintenance spend", "Cost per km", "Open issues"],
      ...report.statementRows.map((row) => [
        row.vehicle.regNumber,
        row.vehicle.model,
        row.vehicle.region,
        row.distance.toFixed(0),
        currency(row.expenseSpend),
        currency(row.repairSpend),
        row.distance ? currency(row.costPerKm) : "No distance",
        row.openIssues,
      ]),
      [],
      ["Exceptions"],
      ["Severity", "Area", "Owner", "Detail"],
      ...report.exceptions.map((item) => [item.severity, item.area, item.owner, item.detail]),
      [],
      ["Source ledger"],
      ["Date", "Source", "Category", "Vehicle", "Detail", "Amount"],
      ...report.ledgerRows.map((row) => [formatDate(row.date), row.source, row.category, row.vehicle, row.detail, currency(row.amount)]),
    ];

    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transitops-fleet-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const printReport = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">Reports</h1>
            <Badge variant="outline" className="bg-card">
              {range.label}
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Operational report packs with audit entries, exceptions, and export-ready fleet statements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={printReport}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-card text-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Fleet operating packet</div>
                  <div className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
                    One combined report for period spend, vehicle cost accountability, compliance exceptions, and the source ledger.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[220px_1fr_1fr]">
              <Field label="Reporting period">
                <Select value={period} onValueChange={(value) => setPeriod(value as PeriodPreset)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Start date">
                <Input
                  type="date"
                  value={customStart}
                  disabled={period !== "custom"}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
              </Field>
              <Field label="End date">
                <Input
                  type="date"
                  value={customEnd}
                  disabled={period !== "custom"}
                  onChange={(event) => setCustomEnd(event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-card text-foreground">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Report scope</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {report.scopedTrips.length} completed trips, {report.ledgerRows.length} ledger entries, and{" "}
                  {report.exceptions.length} active exceptions are included in this period.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Ledger Entries" value={report.ledgerRows.length} hint="Expenses and repairs" icon={FileText} />
        <MetricCard label="Period Spend" value={currency(report.totalSpend)} hint="Fuel, fees, and repairs" icon={Receipt} />
        <MetricCard
          label="Cost / km"
          value={report.totalDistance ? currency(report.costPerKm) : "No distance"}
          hint={`${report.totalDistance.toLocaleString()} km completed`}
          icon={CalendarRange}
        />
        <MetricCard
          label="Fuel Quantity"
          value={report.fuelLiters ? `${report.fuelLiters.toLocaleString()} L` : "Missing"}
          hint={report.missingFuelQuantity ? `${report.missingFuelQuantity} fuel rows need liters` : "All fuel rows covered"}
          icon={Fuel}
          tone={report.missingFuelQuantity ? "warning" : "positive"}
        />
        <MetricCard
          label="Exceptions"
          value={report.exceptions.length}
          hint={`${report.openMaintenance.length} open repairs`}
          icon={AlertTriangle}
          tone={report.exceptions.length ? "warning" : "positive"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-lg border border-border bg-card">
          <SectionHeader title="Briefing memo" description={`Manager-ready summary for ${range.label.toLowerCase()}.`} />
          <div className="space-y-3 p-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-3 rounded-md border border-border bg-muted/40 p-3">
                <div className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", insight.tone)} />
                <div>
                  <div className="text-sm font-medium text-foreground">{insight.title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{insight.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <SectionHeader title="Cost ledger breakdown" description="Period spend by source category." />
          <div className="space-y-3 p-4">
            {report.breakdown.map((item) => (
              <div key={item.label} className="grid grid-cols-[98px_1fr_92px] items-center gap-3 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${Math.max(4, (item.value / report.maxBreakdown) * 100)}%` }} />
                </div>
                <span className="text-right font-medium text-foreground">{currency(item.value)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Log expense</h2>
            <p className="text-xs text-muted-foreground">Entries feed the report ledger and period exports.</p>
          </div>
          <Badge variant="secondary">{settings.currency}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Field label="Type">
            <Select value={form.kind} onValueChange={(value) => setForm({ ...form, kind: value as ExpenseKind, liters: value === "Fuel Log" ? form.liters : "" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Fuel Log", "Toll", "Service fee"] as ExpenseKind[]).map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vehicle">
            <Select value={form.vehicleId} onValueChange={(value) => setForm({ ...form, vehicleId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.regNumber} - {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fuel liters">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0"
              value={form.liters}
              disabled={form.kind !== "Fuel Log"}
              onChange={(event) => setForm({ ...form, liters: event.target.value })}
            />
          </Field>
          <Field label={`Amount (${settings.currency})`}>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <div className="flex items-end">
            <Button onClick={submit} className="w-full">
              Add entry
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-border bg-card">
          <SectionHeader title="Exception register" description="Open items that should be cleared before sign-off." />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.exceptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No open exceptions.
                    </TableCell>
                  </TableRow>
                )}
                {report.exceptions.slice(0, 8).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <SeverityBadge severity={item.severity} />
                    </TableCell>
                    <TableCell>{item.area}</TableCell>
                    <TableCell className="font-medium">{item.owner}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">{item.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <SectionHeader title="Vehicle operating statement" description="Spend accountability by asset, without revenue or ROI duplication." />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Repairs</TableHead>
                  <TableHead className="text-right">Cost / km</TableHead>
                  <TableHead className="text-right">Open Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.statementRows.map((row) => (
                  <TableRow key={row.vehicle.id}>
                    <TableCell>
                      <div className="font-mono text-xs text-foreground">{row.vehicle.regNumber}</div>
                      <div className="text-[11px] text-muted-foreground">{row.vehicle.model}</div>
                    </TableCell>
                    <TableCell className="text-right">{row.distance.toLocaleString()} km</TableCell>
                    <TableCell className="text-right">{currency(row.expenseSpend)}</TableCell>
                    <TableCell className="text-right">{currency(row.repairSpend)}</TableCell>
                    <TableCell className="text-right">{row.distance ? currency(row.costPerKm) : "No distance"}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("font-medium", row.openIssues ? "text-amber-700" : "text-emerald-700")}>{row.openIssues}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <SectionHeader title="Source ledger" description="Auditable expense and maintenance rows in the selected period." />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.ledgerRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No ledger rows in this period.
                  </TableCell>
                </TableRow>
              )}
              {report.ledgerRows.slice(0, 12).map((row) => (
                <TableRow key={`${row.source}-${row.id}`}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.source}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.vehicle}</TableCell>
                  <TableCell>
                    <div className="max-w-[420px] truncate text-sm text-foreground">{row.detail}</div>
                    <div className="text-[11px] text-muted-foreground">{row.category}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{currency(row.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "positive" | "warning";
}) {
  const toneClass = {
    neutral: "text-foreground",
    positive: "text-emerald-700",
    warning: "text-amber-700",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={cn("mt-2 text-2xl font-semibold", toneClass)}>{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "High" | "Medium" | "Low" }) {
  const className = {
    High: "border-red-200 bg-red-50 text-red-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    Low: "border-slate-200 bg-slate-50 text-slate-700",
  }[severity];

  return (
    <Badge variant="outline" className={className}>
      {severity}
    </Badge>
  );
}

function buildInsights(
  report: {
    costPerKm: number;
    exceptions: Array<unknown>;
    expiredDrivers: Array<unknown>;
    expiringDrivers: Array<unknown>;
    missingFuelQuantity: number;
    openMaintenance: Array<unknown>;
    scopedTrips: Array<unknown>;
    totalDistance: number;
    totalSpend: number;
    topSpendVehicle?: { vehicle: { regNumber: string; model: string }; totalSpend: number; costPerKm: number };
  },
  currency: (value: number, compact?: boolean) => string,
) {
  const fallback = report.scopedTrips.length
    ? "The selected period has enough completed movement to support a manager sign-off packet."
    : "No completed trips landed in this period, so cost rows should be reviewed as standing overhead.";

  return [
    {
      title: "Period position",
      detail: `${fallback} Recorded spend is ${currency(report.totalSpend)} across ${report.totalDistance.toLocaleString()} completed km${report.costPerKm ? `, or ${currency(report.costPerKm)} per km` : ""}.`,
      tone: "bg-cyan-500",
    },
    {
      title: "Asset and workshop focus",
      detail: report.topSpendVehicle
        ? `${report.topSpendVehicle.vehicle.regNumber} has the highest period spend at ${currency(report.topSpendVehicle.totalSpend)}. ${report.openMaintenance.length ? `${report.openMaintenance.length} maintenance records remain open.` : "No open maintenance records are constraining fleet availability."}`
        : report.openMaintenance.length
          ? `${report.openMaintenance.length} maintenance records remain open and may constrain dispatch capacity.`
          : "No vehicle has recorded spend and no maintenance records are open in this period.",
      tone: report.openMaintenance.length ? "bg-amber-500" : "bg-emerald-500",
    },
    {
      title: "Sign-off checks",
      detail: `${report.exceptions.length} exceptions are open, ${report.expiredDrivers.length} licenses are expired, and ${report.expiringDrivers.length} renew within 45 days.${report.missingFuelQuantity ? ` Backfill liters for ${report.missingFuelQuantity} fuel rows before using this as a fuel-efficiency record.` : " Fuel quantity coverage is ready for export."}`,
      tone: report.exceptions.length || report.missingFuelQuantity ? "bg-rose-500" : "bg-emerald-500",
    },
  ];
}

function getDateRange(period: PeriodPreset, customStart: string, customEnd: string): DateRange {
  const today = new Date();
  const end = endOfDay(period === "custom" ? parseDate(customEnd) ?? today : today);
  let start: Date | null;

  if (period === "last30") start = startOfDay(addDays(end, -29));
  else if (period === "last90") start = startOfDay(addDays(end, -89));
  else if (period === "quarter") start = startOfDay(new Date(end.getFullYear(), Math.floor(end.getMonth() / 3) * 3, 1));
  else if (period === "ytd") start = startOfDay(new Date(end.getFullYear(), 0, 1));
  else if (period === "custom") start = startOfDay(parseDate(customStart) ?? addDays(end, -29));
  else start = null;

  return {
    start,
    end,
    label: start ? `${DATE_FORMATTER.format(start)} - ${DATE_FORMATTER.format(end)}` : `Through ${DATE_FORMATTER.format(end)}`,
  };
}

function isWithinRange(value: string, range: DateRange) {
  const date = parseDate(value);
  if (!date) return false;
  if (range.start && date < range.start) return false;
  return date <= range.end;
}

function parseDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTime(value?: string) {
  return parseDate(value)?.getTime() ?? 0;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  const date = parseDate(value);
  return date ? DATE_FORMATTER.format(date) : "Unknown date";
}

function parseNumberInput(value: string) {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(",")).join("\n");
}

function escapeCsv(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
