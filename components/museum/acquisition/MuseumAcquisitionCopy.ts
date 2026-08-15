import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function museumAcquisitionWorkCountLabel(workCount: number): string {
  return t(
    DEFAULT_LOCALE,
    workCount === 1
      ? "museum.network.acquisitions.worksCount.one"
      : "museum.network.acquisitions.worksCount.other",
    { count: formatInteger(DEFAULT_LOCALE, workCount) }
  );
}
