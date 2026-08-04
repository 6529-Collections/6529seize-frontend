import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function MuseumLegacyEntryPoint() {
  return (
    <aside className="tailwind-scope tw-border-b tw-border-white/10 tw-bg-iron-950 tw-px-4 tw-py-5 sm:tw-px-6">
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-6xl tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.legacy.entryEyebrow")}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-text-white">
            {t(DEFAULT_LOCALE, "museum.network.legacy.entryTitle")}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.legacy.entryDescription")}
          </p>
        </div>
        <Link
          href="/museum/network"
          className="tw-inline-flex tw-min-h-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
        >
          {t(DEFAULT_LOCALE, "museum.network.legacy.entryAction")}
        </Link>
      </div>
    </aside>
  );
}
