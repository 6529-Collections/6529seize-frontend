"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  fetchDesktopAppVersions,
  getDesktopAppDownloadUrl,
  type DesktopAppVersion,
} from "./appDownloads";

const APPS_LOCALE = DEFAULT_LOCALE;

export function DesktopAppDownloads() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["desktop-app-versions"],
    queryFn: ({ signal }) => fetchDesktopAppVersions(signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return (
      <div className="tw-grid tw-gap-3">
        <output className="tw-sr-only">
          {t(APPS_LOCALE, "apps.desktop.loading")}
        </output>
        {["windows", "mac", "linux"].map((platform) => (
          <div
            key={platform}
            aria-hidden="true"
            className="tw-h-[74px] tw-animate-pulse tw-rounded-lg tw-bg-iron-800/70"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        role="alert"
        className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-5"
      >
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(APPS_LOCALE, "apps.desktop.error")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="tw-mt-4 tw-min-h-10 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 hover:tw-bg-iron-700 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
        >
          {t(APPS_LOCALE, "apps.desktop.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="tw-grid tw-gap-3">
      {data.map((app) => (
        <DesktopAppDownload key={app.name} app={app} />
      ))}
    </div>
  );
}

function DesktopAppDownload({ app }: { readonly app: DesktopAppVersion }) {
  return (
    <a
      href={getDesktopAppDownloadUrl(app)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t(APPS_LOCALE, "apps.desktop.downloadAriaLabel", {
        platform: app.displayName,
        version: app.version,
      })}
      className="tw-group tw-flex tw-min-h-[74px] tw-items-center tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-p-4 !tw-no-underline tw-transition tw-duration-200 tw-ease-out hover:tw-border-primary-400/60 hover:tw-bg-[#050b1e] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
    >
      <span className="tw-flex tw-size-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
        <Image
          unoptimized
          src={app.image}
          alt=""
          width={28}
          height={28}
          className="tw-size-7 tw-object-contain"
        />
      </span>
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-base tw-font-semibold tw-text-iron-50">
          {app.displayName}
        </span>
        <span className="tw-block tw-text-sm tw-text-iron-400">
          {t(APPS_LOCALE, "apps.desktop.version", { version: app.version })}
        </span>
      </span>
      <ArrowTopRightOnSquareIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-none tw-text-iron-500 tw-transition group-hover:-tw-translate-y-0.5 group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300"
      />
    </a>
  );
}
