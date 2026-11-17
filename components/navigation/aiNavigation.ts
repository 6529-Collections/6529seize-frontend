import { CpuChipIcon } from "@heroicons/react/24/outline";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/**
 * 6529 AI's row in the menus and the page search: after the validator's
 * slot, where 6529's own software sits, and for everyone, as its pages
 * are public.
 */
export const AI_NAVIGATION = {
  href: "/ai",
  label: t(DEFAULT_LOCALE, "navigation.primary.ai"),
  icon: CpuChipIcon,
} as const;

/** Whether the path is one of 6529 AI's pages. */
export function isAiNavigationActive(pathname: string): boolean {
  return pathname === "/ai" || pathname.startsWith("/ai/");
}
