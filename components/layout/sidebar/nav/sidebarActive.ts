import type { SidebarNavItem } from "@/components/navigation/navTypes";

export function isSidebarNavItemActive(
  item: SidebarNavItem,
  pathname: string | null
): boolean {
  if (item.activatesSection === false || pathname === null) {
    return false;
  }

  return (
    pathname === item.href ||
    item.activePathPrefixes?.some((prefix) => pathname.startsWith(prefix)) ===
      true
  );
}
