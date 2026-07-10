import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type WaveRightPanelMessageKey = Extract<
  MessageKey,
  `waves.sidebar.rightPanel.${string}`
>;

export const waveRightPanelText = (
  key: WaveRightPanelMessageKey,
  params: Record<string, string | number> = {},
  locale: SupportedLocale = DEFAULT_LOCALE
): string => t(locale, key, params);
