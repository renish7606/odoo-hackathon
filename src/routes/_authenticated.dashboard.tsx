import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Banknote,
  BusFront,
  CheckCircle2,
  Clock3,
  Fuel,
  Gauge,
  RefreshCw,
  Route as RouteIcon,
  UsersRound,
  Wrench,
  Filter,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useStore, VehicleType, VehicleStatus, Vehicle } from "@/lib/transitops-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type RegionStats = {
  region: string;
  fleetUtilizationPercentage: number;
  totalOperationalCost: number;
  avgROI: number;
};

type AnalyticsData = {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPercentage: number;
  totalOperationalCost: number;
  overallFuelEfficiency: number;
  regionalData: RegionStats[];
};

type Tone = "emerald" | "amber" | "cyan" | "teal" | "rose" | "zinc";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: Tone;
  size?: "large" | "compact";
};

type TooltipPayload = {
  dataKey?: string;
  value?: number;
  color?: string;
  name?: string;
};

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const toneClasses: Record<
  Tone,
  {
    dot: string;
    icon: string;
    ring: string;
    hoverBorder: string;
  }
> = {
  emerald: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    icon: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    ring: "group-hover:ring-emerald-500/20 dark:group-hover:ring-emerald-400/25",
    hoverBorder: "group-hover:border-emerald-500/30 dark:group-hover:border-emerald-400/25",
  },
  amber: {
    dot: "bg-amber-500 dark:bg-amber-400",
    icon: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    ring: "group-hover:ring-amber-500/20 dark:group-hover:ring-amber-400/25",
    hoverBorder: "group-hover:border-amber-500/30 dark:group-hover:border-amber-400/25",
  },
  cyan: {
    dot: "bg-cyan-500 dark:bg-cyan-400",
    icon: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
    ring: "group-hover:ring-cyan-500/20 dark:group-hover:ring-cyan-400/25",
    hoverBorder: "group-hover:border-cyan-500/30 dark:group-hover:border-cyan-400/25",
  },
  teal: {
    dot: "bg-teal-500 dark:bg-teal-400",
    icon: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
    ring: "group-hover:ring-teal-500/20 dark:group-hover:ring-teal-400/25",
    hoverBorder: "group-hover:border-teal-500/30 dark:group-hover:border-teal-400/25",
  },
  rose: {
    dot: "bg-rose-500 dark:bg-rose-400",
    icon: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    ring: "group-hover:ring-rose-500/20 dark:group-hover:ring-rose-400/25",
    hoverBorder: "group-hover:border-rose-500/30 dark:group-hover:border-rose-400/25",
  },
  zinc: {
    dot: "bg-zinc-500 dark:bg-zinc-400",
    icon: "group-hover:text-foreground dark:group-hover:text-foreground",
    ring: "group-hover:ring-zinc-500/20 dark:group-hover:ring-zinc-300/20",
    hoverBorder: "group-hover:border-zinc-400/50 dark:group-hover:border-zinc-600",
  },
};

function Dashboard() {
  const [vehicleType, setVehicleType] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [region, setRegion] = useState<string>("All");

  const { data, error, isLoading, refetch } = useAnalytics({ vehicleType, status, region });

  return (
    <div className="min-h-[calc(100vh-6.5rem)]">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Live Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground ">
            Operations Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-muted-foreground">
            A focused command view for fleet availability, trip velocity, staffing, and operational cost pressure.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mr-2">Filters</span>
          </div>
          
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger className="w-[160px] bg-card text-foreground">
              <SelectValue placeholder="Vehicle Type: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Vehicle Type: All</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px] bg-card text-foreground">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[160px] bg-card text-foreground">
              <SelectValue placeholder="Region: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Region: All</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading && error ? <AnalyticsError message={error} onRetry={refetch} /> : null}

      {!isLoading && !error && data ? <DashboardContent data={data} /> : null}
    </div>
  );
}

