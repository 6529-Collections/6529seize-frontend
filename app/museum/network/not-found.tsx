import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function MuseumNetworkNotFound() {
  return (
    <main className="tailwind-scope tw-flex tw-min-h-[60vh] tw-items-center tw-bg-iron-950 tw-px-4 tw-py-12 sm:tw-px-6">
      <div className="tw-mx-auto tw-w-full tw-max-w-xl tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900 tw-p-6 tw-text-center">
        <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white">
          {t(DEFAULT_LOCALE, "museum.network.notFound.title")}
        </h1>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.notFound.description")}
        </p>
        <Link
          href="/museum/network"
          className="tw-mt-6 tw-inline-flex tw-min-h-10 tw-items-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
        >
          {t(DEFAULT_LOCALE, "museum.network.notFound.back")}
        </Link>
      </div>
    </main>
  );
}
