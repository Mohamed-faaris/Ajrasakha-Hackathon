import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { isRoleAllowedForRoute } from "@/lib/role-access";

export function RoleRoute({ route, children }: { route: string; children: ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const role = data?.user?.role as UserRole | undefined;
  if (!isRoleAllowedForRoute(role, route)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
