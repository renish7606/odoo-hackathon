import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/transitops-store";
import { canAccessPage } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (!session) navigate({ to: "/auth" });
  }, [session, navigate]);
  if (!session) return null;

  const hasAccess = canAccessPage(session.role, pathname);

  return (
    <AppShell>
      {hasAccess ? (
        <Outlet />
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20 mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Your current role ({session.role}) does not have permission to view this page.
          </p>
        </div>
      )}
    </AppShell>
  );
}
