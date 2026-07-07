import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type MessageParams = Record<string, string | number>;

export function waveNotificationSettingsMessage(
  key: MessageKey,
  params: MessageParams = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}

export function formatWaveNotificationSettingsInteger(value: number): string {
  return formatInteger(DEFAULT_LOCALE, value);
}
