import { useState, useCallback } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Calendar,
  Receipt,
  FileText,
  Calculator,
  UserCog,
  Settings,
  Building2,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole, useIsSuperAdmin, signOut } from "@/lib/auth";
import { usePartner } from "@/lib/partner";
import type { FeatureKey, UserRole } from "@crm/shared";

const STORAGE_KEY = "crm-sidebar-collapsed";

const navigation: {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  feature: FeatureKey;
}[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "user"], feature: "dashboard" },
  { name: "Customers", href: "/customers", icon: Users, roles: ["admin", "user"], feature: "customers" },
  { name: "Pipeline", href: "/pipeline", icon: Kanban, roles: ["admin", "user"], feature: "pipeline" },
  { name: "Meetings", href: "/meetings", icon: Calendar, roles: ["admin", "user"], feature: "meetings" },
  { name: "Invoicing", href: "/invoicing", icon: Receipt, roles: ["admin"], feature: "invoicing" },
  { name: "Quotes", href: "/quotes", icon: FileText, roles: ["admin", "user"], feature: "quotes" },
  { name: "Accounting", href: "/accounting", icon: Calculator, roles: ["admin"], feature: "accounting" },
  { name: "Lager", href: "/inventory", icon: Package, roles: ["admin", "user"], feature: "inventory" },
  { name: "Profile", href: "/profile", icon: UserCog, roles: ["admin", "user"], feature: "profile" },
];

/*
 * Sidebar state machine:
 *
 *   EXPANDED (w-64)  ←──toggle──→  COLLAPSED (w-12, icons only)
 *        ↑                                ↑
 *   localStorage "false" / missing   localStorage "true"
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const userRole = useUserRole();
  const isSuperAdmin = useIsSuperAdmin();
  const { isFeatureEnabled } = usePartner();

  const visibleNavigation = navigation.filter(
    (item) => userRole && item.roles.includes(userRole) && isFeatureEnabled(item.feature)
  );

  const navLinkClass = (isActive: boolean) =>
    cn(
      "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
      collapsed ? "justify-center" : "gap-3 px-3",
      isActive
        ? "bg-sidebar-accent text-sidebar-foreground"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
    );

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-12" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        {!collapsed && (
          <h1 className="flex-1 text-lg font-semibold text-sidebar-foreground">CRM</h1>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Öppna meny" : "Stäng meny"}
          className={cn(
            "rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
            collapsed && "w-full flex justify-center"
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-1 py-3", collapsed ? "px-1" : "px-3")}>
        {visibleNavigation.map((item) => {
          const isActive =
            item.href === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={navLinkClass(isActive)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.name}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            <Link
              to="/settings"
              title={collapsed ? "Settings" : undefined}
              className={navLinkClass(currentPath.startsWith("/settings"))}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && "Settings"}
            </Link>
            <Link
              to="/partners"
              title={collapsed ? "Partners" : undefined}
              className={navLinkClass(currentPath.startsWith("/partners"))}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              {!collapsed && "Partners"}
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border py-3", collapsed ? "px-1" : "px-3")}>
        <button
          onClick={() => signOut()}
          title={collapsed ? "Logga ut" : undefined}
          className={cn(
            "flex w-full items-center rounded-md py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
            collapsed ? "justify-center" : "gap-3 px-3"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
