import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Available: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "On Trip": "bg-blue-100 text-blue-800 ring-blue-200",
  Dispatched: "bg-blue-100 text-blue-800 ring-blue-200",
  "In Shop": "bg-orange-100 text-orange-800 ring-orange-200",
  Open: "bg-orange-100 text-orange-800 ring-orange-200",
  Retired: "bg-slate-200 text-slate-700 ring-slate-300",
  Draft: "bg-slate-200 text-slate-700 ring-slate-300",
  Closed: "bg-slate-200 text-slate-700 ring-slate-300",
  "Off Duty": "bg-slate-200 text-slate-700 ring-slate-300",
  Completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Cancelled: "bg-red-100 text-red-800 ring-red-200",
  Suspended: "bg-red-100 text-red-800 ring-red-200",
  EXPIRED: "bg-red-100 text-red-800 ring-red-200",
};

export function StatusPill({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[value] ?? "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
    >
      {value}
    </span>
  );
}
