import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, Shield, Check, Minus, Save, Building2, DollarSign, Ruler } from "lucide-react";
import { useStore, type Settings } from "@/lib/transitops-store";
import { cn } from "@/lib/utils";

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
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <Check className="h-4 w-4 stroke-[2.5]" />
      </span>
    );
  if (level === "view")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200">
        view
      </span>
    );
  return (
    <span className="text-slate-300">
      <Minus className="h-4 w-4" />
    </span>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="h-8 w-8 rounded-lg bg-slate-900 text-white grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <label className="text-sm font-medium text-slate-700 shrink-0 w-40">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SettingsPage() {
  const { settings, updateSettings } = useStore();

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
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure depot preferences and manage role-based access control.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            isDirty
              ? "bg-slate-900 text-white hover:bg-slate-700 shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
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
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition"
            placeholder="e.g. Gandhinagar Depot"
          />
        </FieldRow>

        <FieldRow label="Currency">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none"
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
            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              id="distance-unit"
              value={form.distanceUnit}
              onChange={(e) => setForm((f) => ({ ...f, distanceUnit: e.target.value as Settings["distanceUnit"] }))}
              className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition appearance-none"
            >
              <option value="Kilometer">Kilometer (km)</option>
              <option value="Mile">Mile (mi)</option>
            </select>
          </div>
        </FieldRow>
      </SectionCard>

      {/* ── Depot identity preview ── */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 text-white px-6 py-5 flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-white/10 grid place-items-center shrink-0">
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
        <p className="text-xs text-slate-500 mb-5">
          Access levels are fixed by role.&nbsp;
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><Check className="h-3 w-3" /> Full</span>
          &nbsp;= create / edit / delete&nbsp;&nbsp;·&nbsp;&nbsp;
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-200">view</span>
          &nbsp;= read-only&nbsp;&nbsp;·&nbsp;&nbsp;
          <span className="text-slate-400"><Minus className="h-3 w-3 inline" /></span>
          &nbsp;= no access
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-44">
                  Role
                </th>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacData.map((row, i) => (
                <tr
                  key={row.role}
                  className={cn(
                    "transition-colors hover:bg-slate-50/80",
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                  )}
                >
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-800">{row.role}</span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-4 text-center">
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
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {r.role}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
