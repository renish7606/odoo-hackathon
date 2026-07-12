import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/transitops-store";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session, isHydratingAuth } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isHydratingAuth && !session) navigate({ to: "/auth" });
  }, [session, isHydratingAuth, navigate]);
  if (isHydratingAuth || !session) return null;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
