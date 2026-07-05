import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import type { Join6529MessageKey, JoinHref, JoinLinks } from "./page.content";

type MessageParams = Record<string, string | number>;

export const GLASS_PANEL_CLASS =
  "tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.03] tw-bg-[#0a0a0c]/40 tw-transition hover:tw-border-white/[0.08] hover:tw-bg-[#0f0f12]/60";

export const SECTION_EYEBROW_CLASS =
  "tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-white/40";

export const SECTION_HEADING_CLASS =
  "tw-text-[30px] tw-font-medium tw-leading-tight tw-tracking-tight tw-text-white sm:tw-text-[34px]";

export const m = (
  locale: SupportedLocale,
  key: Join6529MessageKey,
  params: MessageParams = {}
) => t(locale, key, params);

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const resolveHref = (href: JoinHref, links: JoinLinks): string =>
  typeof href === "function" ? href(links) : href;
