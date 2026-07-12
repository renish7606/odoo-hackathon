import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Role } from "@/lib/transitops-store";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "TransitOps — Sign in" }] }),
  component: AuthPage,
});

const roles: Role[] = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"];

function AuthPage() {
  const { login, logout } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Fleet Manager");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email address";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    logout();
    login({ email, role });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[oklch(0.985_0.002_90)] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-md bg-slate-900 text-white grid place-items-center">
            <Bus className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-lg font-semibold leading-none">TransitOps</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">Smart transport operations</div>
          </div>
        </div>
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">Sign in</h1>
            <p className="text-xs text-slate-500 mt-1">Role-based access to the fleet command center.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Continue</Button>
          <p className="text-[11px] text-center text-slate-500">Demo build — any valid email + 6+ char password works.</p>
        </form>
      </div>
    </div>
  );
}
