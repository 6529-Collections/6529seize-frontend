"use client";

import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  fetchDesktopAppVersions,
  type DesktopAppVersion,
  type DesktopDownload,
  type DesktopRelease,
} from "./appDownloads";

const APPS_LOCALE = DEFAULT_LOCALE;
const FOCUS =
  "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950";

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
      <div className="tw-grid tw-gap-3 tw-px-5 tw-pb-5 sm:tw-px-6">
        <output className="tw-sr-only">
          {t(APPS_LOCALE, "apps.desktop.loading")}
        </output>
        {["windows", "mac", "linux"].map((platform) => (
          <div
            key={platform}
            aria-hidden="true"
            className="tw-h-[70px] tw-animate-pulse tw-rounded-lg tw-bg-iron-800/70 motion-reduce:tw-animate-none"
          />
        ))}
      </div>
    );
  }
  if (!data) return <DownloadError onRetry={() => void refetch()} />;

  return (
    <div>
      {isError && <DownloadError partial onRetry={() => void refetch()} />}
      {data.map((app) => (
        <PlatformDownloads
          key={app.name}
          app={app}
          onRetry={() => void refetch()}
        />
      ))}
    </div>
  );
}

function DownloadError({
  onRetry,
  partial = false,
}: {
  readonly onRetry: () => void;
  readonly partial?: boolean;
}) {
  return (
    <div
      role="status"
      className="tw-px-5 tw-py-4 tw-text-sm tw-text-iron-300 sm:tw-px-6"
    >
      <p className="tw-m-0 tw-leading-6">
        {t(
          APPS_LOCALE,
          partial ? "apps.desktop.partialError" : "apps.desktop.error"
        )}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={`tw-mt-2 tw-min-h-8 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-text-iron-50 tw-underline tw-underline-offset-4 ${FOCUS}`}
      >
        {t(APPS_LOCALE, "apps.desktop.retry")}
      </button>
    </div>
  );
}

function PlatformDownloads({
  app,
  onRetry,
}: {
  readonly app: DesktopAppVersion;
  readonly onRetry: () => void;
}) {
  return (
    <details
      name="desktop-download-platform"
      open={app.name === "mac"}
      className="tw-group/platform tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10"
    >
      <summary
        className={`tw-flex tw-min-h-[70px] tw-cursor-pointer tw-list-none tw-items-center tw-gap-3 tw-px-5 tw-py-4 hover:tw-bg-iron-900/60 sm:tw-px-6 [&::-webkit-details-marker]:tw-hidden ${FOCUS}`}
      >
        <span className="tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-white">
          <Image
            unoptimized
            src={app.image}
            alt=""
            width={24}
            height={24}
            className="tw-size-6 tw-object-contain"
          />
        </span>
        <span className="tw-flex-1 tw-text-base tw-font-semibold tw-text-iron-50">
          {app.displayName}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-size-4 tw-shrink-0 tw-text-iron-300 group-open/platform:tw-rotate-180"
        />
      </summary>
      <div className="tw-px-5 tw-pb-5 sm:tw-pl-[68px] sm:tw-pr-6">
        {app.releases.map((release) => (
          <ReleaseDownloads
            key={`${release.version}-${release.legacyMac}`}
            app={app}
            release={release}
          />
        ))}
      </div>
      {app.hasUnavailableRelease && (
        <DownloadError partial={app.releases.length > 0} onRetry={onRetry} />
      )}
    </details>
  );
}

function ReleaseDownloads({
  app,
  release,
}: {
  readonly app: DesktopAppVersion;
  readonly release: DesktopRelease;
}) {
  return (
    <section className="tw-pt-4 [&+section]:tw-mt-4 [&+section]:tw-border-x-0 [&+section]:tw-border-b-0 [&+section]:tw-border-t [&+section]:tw-border-solid [&+section]:tw-border-white/15 [&+section]:tw-pt-5">
      <div className="tw-mb-1 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-50">
          {t(APPS_LOCALE, "apps.desktop.version", { version: release.version })}
        </h3>
        {release.legacyMac && (
          <span className="tw-rounded-md tw-border tw-border-solid tw-border-white/20 tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-xs tw-text-iron-200">
            {t(APPS_LOCALE, "apps.desktop.legacyMac")}
          </span>
        )}
      </div>
      {release.minimumMacOS && (
        <p className="tw-mb-2 tw-mt-0 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(
            APPS_LOCALE,
            release.legacyMac
              ? "apps.desktop.mac12Requirement"
              : "apps.desktop.macRequirement",
            { version: release.minimumMacOS }
          )}
        </p>
      )}
      {app.name === "linux" && (
        <p className="tw-mb-2 tw-mt-0 tw-text-xs tw-text-iron-300">
          {t(APPS_LOCALE, "apps.desktop.file.x64")}
        </p>
      )}
      {release.downloads.map((file) => (
        <DownloadRow
          key={file.fileName}
          app={app}
          release={release}
          file={file}
        />
      ))}
      {release.legacyMac && (
        <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(APPS_LOCALE, "apps.desktop.macRecovery", {
            version: release.version,
          })}
        </p>
      )}
    </section>
  );
}

function DownloadRow({
  app,
  release,
  file,
}: {
  readonly app: DesktopAppVersion;
  readonly release: DesktopRelease;
  readonly file: DesktopDownload;
}) {
  const label = t(APPS_LOCALE, `apps.desktop.file.${file.label}`);
  return (
    <div className="tw-flex tw-min-h-14 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 tw-py-2 [&+div]:tw-border-x-0 [&+div]:tw-border-b-0 [&+div]:tw-border-t [&+div]:tw-border-solid [&+div]:tw-border-white/10">
      <div className="tw-min-w-0 tw-text-sm tw-text-iron-50">
        {label}
        <span className="tw-ml-2 tw-text-xs tw-text-iron-300">
          {file.format}
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(APPS_LOCALE, "apps.desktop.fileDownloadAria", {
            platform: app.displayName,
            version: release.version,
            file: label,
            format: file.format,
          })}
          className={`tw-inline-flex tw-min-h-[30px] tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-iron-100 tw-bg-iron-100 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-leading-[18px] tw-text-iron-950 tw-no-underline hover:tw-bg-white touch-only:tw-min-h-11 ${FOCUS}`}
        >
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-3" />
          {t(APPS_LOCALE, "apps.desktop.download")}
        </a>
        {file.arweaveUrl && (
          <a
            href={file.arweaveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(APPS_LOCALE, "apps.desktop.mirrorAria", {
              platform: app.displayName,
              version: release.version,
              file: label,
              format: file.format,
            })}
            className={`tw-inline-flex tw-min-h-[30px] tw-items-center tw-rounded-md tw-text-xs tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-iron-50 touch-only:tw-min-h-11 ${FOCUS}`}
          >
            {t(APPS_LOCALE, "apps.desktop.mirror")}
          </a>
        )}
      </div>
    </div>
  );
}