function useAnalytics(filters: { vehicleType: string; status: string; region: string }) {
  const { vehicles, trips, drivers, maintenance, expenses, vehicleROI, settings } = useStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 1. Filter Vehicles
      let filteredVehicles = vehicles;
      if (filters.vehicleType !== "All") {
        filteredVehicles = filteredVehicles.filter((v) => v.type === filters.vehicleType);
      }
      if (filters.status !== "All") {
        filteredVehicles = filteredVehicles.filter((v) => v.status === filters.status);
      }
      if (filters.region !== "All") {
        filteredVehicles = filteredVehicles.filter((v) => v.region === filters.region);
      }

      const vehicleIds = new Set(filteredVehicles.map((v) => v.id));

      // 2. Filter related data based on filtered vehicles
      const filteredTrips = trips.filter((t) => vehicleIds.has(t.vehicleId));
      const filteredMaintenance = maintenance.filter((m) => vehicleIds.has(m.vehicleId));
      const filteredExpenses = expenses.filter((e) => vehicleIds.has(e.vehicleId));

      // Global drivers count (could also filter by active trips' drivers)
      // We will count drivers that are assigned to active trips for these vehicles, 
      // or just all available if no filter applied to make it realistic.
      // Let's just show all active drivers who are available or on our filtered trips.
      const activeTripDriverIds = new Set(filteredTrips.map(t => t.driverId));
      const availableDriversCount = drivers.filter(d => 
        d.status === "Available" || (d.status === "On Trip" && activeTripDriverIds.has(d.id))
      ).length;

      const activeVehiclesCount = filteredVehicles.filter(v => v.status !== "Retired").length;
      const availableVehiclesCount = filteredVehicles.filter(v => v.status === "Available").length;
      const vehiclesInMaintenanceCount = filteredVehicles.filter(v => v.status === "In Shop").length;
      const onTripVehiclesCount = filteredVehicles.filter(v => v.status === "On Trip").length;
      
      const fleetUtilizationPercentage = activeVehiclesCount > 0 ? (onTripVehiclesCount / activeVehiclesCount) * 100 : 0;
      
      const activeTripsCount = filteredTrips.filter(t => t.status === "Dispatched").length;
      const pendingTripsCount = filteredTrips.filter(t => t.status === "Draft").length;
      
      const totalOperationalCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0) +
        filteredMaintenance.reduce((sum, m) => sum + m.cost, 0);

      const totalDistance = filteredTrips.filter(t => t.status === "Completed").reduce((sum, t) => sum + t.distance, 0);
      const totalLiters = filteredExpenses.filter(e => e.kind === "Fuel Log" && e.liters).reduce((sum, e) => sum + (e.liters || 0), 0);
      const overallFuelEfficiency = totalLiters > 0 ? totalDistance / totalLiters : 0;

      // Group by Region for the graph
      const regionsMap = new Map<string, { active: number; onTrip: number; cost: number }>();
      const allRegions = ["North", "South", "East", "West"];
      
      // Initialize map based on filter
      if (filters.region !== "All") {
        regionsMap.set(filters.region, { active: 0, onTrip: 0, cost: 0 });
      } else {
        allRegions.forEach(r => regionsMap.set(r, { active: 0, onTrip: 0, cost: 0 }));
      }

      // Calculate per-region metrics
      filteredVehicles.forEach((v) => {
        if (!regionsMap.has(v.region)) return;
        const rm = regionsMap.get(v.region)!;
        if (v.status !== "Retired") rm.active += 1;
        if (v.status === "On Trip") rm.onTrip += 1;
      });

      filteredExpenses.forEach((e) => {
        const v = filteredVehicles.find(v => v.id === e.vehicleId);
        if (v && regionsMap.has(v.region)) {
          regionsMap.get(v.region)!.cost += e.amount;
        }
      });
      filteredMaintenance.forEach((m) => {
        const v = filteredVehicles.find(v => v.id === m.vehicleId);
        if (v && regionsMap.has(v.region)) {
          regionsMap.get(v.region)!.cost += m.cost;
        }
      });

      const regionalData: RegionStats[] = Array.from(regionsMap.entries()).map(([reg, stat]) => ({
        region: reg,
        fleetUtilizationPercentage: stat.active > 0 ? (stat.onTrip / stat.active) * 100 : 0,
        totalOperationalCost: stat.cost
      }));

      setData({
        activeVehicles: activeVehiclesCount,
        availableVehicles: availableVehiclesCount,
        vehiclesInMaintenance: vehiclesInMaintenanceCount,
        activeTrips: activeTripsCount,
        pendingTrips: pendingTripsCount,
        driversOnDuty: availableDriversCount,
        fleetUtilizationPercentage,
        totalOperationalCost,
        overallFuelEfficiency,
        regionalData,
      });
      setError(null);
    } catch (e) {
      setError("Failed to compute analytics.");
    }
  }, [vehicles, trips, drivers, maintenance, expenses, filters.vehicleType, filters.status, filters.region]);

  return {
    data,
    error,
    isLoading: false,
    refetch: () => {},
  };
}

