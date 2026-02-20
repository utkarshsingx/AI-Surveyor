"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShieldCheck,
  ScanSearch,
  FileCheck2,
  ClipboardList,
  FolderOpen,
  FileText,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Manage Accreditation", href: "/accreditations", icon: ShieldCheck },
  { name: "AI Assessment", href: "/assessment", icon: ScanSearch },
  { name: "Gap Analysis", href: "/gap-analysis", icon: FileCheck2 },
  { name: "Survey Workspace", href: "/survey", icon: ClipboardList },
  { name: "Evidence Library", href: "/evidence", icon: FolderOpen },
  { name: "Policies & Documents", href: "/policies", icon: FileText },
  { name: "AI Co-Pilot", href: "/copilot", icon: Bot },
];

const adminNavigation = [
  { name: "Admin Panel", href: "/admin", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex flex-col border-r bg-white transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <div className="flex h-16 items-center border-b px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  AI Surveyor
                </span>
                <span className="text-[10px] text-muted-foreground">
                  by AccrePro
                </span>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 py-4">
          <div className="space-y-1 px-3">
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Main
              </p>
            )}
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              const linkContent = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1 px-3">
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </p>
            )}
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);

              const linkContent = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
