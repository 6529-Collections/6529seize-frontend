import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  getStructuredApiErrorBody,
  getStructuredApiErrorCode,
} from "@/services/api/common-api";

const ADMISSION_MESSAGE_KEYS = {
  DM_RECIPIENT_NOT_ACCEPTING: "directMessageAdmission.notAccepting",
  DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY: "directMessageAdmission.peopleIFollowOnly",
  DM_RECIPIENT_GROUP_MEMBERS_ONLY: "directMessageAdmission.groupMembersOnly",
  DM_SENDER_BLOCKED_RECIPIENT: "directMessageAdmission.senderBlockedRecipient",
} as const satisfies Record<string, MessageKey>;

type AdmissionErrorCode = keyof typeof ADMISSION_MESSAGE_KEYS;

const isAdmissionErrorCode = (
  code: string | undefined
): code is AdmissionErrorCode =>
  code !== undefined && Object.hasOwn(ADMISSION_MESSAGE_KEYS, code);

const readText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

/**
 * Localized copy for a refused new direct message, built from the API's
 * stable `DM_*` code and the recipient handle. Returns undefined for any
 * other error so callers keep their existing fallback. The API never reports
 * a recipient's block, so neither does this copy.
 */
export function getDirectMessageAdmissionErrorMessage(
  locale: SupportedLocale,
  error: unknown
): string | undefined {
  const code = getStructuredApiErrorCode(error);
  if (!isAdmissionErrorCode(code)) {
    return undefined;
  }
  const body = getStructuredApiErrorBody(error);
  const handle = readText(body?.["handle"]);
  if (handle === null) {
    return undefined;
  }
  const groupName = readText(body?.["group_name"]);
  if (code === "DM_RECIPIENT_GROUP_MEMBERS_ONLY" && groupName !== null) {
    return t(locale, "directMessageAdmission.groupMembersOnlyWithGroup", {
      handle,
      groupName,
    });
  }
  return t(locale, ADMISSION_MESSAGE_KEYS[code], { handle });
}