function DashboardContent({ data }: { data: AnalyticsData }) {
  const { settings } = useStore();
  const primaryMetrics: MetricCardProps[] = [
    {
      label: "Fleet Utilization",
      value: `${percentFormatter.format(data.fleetUtilizationPercentage)}%`,
      detail: "Network capacity in motion",
      icon: Gauge,
      tone: "emerald",
      size: "large",
    },
    {
      label: "Active Trips",
      value: integerFormatter.format(data.activeTrips),
      detail: "Live routes in service",
      icon: RouteIcon,
      tone: "teal",
      size: "large",
    },
    {
      label: "Active Vehicles",
      value: integerFormatter.format(data.activeVehicles),
      detail: "Vehicles currently deployed",
      icon: BusFront,
      tone: "cyan",
      size: "large",
    },
  ];

  const secondaryMetrics: MetricCardProps[] = [
    {
      label: "Available Vehicles",
      value: integerFormatter.format(data.availableVehicles),
      detail: "Ready for dispatch",
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      label: "Vehicles in Maintenance",
      value: integerFormatter.format(data.vehiclesInMaintenance),
      detail: "Held for service",
      icon: Wrench,
      tone: "amber",
    },
    {
      label: "Pending Trips",
      value: integerFormatter.format(data.pendingTrips),
      detail: "Awaiting assignment",
      icon: Clock3,
      tone: "rose",
    },
    {
      label: "Drivers On Duty",
      value: integerFormatter.format(data.driversOnDuty),
      detail: "Crew currently rostered",
      icon: UsersRound,
      tone: "zinc",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        {primaryMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {secondaryMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <OperationalChart data={data} />
      <DashboardBottomRow />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  size = "compact",
}: MetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-md border bg-card/[0.86] shadow-sm shadow-zinc-200/70 backdrop-blur-[2px] transition duration-200 dark:bg-card/[0.72] dark:shadow-black/20",
        "border-border dark:border-border",
        styles.hoverBorder,
        size === "large" ? "min-h-56 p-6 sm:p-7" : "min-h-40 p-5",
      )}
    >
      <div
        className={cn(
          "absolute right-5 top-5 h-10 w-10 rounded-full ring-1 ring-transparent transition duration-200",
          styles.ring,
        )}
        aria-hidden
      />

      <div className="relative flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <span className={cn("mt-2 h-2 w-2 rounded-full", styles.dot)} aria-hidden />
          <Icon
            className={cn(
              "h-5 w-5 text-muted-foreground transition-colors duration-200 dark:text-muted-foreground",
              styles.icon,
            )}
            aria-hidden
          />
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-3 font-bold tracking-tight text-foreground",
              size === "large" ? "text-6xl lg:text-7xl" : "text-5xl",
            )}
          >
            {value}
          </p>
          <p className="mt-3 text-sm text-muted-foreground dark:text-muted-foreground">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function OperationalChart({ data }: { data: AnalyticsData }) {
  const { settings } = useStore();
  return (
    <section className="rounded-md border border-border bg-card/[0.86] p-5 shadow-sm shadow-zinc-200/70 backdrop-blur-[2px] dark:border-border dark:bg-card/[0.72] dark:shadow-black/20 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Regional Operations Curve</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-foreground ">
            Fleet Utilization and Operational Cost by Region
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChartStat
            icon={Banknote}
            label="Total Operational Cost"
            value={formatCurrency(data.totalOperationalCost, settings.currency, false, settings.exchangeRate)}
            tone="amber"
          />
          <ChartStat
            icon={Fuel}
            label="Overall Fuel Efficiency"
            value={`${decimalFormatter.format(data.overallFuelEfficiency)} km/L`}
            tone="emerald"
          />
        </div>
      </div>

      <div className="mt-8 h-[400px] text-muted-foreground dark:text-muted-foreground">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.regionalData} barGap={12} margin={{ top: 20, right: 18, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="region"
              axisLine={false}
              tickLine={false}
              tickMargin={14}
              tick={{ fill: "currentColor", fontSize: 13, fontWeight: 500 }}
            />
            <YAxis
              yAxisId="utilization"
              orientation="left"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <YAxis
              yAxisId="cost"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tickFormatter={(value) => formatCurrency(Number(value), settings.currency, true, settings.exchangeRate)}
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} 
              content={<OperationalTooltip />} 
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              yAxisId="utilization"
              dataKey="fleetUtilizationPercentage"
              name="Utilization (%)"
              fill="var(--color-primary)"
              radius={[6, 6, 0, 0]}
              barSize={40}
            />
            <Bar
              yAxisId="cost"
              dataKey="totalOperationalCost"
              name={`Op. Cost (${settings.currency})`}
              fill="var(--color-chart-1)"
              radius={[6, 6, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ChartStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
}) {
  const styles = toneClasses[tone];

  return (
    <div className="group flex min-w-52 items-center gap-3 rounded-md border border-border bg-muted px-4 py-3 transition dark:border-border dark:bg-card/40">
      <Icon
        className={cn("h-4 w-4 text-muted-foreground transition-colors dark:text-muted-foreground", styles.icon)}
        aria-hidden
      />
      <div>
        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold text-foreground ">{value}</p>
      </div>
    </div>
  );
}

function OperationalTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  const { settings } = useStore();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 text-sm shadow-xl shadow-zinc-200/70 dark:border-border dark:bg-card dark:shadow-black/30">
      <p className="font-semibold text-foreground mb-3">{label} Region</p>
      <div className="space-y-2 text-muted-foreground dark:text-muted-foreground">
        {payload.map((entry, index) => (
          <TooltipRow
            key={index}
            color={entry.color || "bg-primary"}
            label={entry.name || ""}
            value={
              entry.dataKey === "fleetUtilizationPercentage" 
                ? `${percentFormatter.format(entry.value || 0)}%` 
                : formatCurrency(entry.value || 0, settings.currency, false, settings.exchangeRate)
            }
          />
        ))}
      </div>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        {label}
      </span>
      <span className="font-semibold text-foreground ">{value}</span>
    </div>
  );
}


