import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success border-success/30",
  Approved: "bg-success/15 text-success border-success/30",
  Success: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Processing: "bg-info/15 text-info border-info/30",
  Delayed: "bg-accent/15 text-accent border-accent/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Failed: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
