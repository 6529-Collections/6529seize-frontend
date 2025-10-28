import React from "react";

export type ViewKey = "waves" | "messages";

type RouteNavItem = {
  kind: "route";
  name: string;
  href: string;
  icon: string;
  iconComponent?: React.ComponentType<{ className?: string }>;
  iconSizeClass?: string;
  disabled?: boolean;
};

type ViewNavItem = {
  kind: "view";
  name: string;
  viewKey: ViewKey;
  icon: string;
  iconComponent?: React.ComponentType<{ className?: string }>;
  iconSizeClass?: string;
  disabled?: boolean;
};

export type NavItem = RouteNavItem | ViewNavItem;

// Sidebar-specific types
export interface SidebarSection {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SidebarNavItem[];
  subsections?: {
    name: string;
    items: SidebarNavItem[];
  }[];
}

interface SidebarNavItem {
  name: string;
  href: string;
}
