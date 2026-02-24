"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AccreditationProvider } from "@/contexts/accreditation-context";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <AccreditationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </AccreditationProvider>
  );
}
