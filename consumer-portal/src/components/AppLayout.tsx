import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Mandi-Insights</span>
              <span className="text-xs text-muted-foreground/50">|</span>
              <span className="text-xs text-muted-foreground/70">Agricultural Market Intelligence</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
