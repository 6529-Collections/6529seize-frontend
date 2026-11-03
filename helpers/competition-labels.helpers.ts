import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

const CONFIG_LABELS: Readonly<Record<string, MessageKey>> = {
  TDH: "competitions.credit.TDH",
  REP: "competitions.credit.REP",
  CIC: "competitions.credit.CIC",
  XTDH: "competitions.credit.XTDH",
  TDH_PLUS_XTDH: "competitions.credit.TDH_PLUS_XTDH",
  CARD_SET_TDH: "competitions.credit.CARD_SET_TDH",
  WAVE: "competitions.scope.WAVE",
  DROP: "competitions.scope.DROP",
  AUTOMATIC: "competitions.outcome.AUTOMATIC",
  MANUAL: "competitions.outcome.MANUAL",
  IMAGE: "competitions.media.IMAGE",
  VIDEO: "competitions.media.VIDEO",
  AUDIO: "competitions.media.AUDIO",
  STRING: "competitions.metadata.STRING",
  NUMBER: "competitions.metadata.NUMBER",
};

export function getCompetitionConfigLabel(
  locale: SupportedLocale,
  value: string | null
): string {
  if (value === null) return "";
  const key = CONFIG_LABELS[value];
  return key ? t(locale, key) : value;
}
