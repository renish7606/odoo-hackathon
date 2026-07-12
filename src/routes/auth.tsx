import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Role } from "@/lib/transitops-store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "TransitOps — Sign in" }] }),
  component: AuthPage,
});

const roles: Role[] = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

function AuthPage() {
  const { login, logout } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Fleet Manager");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLockedAlertOpen, setIsLockedAlertOpen] = useState(false);
  const [lockoutErrorMsg, setLockoutErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    } else if (!allowedEmails.includes(email.toLowerCase())) {
      nextErrors.email = "Access denied. Only registered mock users are allowed.";
    } else {
      const designatedRole = roleMapping[email.toLowerCase()];
      if (designatedRole && designatedRole !== role) {
        nextErrors.email = `Access denied. This email is designated for the '${designatedRole}' role.`;
      }
    }

    if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrors({ email: data.error || "Login failed" });
        return;
      }
      
      logout();
      login({ ...data.user, token: data.token });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setErrors({ email: "Could not connect to backend server" });
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[oklch(0.985_0.002_90)] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-md bg-card text-white grid place-items-center">
            <Bus className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-lg font-semibold leading-none">TransitOps</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">Smart transport operations</div>
          </div>
        </div>
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-base font-semibold text-foreground">Sign in</h1>
            <p className="text-xs text-muted-foreground mt-1">Role-based access to the fleet command center.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" disabled={isSubmitting} />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSubmitting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Continue</Button>
          <p className="text-[11px] text-center text-muted-foreground">Demo build — any valid email + 6+ char password works.</p>
        </form>
      </div>
      <AlertDialog open={isLockedAlertOpen} onOpenChange={setIsLockedAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              ⚠️ Account Locked
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 mt-2">
              {lockoutErrorMsg || "Your account has been locked due to too many failed login attempts."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsLockedAlertOpen(false)}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
