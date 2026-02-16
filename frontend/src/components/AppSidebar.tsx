import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BarChart3, Home, LayoutDashboard, Map, ArrowLeftRight, FileText, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, useSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Map Insights", url: "/map", icon: Map },
  { title: "Arbitrage", url: "/arbitrage", icon: ArrowLeftRight },
  { title: "Reports", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useSession();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <TrendingUp className="h-7 w-7 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground leading-tight">
              Mandi-Insights
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 leading-none">
              Unified APMC Data Hub
            </p>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-4 py-3 space-y-2">
              <div className={`rounded-lg bg-sidebar-accent/50 p-3 ${collapsed ? "hidden" : ""}`}>
                <p className="text-[11px] text-sidebar-foreground/70 leading-snug">
                  {data?.user?.email || "Signed in user"}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {!collapsed ? "Sign Out" : ""}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
