import { E2EE_MESSAGES } from "../../../i18n/messages/e2ee";

/**
 * Encrypted-messages copy shared by Jest and the Playwright packs, read from
 * the en-US source dictionary so a copy change updates both at once.
 */

type E2eeMessageKey = keyof typeof E2EE_MESSAGES;

const escapeRegExp = (value: string) =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);

/** Matches a message template anywhere in a text; `{params}` match any text. */
export function e2eeMessagePattern(key: E2eeMessageKey): RegExp {
  const parts = E2EE_MESSAGES[key].split(/\{\w+\}/u).map(escapeRegExp);
  return new RegExp(parts.join(".+"), "u");
}

/** One message with its `{params}` filled in, as the app renders it. */
export function e2eeMessage(
  key: E2eeMessageKey,
  params: Readonly<Record<string, string>> = {}
): string {
  return E2EE_MESSAGES[key].replaceAll(
    /\{(\w+)\}/gu,
    (match, name: string) => params[name] ?? match
  );
}

/** Matches exactly one of the given messages (a whole accessible name). */
export function e2eeExactMessages(...keys: readonly E2eeMessageKey[]): RegExp {
  return new RegExp(
    `^(?:${keys.map((key) => escapeRegExp(E2EE_MESSAGES[key])).join("|")})$`,
    "u"
  );
}

export const SPLIT_VIEW_BANNER = E2EE_MESSAGES["e2ee.banner.splitView"];

/** The setup card point about history living on devices (and backup). */
export const NO_BACKUP_WARNING = E2EE_MESSAGES["e2ee.enroll.point.noBackup"];
/** The same point in the 6529 app. */
export const NO_BACKUP_WARNING_APP =
  E2EE_MESSAGES["e2ee.enroll.point.noBackupApp"];
export const NEW_DEVICE_NOTICE = e2eeMessagePattern("e2ee.devices.newDevice");
