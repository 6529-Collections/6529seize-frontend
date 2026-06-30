import type { SidebarNavItem } from "@/components/navigation/navTypes";

export function isSidebarNavItemActive(
  item: SidebarNavItem,
  pathname: string | null
): boolean {
  return item.activatesSection !== false && pathname === item.href;
}
