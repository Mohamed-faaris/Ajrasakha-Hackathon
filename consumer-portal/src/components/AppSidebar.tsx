import { useEffect, useMemo, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
import { BarChart3, Home, LayoutDashboard, Map, ArrowLeftRight, Bell, FileText, TrendingUp, UserRound, Key } from "lucide-react";
import { useSession } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { isRoleAllowedForRoute } from "@/lib/role-access";
import { ProfileSection } from "@/components/ProfileSection";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Map Insights", url: "/map", icon: Map },
  { title: "Arbitrage", url: "/arbitrage", icon: ArrowLeftRight },
  { title: "Price Alerts", url: "/price-alerts", icon: Bell },
  { title: "API Docs", url: "/api-docs", icon: Key },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Profile", url: "/profile", icon: UserRound },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data } = useSession();
  const sessionRole = data?.user?.role as UserRole | undefined;
  const [profileRole, setProfileRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (sessionRole) {
      setProfileRole(undefined);
      return () => {
        cancelled = true;
      };
    }

    api
      .getMyProfile()
      .then((profile) => {
        if (!cancelled) {
          setProfileRole((profile?.role as UserRole | null | undefined) ?? undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfileRole(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionRole]);

  const role = sessionRole ?? profileRole;
  const visibleNavItems = navItems.filter((item) => isRoleAllowedForRoute(role, item.url));
  const roleLabel = useMemo(() => {
    const resolvedRole = role || "farmer";
    return resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1);
  }, [role]);

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
            <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wide">
              Role: {roleLabel}
            </Badge>
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
