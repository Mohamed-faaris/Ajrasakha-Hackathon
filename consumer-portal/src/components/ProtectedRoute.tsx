import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (data?.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
