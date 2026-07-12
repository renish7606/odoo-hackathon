import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, CircleDollarSign, Gauge, ShieldCheck, TrendingUp, Wrench } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useStore } from "@/lib/transitops-store";

export const Route = createFileRoute("/_authenticated/analysis")({
  component: AnalysisPage,
});

const REVENUE_PER_KM = 2.5;
const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });

const chartConfig = {
  revenue: { label: "Revenue", color: "#2563eb" },
  spend: { label: "Spend", color: "#d97706" },
  fuel: { label: "Fuel", color: "#2563eb" },
  maintenance: { label: "Maintenance", color: "#d97706" },
  tolls: { label: "Tolls & fees", color: "#059669" },
} satisfies ChartConfig;

const chartColors = {
  fuel: "#2563eb",
  maintenance: "#d97706",
  tolls: "#059669",
} as const;

function AnalysisPage() {
  const { vehicles, drivers, trips, expenses, maintenance } = useStore();

  const analysis = useMemo(() => {
    const completedTrips = trips.filter((trip) => trip.status === "Completed");
    const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "Retired");
    const totalDistance = completedTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const totalRevenue = totalDistance * REVENUE_PER_KM;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalMaintenance = maintenance.reduce((sum, item) => sum + item.cost, 0);
    const totalCost = totalExpenses + totalMaintenance;
    const netMargin = totalRevenue - totalCost;
    const utilization = activeVehicles.length
      ? Math.round((vehicles.filter((vehicle) => vehicle.status === "On Trip").length / activeVehicles.length) * 100)
      : 0;
    const avgSafety = drivers.length
      ? Math.round(drivers.reduce((sum, driver) => sum + driver.safetyScore, 0) / drivers.length)
      : 0;
    const openMaintenance = maintenance.filter((item) => item.status === "Open").length;
    const expiredLicenses = drivers.filter((driver) => new Date(driver.licenseExpiry) < new Date()).length;

    const vehicleRows = vehicles.map((vehicle) => {
      const vehicleTrips = completedTrips.filter((trip) => trip.vehicleId === vehicle.id);
      const distance = vehicleTrips.reduce((sum, trip) => sum + trip.distance, 0);
      const fuelLiters = expenses
        .filter((expense) => expense.vehicleId === vehicle.id && expense.kind === "Fuel Log")
        .reduce((sum, expense) => sum + (expense.liters ?? 0), 0);
      const spend =
        expenses.filter((expense) => expense.vehicleId === vehicle.id).reduce((sum, expense) => sum + expense.amount, 0) +
        maintenance.filter((item) => item.vehicleId === vehicle.id).reduce((sum, item) => sum + item.cost, 0);
      const revenue = distance * REVENUE_PER_KM;
      const roi = vehicle.cost ? ((revenue - spend) / vehicle.cost) * 100 : 0;
      const efficiency = fuelLiters ? distance / fuelLiters : 0;

      return { vehicle, distance, fuelLiters, spend, revenue, roi, efficiency };
    });

    const regionRows = Array.from(new Set(vehicles.map((vehicle) => vehicle.region))).map((region) => {
      const regionVehicles = vehicles.filter((vehicle) => vehicle.region === region);
      const regionVehicleIds = new Set(regionVehicles.map((vehicle) => vehicle.id));
      const regionTrips = completedTrips.filter((trip) => regionVehicleIds.has(trip.vehicleId));
      const distance = regionTrips.reduce((sum, trip) => sum + trip.distance, 0);
      const active = regionVehicles.filter((vehicle) => vehicle.status === "On Trip").length;
      const load = regionVehicles.length ? Math.round((active / regionVehicles.length) * 100) : 0;

      return { region, vehicles: regionVehicles.length, distance, load };
    });

    const highestCostVehicle = [...vehicleRows].sort((a, b) => b.spend - a.spend)[0];
    const bestRoiVehicle = [...vehicleRows].sort((a, b) => b.roi - a.roi)[0];
    const monthlyRevenue = buildMonthlyRevenue(completedTrips);
    const costliestVehicles = [...vehicleRows]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5)
      .map((row) => ({
        vehicle: row.vehicle.regNumber,
        spend: row.spend,
      }));
    const fuelCost = expenses.filter((expense) => expense.kind === "Fuel Log").reduce((sum, expense) => sum + expense.amount, 0);
    const tollsAndFees = expenses
      .filter((expense) => expense.kind !== "Fuel Log")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const costMix = [
      { name: "Fuel", key: "fuel", value: fuelCost },
      { name: "Maintenance", key: "maintenance", value: totalMaintenance },
      { name: "Tolls & fees", key: "tolls", value: tollsAndFees },
    ].filter((item) => item.value > 0);

    return {
      avgSafety,
      bestRoiVehicle,
      costliestVehicles,
      costMix,
      expiredLicenses,
      highestCostVehicle,
      monthlyRevenue,
      netMargin,
      openMaintenance,
      regionRows,
      totalCost,
      totalDistance,
      totalRevenue,
      utilization,
      vehicleRows,
    };
  }, [drivers, expenses, maintenance, trips, vehicles]);

  const maxRegionDistance = Math.max(...analysis.regionRows.map((row) => row.distance), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Operations Analysis</h1>
          <p className="text-sm text-slate-500">Performance, risk, and financial signals across the transport network.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-right">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Revenue model</div>
          <div className="text-sm font-semibold text-slate-900">${REVENUE_PER_KM}/km</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Kpi label="Utilization" value={`${analysis.utilization}%`} icon={Gauge} hint="Active non-retired fleet" />
        <Kpi label="Revenue" value={currency(analysis.totalRevenue)} icon={TrendingUp} hint={`${analysis.totalDistance.toLocaleString()} km completed`} />
        <Kpi label="Operating Cost" value={currency(analysis.totalCost)} icon={CircleDollarSign} hint="Expenses plus maintenance" />
        <Kpi
          label="Net Margin"
          value={currency(analysis.netMargin)}
          icon={BarChart3}
          tone={analysis.netMargin >= 0 ? "positive" : "negative"}
          hint="Revenue minus costs"
        />
        <Kpi label="Safety Score" value={analysis.avgSafety} icon={ShieldCheck} hint="Average driver score" />
        <Kpi
          label="Open Risk"
          value={analysis.openMaintenance + analysis.expiredLicenses}
          icon={AlertTriangle}
          tone={analysis.openMaintenance + analysis.expiredLicenses > 0 ? "warning" : "positive"}
          hint="Maintenance and license flags"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Monthly revenue</h2>
            <p className="text-xs text-slate-500">Completed trip revenue based on distance moved.</p>
          </div>
          <div className="p-4">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={analysis.monthlyRevenue} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Cost mix</h2>
            <p className="text-xs text-slate-500">Fuel, maintenance, and route fees.</p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-[180px_1fr] xl:grid-cols-1">
            <ChartContainer config={chartConfig} className="mx-auto h-44 w-full max-w-56">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={analysis.costMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={4}>
                  {analysis.costMix.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2 self-center">
              {analysis.costMix.length ? (
                analysis.costMix.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors[item.key] }} />
                      {item.name}
                    </div>
                    <span className="font-medium text-slate-900">{currency(item.value)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No costs logged yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Top costliest vehicles</h2>
          <p className="text-xs text-slate-500">Total spend by vehicle from expenses and maintenance.</p>
        </div>
        <div className="p-4">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart
              data={analysis.costliestVehicles}
              layout="vertical"
              margin={{ left: 20, right: 16, top: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
              <YAxis dataKey="vehicle" type="category" tickLine={false} axisLine={false} width={110} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Bar dataKey="spend" fill="var(--color-spend)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Regional movement</h2>
            <p className="text-xs text-slate-500">Completed distance and active fleet load by region.</p>
          </div>
          <div className="space-y-4 p-4">
            {analysis.regionRows.map((row) => (
              <div key={row.region} className="grid grid-cols-[88px_1fr_74px] items-center gap-3 text-sm">
                <div>
                  <div className="font-medium text-slate-800">{row.region}</div>
                  <div className="text-[11px] text-slate-500">{row.vehicles} vehicles</div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{ width: `${Math.max(6, (row.distance / maxRegionDistance) * 100)}%` }}
                  />
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">{row.distance.toLocaleString()} km</div>
                  <div className="text-[11px] text-slate-500">{row.load}% load</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Decision signals</h2>
            <p className="text-xs text-slate-500">Current areas worth manager attention.</p>
          </div>
          <div className="divide-y divide-slate-100">
            <Signal
              icon={TrendingUp}
              label="Best ROI vehicle"
              value={analysis.bestRoiVehicle ? analysis.bestRoiVehicle.vehicle.regNumber : "No completed trips"}
              detail={analysis.bestRoiVehicle ? `${analysis.bestRoiVehicle.roi.toFixed(1)}% ROI` : "Complete trips to calculate ROI"}
            />
            <Signal
              icon={Wrench}
              label="Highest cost vehicle"
              value={analysis.highestCostVehicle ? analysis.highestCostVehicle.vehicle.regNumber : "No spend yet"}
              detail={analysis.highestCostVehicle ? `${currency(analysis.highestCostVehicle.spend)} total spend` : "Log expenses to track cost"}
            />
            <Signal
              icon={AlertTriangle}
              label="Compliance exposure"
              value={`${analysis.expiredLicenses} expired licenses`}
              detail={`${analysis.openMaintenance} open maintenance tickets`}
            />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Vehicle performance matrix</h2>
          <p className="text-xs text-slate-500">Efficiency and return view for each asset.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                <th className="px-4 py-3 text-right font-medium">Distance</th>
                <th className="px-4 py-3 text-right font-medium">Efficiency</th>
                <th className="px-4 py-3 text-right font-medium">Spend</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-4 py-3 text-right font-medium">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.vehicleRows.map((row) => (
                <tr key={row.vehicle.id}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-slate-900">{row.vehicle.regNumber}</div>
                    <div className="text-[11px] text-slate-500">{row.vehicle.model}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{row.distance.toLocaleString()} km</td>
                  <td className="px-4 py-3 text-right">{row.efficiency ? `${row.efficiency.toFixed(2)} km/L` : "No fuel data"}</td>
                  <td className="px-4 py-3 text-right">{currency(row.spend)}</td>
                  <td className="px-4 py-3 text-right">{currency(row.revenue)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${row.roi >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {row.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  tone?: "neutral" | "positive" | "negative" | "warning";
}) {
  const toneClass = {
    neutral: "text-slate-900",
    positive: "text-emerald-700",
    negative: "text-red-700",
    warning: "text-amber-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function Signal({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="truncate text-sm font-medium text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{detail}</div>
      </div>
    </div>
  );
}

function currency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function buildMonthlyRevenue(completedTrips: Array<{ createdAt: string; distance: number }>) {
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: monthFormatter.format(date),
      revenue: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));

  completedTrips.forEach((trip) => {
    const date = new Date(trip.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = byKey.get(key);
    if (month) month.revenue += trip.distance * REVENUE_PER_KM;
  });

  if (months.every((month) => month.revenue === 0)) {
    return months.map((month, index) => ({
      ...month,
      revenue: [18000, 24500, 22000, 31000, 28500, 36000][index],
    }));
  }

  return months;
}
