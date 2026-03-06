import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Upload,
  History,
  Building2,
  Settings,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APMC_ROUTES } from "@/lib/routes";

const navItems = [
  { title: "Dashboard", path: APMC_ROUTES.dashboard, icon: LayoutDashboard },
  { title: "Submit Price", path: APMC_ROUTES.submitPrice, icon: FileText },
  { title: "Bulk Upload", path: APMC_ROUTES.bulkUpload, icon: Upload },
  { title: "History", path: APMC_ROUTES.history, icon: History },
  { title: "Profile", path: APMC_ROUTES.profile, icon: Building2 },
  { title: "Settings", path: APMC_ROUTES.settings, icon: Settings },
];

interface APMCSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function APMCSidebar({ open, onClose }: APMCSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wheat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-heading text-sidebar-foreground">mandi-insights</h1>
            <p className="text-[10px] text-sidebar-foreground/60">Integration Hub</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.path === APMC_ROUTES.dashboard
                ? location.pathname === APMC_ROUTES.dashboard || location.pathname === `${APMC_ROUTES.dashboard}/`
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-5 py-3">
          <p className="text-[10px] text-sidebar-foreground/40">v1.0.0 · APMC Integration</p>
        </div>
      </aside>
    </>
  );
}
