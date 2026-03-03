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
import { BarChart3, Home, LayoutDashboard, Map, ArrowLeftRight, Bell, FileText, TrendingUp, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut as logout, useSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/lib/types";
import { isRoleAllowedForRoute } from "@/lib/role-access";
import { ProfileSection } from "@/components/ProfileSection";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Map Insights", url: "/map", icon: Map },
  { title: "Arbitrage", url: "/arbitrage", icon: ArrowLeftRight },
  { title: "Price Alerts", url: "/alerts", icon: Bell },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Profile", url: "/profile", icon: UserRound },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useSession();
  const role = data?.user?.role as UserRole | undefined;
  const { toast } = useToast();
  const visibleNavItems = navItems.filter((item) => isRoleAllowedForRoute(role, item.url));

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
              mandi-insights
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
              {visibleNavItems.map((item) => (
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
            <ProfileSection />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
