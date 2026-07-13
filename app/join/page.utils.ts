import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import type { Join6529MessageKey, JoinHref, JoinLinks } from "./page.content";

type MessageParams = Record<string, string | number>;

export const SECTION_EYEBROW_CLASS =
  "tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-500";

export const SECTION_HEADING_CLASS =
  "tw-text-[30px] tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[34px]";

export const PRIMARY_ACTION_CLASS =
  "tw-inline-flex tw-min-h-12 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-[10px] tw-border tw-border-solid tw-border-white tw-bg-white tw-px-5 tw-py-3 tw-text-sm tw-font-medium tw-text-black tw-no-underline tw-shadow-[0_0_30px_rgba(255,255,255,0.1)] tw-transition-colors hover:tw-border-gray-200 hover:tw-bg-gray-200 hover:tw-text-black hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/70 disabled:tw-cursor-not-allowed disabled:tw-opacity-70";

export const SECONDARY_ACTION_CLASS =
  "tw-inline-flex tw-min-h-12 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-[10px] tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-5 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-50 hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30";

export const TERTIARY_ACTION_CLASS =
  "tw-group/tertiary tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-whitespace-nowrap tw-border-0 tw-pb-2 tw-pt-2 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-iron-50 hover:tw-no-underline focus:tw-rounded-sm focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20";

export const TERTIARY_ACTION_LABEL_CLASS =
  "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/20 tw-pb-0.5 tw-transition-colors group-hover/tertiary:tw-border-white/60";

export const m = (
  locale: SupportedLocale,
  key: Join6529MessageKey,
  params: MessageParams = {}
) => t(locale, key, params);

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const resolveHref = (href: JoinHref, links: JoinLinks): string =>
  typeof href === "function" ? href(links) : href;
