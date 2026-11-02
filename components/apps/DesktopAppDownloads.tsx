"use client";

import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getDesktopPlatform } from "./desktopPlatform";
import styles from "./DesktopAppDownloads.module.css";
import {
  fetchDesktopAppVersions,
  type DesktopAppVersion,
  type DesktopDownload,
  type DesktopRelease,
} from "./appDownloads";

const APPS_LOCALE = DEFAULT_LOCALE;
const subscribeToPlatform = () => () => undefined;
const getServerPlatform = () => null;
const getClientPlatform = () => getDesktopPlatform(navigator);
const FOCUS =
  "focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950";

export function DesktopAppDownloads() {
  const platform = useSyncExternalStore(
    subscribeToPlatform,
    getClientPlatform,
    getServerPlatform
  );
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
          initiallyOpen={app.name === platform}
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
    <div className="tw-px-5 tw-py-4 tw-text-sm tw-text-iron-300 sm:tw-px-6">
      <output className="tw-block tw-leading-6">
        {t(
          APPS_LOCALE,
          partial ? "apps.desktop.partialError" : "apps.desktop.error"
        )}
      </output>
      <button
        type="button"
        onClick={onRetry}
        className={`tw-mt-2 tw-min-h-8 tw-min-w-11 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-text-iron-50 tw-underline tw-underline-offset-4 touch-only:tw-min-h-11 ${FOCUS}`}
      >
        {t(APPS_LOCALE, "apps.desktop.retry")}
      </button>
    </div>
  );
}

function PlatformDownloads({
  app,
  initiallyOpen,
  onRetry,
}: {
  readonly app: DesktopAppVersion;
  readonly initiallyOpen: boolean;
  readonly onRetry: () => void;
}) {
  // Native details owns expansion; this mirrors it only for focus safety while
  // the closing content is still visible during its CSS transition.
  const [contentOpen, setContentOpen] = useState(initiallyOpen);
  return (
    <details
      name="desktop-download-platform"
      open={initiallyOpen}
      onToggle={(event) => setContentOpen(event.currentTarget.open)}
      className={`${styles["disclosure"]} tw-group/platform tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10`}
    >
      <summary
        className={`tw-flex tw-min-h-[70px] tw-cursor-pointer tw-list-none tw-items-center tw-gap-3 tw-px-5 tw-py-4 hover:tw-bg-iron-900/60 sm:tw-px-6 [&::-webkit-details-marker]:tw-hidden ${FOCUS}`}
      >
        <span className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-white">
          <Image
            unoptimized
            src={app.image}
            alt=""
            width={28}
            height={28}
            className="tw-size-7 tw-object-contain"
          />
        </span>
        <span className="tw-flex-1 tw-text-base tw-font-semibold tw-text-iron-50">
          {app.displayName}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-size-4 tw-shrink-0 tw-text-iron-300 group-open/platform:tw-rotate-180 motion-safe:tw-transition-transform motion-safe:tw-duration-[180ms] motion-safe:tw-ease-out"
        />
      </summary>
      <div inert={!contentOpen}>
        <div className="tw-px-5 tw-pb-5 sm:tw-pl-[76px] sm:tw-pr-6">
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
      </div>
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
    <section className="tw-pt-3 [&+section]:tw-mt-4 [&+section]:tw-border-x-0 [&+section]:tw-border-b-0 [&+section]:tw-border-t [&+section]:tw-border-solid [&+section]:tw-border-white/10 [&+section]:tw-pt-4">
      <div className="tw-mb-1 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-50">
          {t(APPS_LOCALE, "apps.desktop.version", { version: release.version })}
        </h3>
      </div>
      {release.minimumMacOS !== undefined && (
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
      <div>
        {release.downloads.map((file) => (
          <DownloadRow
            key={file.fileName}
            app={app}
            release={release}
            file={file}
          />
        ))}
      </div>
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
    <div className="tw-grid tw-min-h-11 tw-grid-cols-1 tw-items-center tw-gap-x-6 tw-gap-y-1.5 tw-py-1.5 sm:tw-grid-cols-[minmax(8rem,1fr)_auto]">
      <div className="tw-min-w-0 tw-text-sm tw-text-iron-50">{label}</div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(APPS_LOCALE, "apps.desktop.fileDownloadAria", {
            platform: app.displayName,
            version: release.version,
            file: label,
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
            })}
            className={`tw-inline-flex tw-min-h-[30px] tw-items-center tw-rounded-md tw-text-[11px] tw-leading-4 tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-iron-50 touch-only:tw-min-h-11 ${FOCUS}`}
          >
            {t(APPS_LOCALE, "apps.desktop.mirror")}
          </a>
        )}
      </div>
    </div>
  );
}
