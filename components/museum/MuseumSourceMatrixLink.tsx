import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function MuseumSourceMatrixLink() {
  return (
    <Link
      href="/museum/network/stories/source-and-chronology"
      className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      {t(DEFAULT_LOCALE, "museum.network.research.readSourceMatrix")}
    </Link>
  );
}
