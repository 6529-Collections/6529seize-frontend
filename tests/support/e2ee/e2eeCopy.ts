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

export const SPLIT_VIEW_BANNER = E2EE_MESSAGES["e2ee.banner.splitView"];
export const NEW_DEVICE_NOTICE = e2eeMessagePattern("e2ee.devices.newDevice");
