import type { FC } from "react";

export type IconType = FC<{ className?: string }>;

export type ViewKey = "waves" | "messages";

export type RouteNavItem = {
  kind: "route";
  name: string;
  href: string;
  Icon?: IconType;
  image?: string;
};

export type ViewNavItem = {
  kind: "view";
  name: string;
  viewKey: ViewKey;
  Icon?: IconType;
  image?: string;
};

export type NavItem = RouteNavItem | ViewNavItem; 