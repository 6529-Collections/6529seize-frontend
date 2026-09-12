import type { SupportedLocale } from "@/i18n/locales";
import { ApiModerationAction } from "@/generated/models/ApiModerationAction";
import { t, type MessageKey } from "@/i18n/messages";
import type { ModerationCheckFilters } from "@/services/api/moderation-checks-api";

export const CHECK_FILTER_OPTIONS = {
  subject_type: ["REP_CATEGORY", "PROFILE_BIO", "GROUP_NAME", "DROP"],
  outcome: ["ALLOW", "REJECT", "ERROR", "PENDING"],
  policy_family: ["PUBLIC_FIELDS", "WAVE_CONTENT"],
  review_status: ["NEEDS_REVIEW", "REVIEWED"],
  trigger: [
    "PUBLIC_FIELD",
    "KNOWN_SAFE_PERSONAL_NAME",
    "PROFILE_SUSPENDED",
    "MANUAL_OVERRIDE",
    "REPEATED_IDENTICAL_CONTENT",
    "STRUCTURED_SENSITIVE_DATA",
    "EXPLICIT_THREAT_PATTERN",
    "SEXUAL_EXPLOITATION_PATTERN",
    "KNOWN_MALICIOUS_DESTINATION",
    "CONTENT_REPORTED",
    "DEVELOPER_REEVALUATION",
    "NO_SIGNAL",
  ],
} as const;

const VALUE_KEYS: Record<string, MessageKey> = {
  CREATE: "checks.operation.CREATE",
  UPDATE: "checks.operation.UPDATE",
  SAVE: "checks.operation.SAVE",
  CLASSIFY: "checks.operation.CLASSIFY",
  PROFILE_STATUS: "checks.profileStatus",
  PUBLIC_FIELD: "checks.trigger.PUBLIC_FIELD",
  KNOWN_SAFE_PERSONAL_NAME: "checks.trigger.KNOWN_SAFE_PERSONAL_NAME",
  PROFILE_SUSPENDED: "checks.trigger.PROFILE_SUSPENDED",
  MANUAL_OVERRIDE: "checks.trigger.MANUAL_OVERRIDE",
  REPEATED_IDENTICAL_CONTENT: "checks.trigger.REPEATED_IDENTICAL_CONTENT",
  STRUCTURED_SENSITIVE_DATA: "checks.trigger.STRUCTURED_SENSITIVE_DATA",
  EXPLICIT_THREAT_PATTERN: "checks.trigger.EXPLICIT_THREAT_PATTERN",
  SEXUAL_EXPLOITATION_PATTERN: "checks.trigger.SEXUAL_EXPLOITATION_PATTERN",
  KNOWN_MALICIOUS_DESTINATION: "checks.trigger.KNOWN_MALICIOUS_DESTINATION",
  CONTENT_REPORTED: "checks.trigger.CONTENT_REPORTED",
  DEVELOPER_REEVALUATION: "checks.trigger.DEVELOPER_REEVALUATION",
  NO_SIGNAL: "checks.trigger.NO_SIGNAL",
  REP_CATEGORY: "checks.subject.REP_CATEGORY",
  PROFILE_BIO: "checks.subject.PROFILE_BIO",
  GROUP_NAME: "checks.subject.GROUP_NAME",
  DROP: "checks.subject.DROP",
  ALLOW: "checks.outcome.ALLOW",
  REJECT: "checks.outcome.REJECT",
  ERROR: "checks.outcome.ERROR",
  PENDING: "checks.outcome.PENDING",
  PUBLIC_FIELDS: "checks.policy.PUBLIC_FIELDS",
  WAVE_CONTENT: "checks.policy.WAVE_CONTENT",
  NEEDS_REVIEW: "checks.review.NEEDS_REVIEW",
  REVIEWED: "checks.review.REVIEWED",
  SUBMISSION: "checks.trigger.SUBMISSION",
  REPORT: "checks.trigger.REPORT",
  REEVALUATION: "checks.trigger.REEVALUATION",
  CACHE: "checks.trigger.CACHE",
  SUSPENSION: "checks.trigger.SUSPENSION",
};
export function checkValueLabel(
  locale: SupportedLocale,
  value: string
): string {
  const key = VALUE_KEYS[value];
  return key ? t(locale, key) : value;
}

export function safeCheckId(value: string | null): string | null {
  return value && /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : null;
}

export function checkAuditActionLabel(
  locale: SupportedLocale,
  value: string
): string {
  const action = Object.values(ApiModerationAction).find(
    (candidate) => String(candidate) === value
  );
  return action === undefined ? value : t(locale, `checks.action.${action}`);
}

export function readCheckFilters(
  params: Pick<URLSearchParams, "get">
): ModerationCheckFilters {
  const values: Record<string, string | number> = {};
  for (const [key, options] of Object.entries(CHECK_FILTER_OPTIONS)) {
    const value = params.get(key);
    if (value && (options as readonly string[]).includes(value))
      values[key] = value;
  }
  for (const key of ["profile_id", "subject_id"] as const) {
    const value = safeCheckId(params.get(key));
    if (value) values[key] = value;
  }
  for (const key of ["from", "to"] as const) {
    const value = params.get(key);
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
    const timestamp = Date.parse(
      `${value}T${key === "from" ? "00:00:00.000" : "23:59:59.999"}Z`
    );
    if (Number.isFinite(timestamp)) values[key] = timestamp;
  }
  return values as ModerationCheckFilters;
}

export function navigateChecks(params: URLSearchParams): void {
  const search = params.toString();
  const suffix = search ? "?" + search : "";
  globalThis.history.pushState(null, "", `/content-moderation/checks${suffix}`);
}

export const checkControlClass =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-opacity-50";
export const checkButtonClass =
  "tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50";
