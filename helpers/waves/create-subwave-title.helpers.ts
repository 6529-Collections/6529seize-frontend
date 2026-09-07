import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function getCreateSubwaveTitle(
  locale: SupportedLocale,
  parentWaveName: string | null | undefined
): string {
  return parentWaveName
    ? t(locale, "waves.create.dialog.subwaveOfTitle", { parentWaveName })
    : t(locale, "waves.create.dialog.subwaveTitle");
}
