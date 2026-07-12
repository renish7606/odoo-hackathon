import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bus,
  LayoutDashboard,
  LineChart,
  LogOut,
  Route as RouteIcon,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/transitops-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fleet", label: "Fleet", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trips", label: "Trips", icon: RouteIcon },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: LineChart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex bg-[oklch(0.985_0.002_90)] text-slate-900">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-200">
          <div className="h-8 w-8 rounded-md bg-slate-900 text-white grid place-items-center">
            <Bus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">TransitOps</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">Fleet Command</div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
          <div className="mb-2">
            <div className="font-medium text-slate-700 truncate">{session?.email}</div>
            <div className="text-[11px]">{session?.role}</div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="h-14 border-b border-slate-200 bg-white/70 backdrop-blur flex items-center justify-between px-6">
          <div className="text-sm text-slate-500">
            <span className="text-slate-900 font-medium capitalize">{pathname.split("/").pop() || "dashboard"}</span>
          </div>
          <div className="text-xs text-slate-500">{new Date().toLocaleDateString()}</div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
