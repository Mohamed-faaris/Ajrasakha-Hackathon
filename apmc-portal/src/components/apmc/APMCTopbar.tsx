import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface APMCTopbarProps {
  onMenuClick: () => void;
  mandiName?: string;
}

export function APMCTopbar({ onMenuClick, mandiName = "Azadpur Mandi" }: APMCTopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold font-heading">{mandiName}</h2>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </header>
  );
}
