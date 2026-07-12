import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Gauge,
  MapPin,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Fuel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/status-pill";
import { useStore, Vehicle, VehicleStatus, VehicleType } from "@/lib/transitops-store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fleet")({
  component: FleetPage,
});

/* ─── KPI Card ─── */
function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-border">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-lg grid place-items-center transition-colors",
            accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {/* subtle gradient bar at bottom */}
      <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ─── Status filter pill ─── */
function FilterPill({
  active,
  children,
  onClick,
  count,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-muted-foreground border-border hover:bg-muted hover:border-border",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-semibold",
            active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Form field helper ─── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ─── Odometer gauge ─── */
function OdometerBar({ km }: { km: number }) {
  // assume 200k km is full lifecycle
  const pct = Math.min((km / 200000) * 100, 100);
  const color =
    pct > 75 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {km.toLocaleString()}
      </span>
    </div>
  );
}

type SortField = "regNumber" | "model" | "odometer" | "cost" | "maxLoad";
type SortDir = "asc" | "desc";

/* ═══════════════════════════════════════ */
/*              FLEET PAGE                 */
/* ═══════════════════════════════════════ */
function FleetPage() {
  const { vehicles, addVehicle, updateVehicle, trips, maintenance, settings } =
    useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">(
    "All",
  );
  const [typeFilter, setTypeFilter] = useState<VehicleType | "All">("All");
  const [sortField, setSortField] = useState<SortField>("regNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [detailVehicle, setDetailVehicle] = useState<string | null>(null);

  const [form, setForm] = useState({
    regNumber: "",
    model: "",
    type: "Truck" as VehicleType,
    maxLoad: 1000,
    odometer: 0,
    cost: 0,
    status: "Available" as VehicleStatus,
    region: "West",
  });

  /* ── Computed stats ── */
  const totalVehicles = vehicles.length;
  const available = vehicles.filter((v) => v.status === "Available").length;
  const onTrip = vehicles.filter((v) => v.status === "On Trip").length;
  const inShop = vehicles.filter((v) => v.status === "In Shop").length;
  const retired = vehicles.filter((v) => v.status === "Retired").length;
  const utilization = totalVehicles
    ? Math.round((onTrip / totalVehicles) * 100)
    : 0;
  const totalFleetValue = vehicles.reduce((sum, v) => sum + v.cost, 0);
  const avgOdometer = totalVehicles
    ? Math.round(
        vehicles.reduce((sum, v) => sum + v.odometer, 0) / totalVehicles,
      )
    : 0;

  const regions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.region))),
    [vehicles],
  );

  /* ── Filter + sort ── */
  const filtered = useMemo(() => {
    let list = vehicles.filter((v) => {
      const matchSearch = [v.regNumber, v.model, v.type, v.region]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase());
      const matchStatus =
        statusFilter === "All" || v.status === statusFilter;
      const matchType = typeFilter === "All" || v.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "regNumber") cmp = a.regNumber.localeCompare(b.regNumber);
      else if (sortField === "model") cmp = a.model.localeCompare(b.model);
      else if (sortField === "odometer") cmp = a.odometer - b.odometer;
      else if (sortField === "cost") cmp = a.cost - b.cost;
      else if (sortField === "maxLoad") cmp = a.maxLoad - b.maxLoad;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [vehicles, q, statusFilter, typeFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const submit = () => {
    if (!form.regNumber || !form.model)
      return toast.error("Registration number and model are required");
    const id = addVehicle({ ...form, cost: form.cost / settings.exchangeRate });
    if (!id) return toast.error("Registration number must be unique");
    toast.success("Vehicle added to fleet");
    setOpen(false);
    setForm({
      regNumber: "",
      model: "",
      type: "Truck",
      maxLoad: 1000,
      odometer: 0,
      cost: 0,
      status: "Available",
      region: "West",
    });
  };

  /* ── Detail view vehicle ── */
  const detail = detailVehicle
    ? vehicles.find((v) => v.id === detailVehicle)
    : null;
  const detailTrips = detail
    ? trips.filter((t) => t.vehicleId === detail.id)
    : [];
  const detailMaint = detail
    ? maintenance.filter((m) => m.vehicleId === detail.id)
    : [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Fleet Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete overview of your vehicle fleet — status, utilization, and
            registry.
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" /> Add Vehicle
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Register New Vehicle</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <Field label="Registration Number (unique)">
                <Input
                  placeholder="e.g. MH-12-AB-1234"
                  value={form.regNumber}
                  onChange={(e) =>
                    setForm({ ...form, regNumber: e.target.value })
                  }
                />
              </Field>
              <Field label="Model / Make">
                <Input
                  placeholder="e.g. Tata Prima 4028"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vehicle Type">
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({ ...form, type: v as VehicleType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Region">
                  <Input
                    placeholder="e.g. West"
                    value={form.region}
                    onChange={(e) =>
                      setForm({ ...form, region: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Max Load (kg)">
                  <Input
                    type="number"
                    value={form.maxLoad}
                    onChange={(e) =>
                      setForm({ ...form, maxLoad: +e.target.value })
                    }
                  />
                </Field>
                <Field label="Odometer (km)">
                  <Input
                    type="number"
                    value={form.odometer}
                    onChange={(e) =>
                      setForm({ ...form, odometer: +e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label={`Acquisition Cost (${settings.currency})`}>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: +e.target.value })}
                />
              </Field>
              <Field label="Initial Status">
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as VehicleStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "Available",
                        "On Trip",
                        "In Shop",
                        "Retired",
                      ] as VehicleStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <SheetFooter className="p-4">
              <Button onClick={submit} className="w-full">
                Save Vehicle
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Total Fleet"
          value={totalVehicles}
          icon={Truck}
          accent="bg-muted text-foreground"
          subtitle={`${formatCurrency(totalFleetValue, settings.currency, false, settings.exchangeRate)} total value`}
        />
        <KpiCard
          label="Available"
          value={available}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600"
          subtitle="Ready to dispatch"
        />
        <KpiCard
          label="On Trip"
          value={onTrip}
          icon={MapPin}
          accent="bg-blue-50 text-blue-600"
          subtitle="Currently active"
        />
        <KpiCard
          label="In Maintenance"
          value={inShop}
          icon={Wrench}
          accent="bg-orange-50 text-orange-600"
          subtitle="Service bay"
        />
        <KpiCard
          label="Utilization"
          value={`${utilization}%`}
          icon={Gauge}
          accent="bg-violet-50 text-violet-600"
          subtitle={`${avgOdometer.toLocaleString()} km avg`}
        />
        <KpiCard
          label="Retired"
          value={retired}
          icon={AlertTriangle}
          accent="bg-muted text-muted-foreground"
          subtitle="Decommissioned"
        />
      </div>

      {/* ── Filters + Search ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search registration, model, region…"
                className="pl-9 border-border bg-muted/50 focus:bg-card transition-colors"
              />
            </div>

            {/* Type tabs */}
            <Tabs
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as VehicleType | "All")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="All" className="text-xs px-3 h-6">
                  All Types
                </TabsTrigger>
                <TabsTrigger value="Truck" className="text-xs px-3 h-6">
                  Trucks
                </TabsTrigger>
                <TabsTrigger value="Van" className="text-xs px-3 h-6">
                  Vans
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filtered count */}
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} of {totalVehicles} vehicles
            </span>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 mt-3">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <FilterPill
              active={statusFilter === "All"}
              onClick={() => setStatusFilter("All")}
              count={totalVehicles}
            >
              All
            </FilterPill>
            <FilterPill
              active={statusFilter === "Available"}
              onClick={() => setStatusFilter("Available")}
              count={available}
            >
              Available
            </FilterPill>
            <FilterPill
              active={statusFilter === "On Trip"}
              onClick={() => setStatusFilter("On Trip")}
              count={onTrip}
            >
              On Trip
            </FilterPill>
            <FilterPill
              active={statusFilter === "In Shop"}
              onClick={() => setStatusFilter("In Shop")}
              count={inShop}
            >
              In Shop
            </FilterPill>
            <FilterPill
              active={statusFilter === "Retired"}
              onClick={() => setStatusFilter("Retired")}
              count={retired}
            >
              Retired
            </FilterPill>
          </div>
        </div>

        {/* ── Table ── */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <button
                  onClick={() => toggleSort("regNumber")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Reg Number
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("model")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Vehicle
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("maxLoad")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Max Load
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("odometer")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Odometer (km)
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort("cost")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                >
                  Value ({settings.currency})
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow
                key={v.id}
                className="group cursor-pointer transition-colors hover:bg-muted/80"
                onClick={() => setDetailVehicle(v.id)}
              >
                <TableCell className="font-mono text-xs font-medium text-foreground">
                  {v.regNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center shrink-0">
                      {v.type === "Truck" ? (
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium text-sm text-foreground">
                      {v.model}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {v.type}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {v.region}
                  </div>
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {v.maxLoad.toLocaleString()} kg
                </TableCell>
                <TableCell>
                  <OdometerBar km={v.odometer} />
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(v.cost, settings.currency, false, settings.exchangeRate)}
                </TableCell>
                <TableCell>
                  <StatusPill value={v.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailVehicle(v.id);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {v.status !== "Available" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateVehicle(v.id, { status: "Available" });
                            toast.success(
                              `${v.regNumber} marked as Available`,
                            );
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark
                          Available
                        </DropdownMenuItem>
                      )}
                      {v.status !== "In Shop" && v.status !== "Retired" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateVehicle(v.id, { status: "In Shop" });
                            toast.success(
                              `${v.regNumber} sent to maintenance`,
                            );
                          }}
                        >
                          <Wrench className="h-3.5 w-3.5 mr-2" /> Send to Shop
                        </DropdownMenuItem>
                      )}
                      {v.status !== "Retired" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateVehicle(v.id, { status: "Retired" });
                            toast.success(`${v.regNumber} retired`);
                          }}
                          className="text-red-600"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-2" />{" "}
                          Retire Vehicle
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                    <span>No vehicles match your search or filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Vehicle Detail Sheet ── */}
      <Sheet
        open={!!detailVehicle}
        onOpenChange={(o) => !o && setDetailVehicle(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div>{detail.model}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {detail.regNumber}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 space-y-5">
                {/* Status + quick info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill value={detail.status} />
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {detail.type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    <MapPin className="h-3 w-3" />
                    {detail.region}
                  </span>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Max Load
                    </div>
                    <div className="text-lg font-semibold text-foreground mt-0.5">
                      {detail.maxLoad.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Acquisition Cost
                    </div>
                    <div className="text-lg font-semibold text-foreground mt-0.5">
                      {formatCurrency(detail.cost, settings.currency, false, settings.exchangeRate)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3 col-span-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      Odometer
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={Math.min(
                          (detail.odometer / 200000) * 100,
                          100,
                        )}
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {detail.odometer.toLocaleString()} km
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {Math.round((detail.odometer / 200000) * 100)}% of
                      200,000 km lifecycle
                    </div>
                  </div>
                </div>

                {/* Trip history */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Trip History
                  </h3>
                  {detailTrips.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3">
                      No trips recorded for this vehicle.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {detailTrips.slice(0, 10).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs"
                        >
                          <div>
                            <span className="font-medium text-foreground">
                              {t.source}
                            </span>
                            <span className="text-muted-foreground mx-1">→</span>
                            <span className="font-medium text-foreground">
                              {t.destination}
                            </span>
                          </div>
                          <StatusPill value={t.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Maintenance history */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Maintenance Log
                  </h3>
                  {detailMaint.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3">
                      No maintenance records for this vehicle.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {detailMaint.slice(0, 10).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs"
                        >
                          <div>
                            <span className="font-medium text-foreground">
                              {m.issue}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {formatCurrency(m.cost, settings.currency, false, settings.exchangeRate)}
                            </span>
                          </div>
                          <StatusPill value={m.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
