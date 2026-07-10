import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type WaveRightPanelMessageKey = Extract<
  MessageKey,
  `waves.sidebar.rightPanel.${string}`
>;

export const waveRightPanelText = (
  key: WaveRightPanelMessageKey,
  params: Record<string, string | number> = {}
): string => t(DEFAULT_LOCALE, key, params);
