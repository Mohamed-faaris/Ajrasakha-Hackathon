import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  Palette,
} from "lucide-react";

export function ProfileSection() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const user = data?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: User, label: "Edit Profile", action: () => navigate("/profile") },
    { icon: Settings, label: "Account Settings", action: () => navigate("/settings") },
    { icon: Bell, label: "Notifications", action: () => navigate("/settings/notifications") },
    { icon: Shield, label: "Privacy & Security", action: () => navigate("/settings/security") },
    { icon: Palette, label: "Appearance", action: () => navigate("/settings/appearance") },
  ];

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 border border-sidebar-border/50 shadow-sm hover:shadow-md hover:border-sidebar-primary/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sidebar-primary/50">
            <Avatar className="h-8 w-8 ring-2 ring-sidebar-primary/20 ring-offset-1 ring-offset-sidebar-accent">
              <AvatarImage src="" alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="w-64 bg-popover/95 backdrop-blur-sm border-border/50 shadow-xl"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={item.action}
              className="cursor-pointer gap-3 py-2.5 focus:bg-accent/50"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer gap-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      className="relative px-3 pb-3 pt-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-sidebar-border/60 to-transparent"
        aria-hidden="true"
      />
      
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 opacity-20 blur-xl bg-sidebar-primary rounded-full transition-opacity duration-500"
        style={{ opacity: isHovered ? 0.3 : 0.15 }}
        aria-hidden="true"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group w-full relative flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-br from-sidebar-accent/80 via-sidebar-accent/60 to-sidebar-accent/40 border border-sidebar-border/40 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-sidebar-primary/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sidebar-primary/40"
          >
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-sidebar-primary/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <Avatar className="relative h-11 w-11 ring-2 ring-sidebar-primary/25 ring-offset-2 ring-offset-sidebar-accent/50">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-sidebar-primary via-sidebar-primary/90 to-sidebar-primary/80 text-sidebar-primary-foreground text-sm font-bold tracking-wide shadow-inner">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-sidebar-accent shadow-sm">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-sidebar-foreground truncate tracking-tight">
                  {user?.name || "User"}
                </p>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform duration-200 ${isHovered ? "translate-x-0.5" : ""}`}
                />
              </div>
              <p className="text-[11px] text-sidebar-foreground/50 truncate leading-relaxed">
                {user?.email || "user@example.com"}
              </p>
            </div>

            <div
              className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-sidebar-primary/5 to-transparent`}
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className="w-72 bg-popover/98 backdrop-blur-xl border-border/40 shadow-2xl rounded-xl overflow-hidden p-1.5"
        >
          <div className="px-2 py-3 mb-1 rounded-lg bg-gradient-to-r from-sidebar-primary/10 via-sidebar-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/30">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-border/50" />

          <div className="py-1">
            {menuItems.slice(0, 2).map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={item.action}
                className="cursor-pointer gap-3 py-2.5 px-3 rounded-lg my-0.5 focus:bg-accent/60 transition-colors"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent/50">
                  <item.icon className="h-3.5 w-3.5 text-foreground/70" />
                </div>
                <span className="text-sm">{item.label}</span>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-border/50" />

          <div className="py-1">
            {menuItems.slice(2).map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={item.action}
                className="cursor-pointer gap-3 py-2 px-3 rounded-lg my-0.5 focus:bg-accent/60 transition-colors text-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-border/50" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer gap-3 py-2.5 px-3 rounded-lg mt-1 text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-destructive/10">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
