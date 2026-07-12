const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated.dashboard.tsx', 'utf8');

const newComponents = `
function DashboardBottomRow() {
  const { trips, vehicles, drivers } = useStore();

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
                    <span className={\`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm \${statusColors[trip.status as keyof typeof statusColors] || "bg-zinc-500"}\`}>
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
          className={\`h-full rounded-full transition-all duration-500 \${color}\`}
          style={{ width: \`\${percentage}%\` }}
        />
      </div>
    </div>
  );
}
`;

// Insert the new components before OperationalChart or after DashboardSkeleton
if (!content.includes('function DashboardBottomRow')) {
  content = content.replace('function DashboardSkeleton() {', newComponents + '\nfunction DashboardSkeleton() {');
}

// Add <DashboardBottomRow /> inside DashboardContent below OperationalChart
if (!content.includes('<DashboardBottomRow />')) {
  content = content.replace(
    '<OperationalChart data={data} />\n    </div>',
    '<OperationalChart data={data} />\n      <DashboardBottomRow />\n    </div>'
  );
}

fs.writeFileSync('src/routes/_authenticated.dashboard.tsx', content);
console.log('Added DashboardBottomRow');
