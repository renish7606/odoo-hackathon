import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Available: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/35",
  "On Trip": "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/35",
  Dispatched: "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/35",
  "In Shop": "bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-400/35",
  Open: "bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-400/35",
  Retired: "bg-slate-200 text-slate-800 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-100 dark:ring-slate-400/35",
  Draft: "bg-slate-200 text-slate-800 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-100 dark:ring-slate-400/35",
  Closed: "bg-slate-200 text-slate-800 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-100 dark:ring-slate-400/35",
  "Off Duty": "bg-slate-200 text-slate-800 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-100 dark:ring-slate-400/35",
  Completed: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/35",
  Cancelled: "bg-red-100 text-red-800 ring-red-200 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-400/35",
  Suspended: "bg-red-100 text-red-800 ring-red-200 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-400/35",
  EXPIRED: "bg-red-100 text-red-800 ring-red-200 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-400/35",
};

export function StatusPill({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[value] ?? "bg-muted text-foreground ring-border",
        className,
      )}
    >
      {value}
    </span>
  );
}
