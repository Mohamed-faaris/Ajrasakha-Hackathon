import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accentColor?: "primary" | "secondary" | "accent" | "success" | "warning" | "info";
}

const accentBorders: Record<string, string> = {
  primary: "border-l-primary",
  secondary: "border-l-secondary",
  accent: "border-l-accent",
  success: "border-l-success",
  warning: "border-l-warning",
  info: "border-l-info",
};

const iconBgs: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function StatCard({ title, value, icon: Icon, description, accentColor = "primary" }: StatCardProps) {
  return (
    <Card className={cn("border-l-4 shadow-sm", accentBorders[accentColor])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-heading tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("rounded-lg p-2.5", iconBgs[accentColor])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
