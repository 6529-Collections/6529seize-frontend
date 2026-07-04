import type React from "react";

export type ViewKey = "waves" | "messages";

type NavIconComponent = React.ComponentType<{
  className?: string | undefined;
}>;

type RouteNavItem = {
  kind: "route";
  name: string;
  href: string;
  icon: string;
  iconComponent?: NavIconComponent | undefined;
  iconSizeClass?: string | undefined;
  disabled?: boolean | undefined;
};

type ViewNavItem = {
  kind: "view";
  name: string;
  viewKey: ViewKey;
  icon: string;
  iconComponent?: NavIconComponent | undefined;
  iconSizeClass?: string | undefined;
  disabled?: boolean | undefined;
};

export type NavItem = RouteNavItem | ViewNavItem;

export interface SidebarSection {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
  items: SidebarNavItem[];
  subsections?:
    | {
        name: string;
        items: SidebarNavItem[];
      }[]
    | undefined;
}

export interface SidebarNavItem {
  name: string;
  href: string;
  activePathPrefixes?: readonly string[] | undefined;
  activatesSection?: boolean | undefined;
}