function DashboardBottomRow() {
  const { trips, vehicles, drivers, settings } = useStore();

  const recentTrips = useMemo(() => {
    return [...trips]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((t) => {
        const vehicle = vehicles.find((v) => v.id === t.vehicleId);
        const driver = drivers.find((d) => d.id === t.driverId);
        
        let eta = "—";
        if (t.status === "On Trip") eta = "45 min";
        if (t.status === "Dispatched") eta = "1h 10m";
        if (t.status === "Draft") eta = "Awaiting vehicle";

        return {
          id: t.id,
          vehicle: vehicle ? vehicle.regNumber : "—",
          driver: driver ? driver.name : "—",
          status: t.status,
          eta,
        };
      });
  }, [trips, vehicles, drivers]);

  const vehicleStatusCounts = useMemo(() => {
    return vehicles.reduce(
      (acc, v) => {
        if (v.status === "Available") acc.available++;
        if (v.status === "On Trip") acc.onTrip++;
        if (v.status === "In Shop") acc.inShop++;
        if (v.status === "Retired") acc.retired++;
        return acc;
      },
      { available: 0, onTrip: 0, inShop: 0, retired: 0 }
    );
  }, [vehicles]);

  const totalVehicles = vehicles.length || 1; // avoid division by zero

  const statusColors = {
    "Available": "bg-emerald-500",
    "On Trip": "bg-blue-500",
    "In Shop": "bg-amber-600",
    "Retired": "bg-rose-400",
    "Completed": "bg-emerald-600",
    "Dispatched": "bg-blue-400",
    "Draft": "bg-zinc-500",
  };

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {/* Recent Trips Table */}
      <div className="lg:col-span-2 rounded-md border border-border bg-card/[0.86] p-5 shadow-sm shadow-zinc-200/70 backdrop-blur-[2px] dark:border-border dark:bg-card/[0.72] dark:shadow-black/20 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-widest uppercase text-muted-foreground">Recent Trips</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border/50 text-xs tracking-wider text-muted-foreground">
                <th className="pb-3 font-medium">TRIP</th>
                <th className="pb-3 font-medium">VEHICLE</th>
                <th className="pb-3 font-medium">DRIVER</th>
                <th className="pb-3 font-medium">STATUS</th>
                <th className="pb-3 font-medium text-right">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recentTrips.map((trip) => (
                <tr key={trip.id} className="text-foreground transition-colors hover:bg-muted/30">
                  <td className="py-4 font-medium">{trip.id.substring(0, 8)}...</td>
                  <td className="py-4">{trip.vehicle}</td>
                  <td className="py-4">{trip.driver}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm ${statusColors[trip.status as keyof typeof statusColors] || "bg-zinc-500"}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="py-4 text-right text-muted-foreground">{trip.eta}</td>
                </tr>
              ))}
              {recentTrips.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No recent trips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Status Progress Bars */}
      <div className="rounded-md border border-border bg-card/[0.86] p-5 shadow-sm shadow-zinc-200/70 backdrop-blur-[2px] dark:border-border dark:bg-card/[0.72] dark:shadow-black/20 sm:p-6">
        <h2 className="mb-6 text-sm font-semibold tracking-widest uppercase text-muted-foreground">Vehicle Status</h2>
        <div className="space-y-6">
          <StatusRow label="Available" count={vehicleStatusCounts.available} total={totalVehicles} color="bg-emerald-500" />
          <StatusRow label="On Trip" count={vehicleStatusCounts.onTrip} total={totalVehicles} color="bg-blue-500" />
          <StatusRow label="In Shop" count={vehicleStatusCounts.inShop} total={totalVehicles} color="bg-amber-600" />
          <StatusRow label="Retired" count={vehicleStatusCounts.retired} total={totalVehicles} color="bg-rose-400" />
        </div>
      </div>
    </section>
  );
}

function StatusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = Math.round((count / total) * 100) || 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60 dark:bg-card/60 ring-1 ring-inset ring-border/50">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading dashboard analytics">
      <section className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} size="large" />
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} size="compact" />
        ))}
      </section>

      <section className="rounded-md border border-border bg-card/[0.86] p-5 shadow-sm shadow-zinc-200/70 dark:border-border dark:bg-card/[0.72] dark:shadow-black/20 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-card" />
            <div className="h-7 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-card" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-16 w-52 animate-pulse rounded-md bg-zinc-200 dark:bg-card" />
            <div className="h-16 w-52 animate-pulse rounded-md bg-zinc-200 dark:bg-card" />
          </div>
        </div>
        <div className="mt-8 h-72 animate-pulse rounded-md bg-muted dark:bg-card/70" />
      </section>
    </div>
  );
}

function SkeletonCard({ size }: { size: "large" | "compact" }) {
  return (
    <article
      className={cn(
        "rounded-md border border-border bg-card/[0.86] p-5 shadow-sm shadow-zinc-200/70 dark:border-border dark:bg-card/[0.72] dark:shadow-black/20",
        size === "large" ? "min-h-56 sm:p-7" : "min-h-40",
      )}
    >
      <div className="flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between">
          <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-200 dark:bg-card" />
          <div className="h-5 w-5 animate-pulse rounded bg-zinc-200 dark:bg-card" />
        </div>
        <div>
          <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-card" />
          <div
            className={cn(
              "mt-4 animate-pulse rounded bg-zinc-200 dark:bg-card",
              size === "large" ? "h-14 w-40" : "h-10 w-24",
            )}
          />
          <div className="mt-4 h-4 w-44 animate-pulse rounded bg-zinc-200 dark:bg-card" />
        </div>
      </div>
    </article>
  );
}

function AnalyticsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[520px] place-items-center">
      <div className="max-w-md rounded-md border border-border bg-card p-8 text-center shadow-sm shadow-zinc-200/70 dark:border-border dark:bg-card dark:shadow-black/20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-normal text-foreground ">
          Analytics Unavailable
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-white transition hover:bg-card focus:outline-none focus:ring-2 focus:ring-zinc-400/40 dark:border-border dark:bg-muted dark:text-foreground dark:hover:bg-zinc-200"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      </div>
    </div>
  );
}

function isAnalyticsData(value: unknown): value is AnalyticsData {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Record<keyof AnalyticsData, unknown>>;

  return (
    isFiniteNumber(candidate.activeVehicles) &&
    isFiniteNumber(candidate.availableVehicles) &&
    isFiniteNumber(candidate.vehiclesInMaintenance) &&
    isFiniteNumber(candidate.activeTrips) &&
    isFiniteNumber(candidate.pendingTrips) &&
    isFiniteNumber(candidate.driversOnDuty) &&
    isFiniteNumber(candidate.fleetUtilizationPercentage) &&
    isFiniteNumber(candidate.totalOperationalCost) &&
    isFiniteNumber(candidate.overallFuelEfficiency)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
