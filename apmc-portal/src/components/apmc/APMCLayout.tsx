import { useState } from "react";
import { Outlet } from "react-router-dom";
import { APMCSidebar } from "./APMCSidebar";
import { APMCTopbar } from "./APMCTopbar";

export function APMCLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <APMCSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <APMCTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
