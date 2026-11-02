import { HUB_HREF } from "@/components/explained/shell/chapters";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { SidebarNavItem } from "./navTypes";

/**
 * 6529 Explained's door in the navigation (MAP.md §1.1): one entry,
 * defined once. Today the About flyout lists it first, above its groups,
 * and the Network & Reputation rows stay as deep links. To move it to the
 * main menu later, a primary section lists this same entry; nothing about
 * the entry changes.
 */
export function explainedNavItem(): SidebarNavItem {
  return {
    name: t(DEFAULT_LOCALE, "explained.kit.map.hub"),
    href: HUB_HREF,
    activePathPrefixes: [`${HUB_HREF}/`],
  };
}
