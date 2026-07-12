import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, Shield, Check, Minus, Save, Building2, DollarSign, Ruler, RefreshCcw } from "lucide-react";
import { useStore, type Settings } from "@/lib/transitops-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

// ─── RBAC Matrix Data ────────────────────────────────────────────────────────

type AccessLevel = "full" | "view" | "none";

interface RbacRow {
  role: string;
  fleet: AccessLevel;
  drivers: AccessLevel;
  trips: AccessLevel;
  fuelExp: AccessLevel;
  analytics: AccessLevel;
}

const rbacData: RbacRow[] = [
  { role: "Fleet Manager",    fleet: "full", drivers: "full", trips: "none",  fuelExp: "none", analytics: "full" },
  { role: "Dispatcher",       fleet: "view", drivers: "none", trips: "full",  fuelExp: "none", analytics: "none" },
  { role: "Safety Officer",   fleet: "none", drivers: "full", trips: "view",  fuelExp: "none", analytics: "none" },
  { role: "Financial Analyst",fleet: "view", drivers: "none", trips: "none",  fuelExp: "full", analytics: "full" },
];

const columns: { key: keyof Omit<RbacRow, "role">; label: string }[] = [
  { key: "fleet",    label: "Fleet" },
  { key: "drivers",  label: "Drivers" },
  { key: "trips",    label: "Trips" },
  { key: "fuelExp",  label: "Fuel / Exp." },
  { key: "analytics",label: "Analytics" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccessBadge({ level }: { level: AccessLevel }) {
  if (level === "full")
    return (
      <span className="mx-auto inline-flex h-7 w-14 items-center justify-center rounded-full text-emerald-600 dark:text-emerald-300">
        <Check className="h-4 w-4 stroke-[2.5]" />
      </span>
    );
  if (level === "view")
    return (
      <span className="mx-auto inline-flex h-7 w-14 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-[11px] font-semibold text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200">
        view
      </span>
    );
  return (
    <span className="mx-auto inline-flex h-7 w-14 items-center justify-center rounded-full text-muted-foreground">
      <Minus className="h-4 w-4" />
    </span>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted/60">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <label className="text-sm font-medium text-foreground shrink-0 w-40">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SettingsPage() {
  const { settings, updateSettings, session } = useStore();

  const [form, setForm] = useState<Settings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const isDirty =
    form.depotName !== settings.depotName ||
    form.currency !== settings.currency ||
    form.distanceUnit !== settings.distanceUnit;

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure depot preferences and manage role-based access control.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            isDirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" /> Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* ── General Details ── */}
      <SectionCard title="General Details" icon={Settings2}>
        <FieldRow label="Depot Name">
          <input
            id="depot-name"
            type="text"
            value={form.depotName}
            onChange={(e) => setForm((f) => ({ ...f, depotName: e.target.value }))}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            placeholder="e.g. Gandhinagar Depot"
          />
        </FieldRow>

        <FieldRow label="Currency">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="w-full rounded-md border border-border bg-card pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition appearance-none"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
            </select>
          </div>
        </FieldRow>

        <FieldRow label="Distance Unit">
          <div className="relative">
            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              id="distance-unit"
              value={form.distanceUnit}
              onChange={(e) => setForm((f) => ({ ...f, distanceUnit: e.target.value as Settings["distanceUnit"] }))}
              className="w-full rounded-md border border-border bg-card pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition appearance-none"
            >
              <option value="Kilometer">Kilometer (km)</option>
              <option value="Mile">Mile (mi)</option>
            </select>
          </div>
        </FieldRow>
      </SectionCard>

      {/* ── Depot identity preview ── */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-slate-900 to-slate-700 text-white px-6 py-5 flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-card/10 grid place-items-center shrink-0">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight">{form.depotName || "—"}</div>
          <div className="text-sm text-white/60 mt-0.5">
            {form.currency} · Distance in {form.distanceUnit}s
          </div>
        </div>
        <span className="ml-auto text-[11px] uppercase tracking-widest text-white/40 font-medium">Depot Preview</span>
      </div>

      {/* ── Role-Based Access Control ── */}
      <SectionCard title="Role-Based Access Control (RBAC)" icon={Shield}>
        <p className="text-xs text-muted-foreground mb-5">
          Access levels are fixed by role.&nbsp;
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><Check className="h-3 w-3" /> Full</span>
          &nbsp;= create / edit / delete&nbsp;&nbsp;·&nbsp;&nbsp;
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/30">view</span>
          &nbsp;= read-only&nbsp;&nbsp;·&nbsp;&nbsp;
          <span className="text-muted-foreground"><Minus className="h-3 w-3 inline" /></span>
          &nbsp;= no access
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full table-fixed text-sm">
            <colgroup>
              <col className="w-56" />
              {columns.map((c) => (
                <col key={c.key} className="w-[18%]" />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="h-12 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="h-12 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rbacData.map((row, i) => (
                <tr
                  key={row.role}
                  className={cn(
                    "transition-colors hover:bg-muted/80",
                    i % 2 === 0 ? "bg-card" : "bg-muted/30",
                  )}
                >
                  <td className="h-16 px-5 align-middle">
                    <span className="font-medium text-foreground">{row.role}</span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="h-16 px-3 text-center align-middle">
                      <AccessBadge level={row[c.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Role pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {rbacData.map((r) => (
            <span
              key={r.role}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {r.role}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* ── System Processes ── */}
      <SectionCard title="System Processes" icon={RefreshCcw}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Trigger EOD Processing (Run Cron)</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Manually triggers the end-of-day background job that suspends drivers with expired licenses and logs activity.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch("http://localhost:5000/api/analytics/trigger-cron", { 
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${session?.token}`
                  }
                });
                const data = await res.json();
                
                if (data.count === 0) {
                  toast.info(data.message);
                } else {
                  toast.success(data.message);
                  setTimeout(() => window.location.reload(), 1500);
                }
              } catch (err) {
                toast.error("Failed to run cron job");
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            Run Cron Job
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
