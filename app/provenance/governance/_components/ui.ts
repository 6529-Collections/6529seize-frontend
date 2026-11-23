import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import { PROVENANCE_GOVERNANCE_MESSAGES } from "@/i18n/namespaces/provenance-governance";

// Registered here so Turbopack browser bundles carry this page's copy.
void PROVENANCE_GOVERNANCE_MESSAGES;

export const locale = DEFAULT_LOCALE;

export function tr(
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  return t(locale, key, params);
}

const FOCUS =
  "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
export const CARD =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-p-5";
export const INPUT = `tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 placeholder:tw-text-iron-500 ${FOCUS}`;
export const BUTTON = `tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 hover:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${FOCUS}`;
export const PRIMARY = `tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${FOCUS}`;
export const LABEL = "tw-text-sm tw-font-medium tw-text-iron-200";
export const HINT = "tw-text-xs tw-text-iron-400";
export const MONO = "tw-break-all tw-font-mono tw-text-xs tw-text-iron-200";
export const ERROR_TEXT = "tw-m-0 tw-text-sm tw-text-error";

export const sameAddress = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();
