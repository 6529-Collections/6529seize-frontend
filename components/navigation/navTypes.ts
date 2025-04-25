import React from "react";

export type ViewKey = "waves" | "messages";

export type RouteNavItem = {
  kind: "route";
  name: string;
  href: string;
  icon: string;
  iconComponent?: React.ComponentType<{ className?: string }>;
  iconSizeClass?: string;
  disabled?: boolean;
};

export type ViewNavItem = {
  kind: "view";
  name: string;
  viewKey: ViewKey;
  icon: string;
  iconComponent?: React.ComponentType<{ className?: string }>;
  iconSizeClass?: string;
  disabled?: boolean;
};

export type NavItem = RouteNavItem | ViewNavItem; 