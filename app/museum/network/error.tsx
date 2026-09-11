"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function MuseumNetworkError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("Museum network route failed", error);
  }, [error]);

  return (
    <main className="tailwind-scope tw-flex tw-min-h-[60vh] tw-items-center tw-bg-iron-950 tw-px-4 tw-py-12 sm:tw-px-6">
      <div className="tw-mx-auto tw-w-full tw-max-w-xl tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900 tw-p-6 tw-text-center">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-white">
          {t(DEFAULT_LOCALE, "museum.network.error.title")}
        </h1>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.error.description")}
        </p>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-justify-center tw-gap-3">
          <button
            type="button"
            onClick={reset}
            className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
          >
            {t(DEFAULT_LOCALE, "museum.network.error.retry")}
          </button>
          <Link
            href="/museum/network"
            className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline hover:tw-border-white/30 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
          >
            {t(DEFAULT_LOCALE, "museum.network.notFound.back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
