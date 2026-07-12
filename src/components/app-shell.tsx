import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
<<<<<<< Updated upstream
import { LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench, LineChart, LogOut, Bus } from "lucide-react";
import type { ReactNode } from "react";
=======
import {
  BarChart3,
  Bus,
  CalendarClock,
  LayoutDashboard,
  LineChart,
  LogOut,
  Moon,
  Route as RouteIcon,
  Settings,
  Sun,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
>>>>>>> Stashed changes
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
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

<<<<<<< Updated upstream
=======
type ThemeMode = "dark" | "light";

>>>>>>> Stashed changes
export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { mode, toggleTheme } = useThemeMode();
  const [timestamp, setTimestamp] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setTimestamp(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const pageTitle = useMemo(() => {
    const current = pathname.split("/").filter(Boolean).pop() || "dashboard";
    return current.charAt(0).toUpperCase() + current.slice(1);
  }, [pathname]);

  const formattedTimestamp = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(timestamp),
    [timestamp],
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-muted text-foreground transition-colors duration-300 dark:bg-card ">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card/90 transition-colors duration-300 dark:border-border dark:bg-card/95">
        <div className="flex h-16 items-center gap-3 border-b border-border px-4 dark:border-border">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-card text-white dark:bg-muted dark:text-foreground">
            <Bus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none text-foreground ">TransitOps</div>
            <div className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">Fleet Command</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <n.icon className={cn("h-4 w-4 transition-colors", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border dark:border-border">
          <div className="mb-4">
            <div className="truncate text-sm font-medium text-foreground">{session?.email ?? "Not signed in"}</div>
            <div className="text-[11px] font-medium text-muted-foreground">{session?.role ?? "—"}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted focus:outline-none"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-[2px] transition-colors duration-300 dark:border-border dark:bg-card/80">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-muted dark:border-border dark:bg-card">
              <Bus className="h-4 w-4 text-foreground " />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground ">{pageTitle}</div>
              <div className="text-[11px] font-medium uppercase text-muted-foreground">TransitOps Command</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm shadow-zinc-200/60 dark:border-border dark:bg-card/80 dark:text-muted-foreground dark:shadow-black/20 sm:flex">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              {formattedTimestamp}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dashboard theme"
              aria-pressed={mode === "dark"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm shadow-zinc-200/60 transition hover:border-border hover:text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-400/40 dark:border-border dark:bg-card/80 dark:text-muted-foreground dark:shadow-black/20 dark:hover:border-border dark:hover:text-foreground dark:focus:ring-zinc-500/35"
            >
              {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {mode === "dark" ? "Dark" : "Light"}
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    persistThemeMode(mode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => (currentMode === "dark" ? "light" : "dark"));
  }, []);

  return { mode, toggleTheme };
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";

  try {
    const storedTheme = window.localStorage.getItem("transitops-theme");
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  } catch {
    return "light";
  }

  return "light";
}

function persistThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem("transitops-theme", mode);
  } catch {
    // Theme switching still works when persistence is unavailable.
  }
}
