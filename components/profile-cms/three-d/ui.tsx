import Image from "next/image";

import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getProfileCmsAssetProxyUrl } from "@/lib/profile-cms/runtime/mediaProxy";
import type { CmsThreeDStatus } from "@/components/profile-cms/three-d/types";

export function CmsThreeDOverlay({
  config,
  isMobileFallback,
  locale,
  onStart,
  progress,
  status,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly isMobileFallback: boolean;
  readonly locale: SupportedLocale;
  readonly onStart: () => void;
  readonly progress: number;
  readonly status: CmsThreeDStatus;
}) {
  return (
    <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black">
      <CmsThreeDPoster poster={config.poster} />
      <div className="tw-relative tw-z-10 tw-mx-4 tw-max-w-xl tw-bg-black/80 tw-p-5 tw-text-center">
        <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          {getCmsThreeDEyebrow(config, locale)}
        </p>
        <h3 className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
          {config.title}
        </h3>
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {getCmsThreeDDescription({ config, isMobileFallback, locale })}
        </p>
        <CmsThreeDStatusMessages
          hasBudgetWarning={hasCmsThreeDBudgetWarning(config)}
          locale={locale}
          status={status}
        />
        <CmsThreeDStartControl
          config={config}
          isMobileFallback={isMobileFallback}
          locale={locale}
          onStart={onStart}
          progress={progress}
          status={status}
        />
      </div>
    </div>
  );
}

function CmsThreeDPoster({
  poster,
}: {
  readonly poster: CmsThreeDViewerConfig["poster"];
}) {
  return poster?.url ? (
    <Image
      alt={poster.alt}
      className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover tw-opacity-70"
      fill
      loading="lazy"
      sizes="100vw"
      src={getProfileCmsAssetProxyUrl(poster.url)}
      unoptimized
    />
  ) : null;
}

function CmsThreeDStatusMessages({
  hasBudgetWarning,
  locale,
  status,
}: {
  readonly hasBudgetWarning: boolean;
  readonly locale: SupportedLocale;
  readonly status: CmsThreeDStatus;
}) {
  return (
    <>
      {hasBudgetWarning ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-amber-300">
          {t(locale, "profileCms.interactive.budgetWarning")}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-red">
          {t(locale, "profileCms.interactive.loadError")}
        </p>
      ) : null}
    </>
  );
}

function CmsThreeDStartControl({
  config,
  isMobileFallback,
  locale,
  onStart,
  progress,
  status,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly isMobileFallback: boolean;
  readonly locale: SupportedLocale;
  readonly onStart: () => void;
  readonly progress: number;
  readonly status: CmsThreeDStatus;
}) {
  if (isMobileFallback) {
    return null;
  }

  return (
    <button
      className="tw-mt-5 tw-min-h-11 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-70"
      disabled={status === "loading"}
      onClick={onStart}
      type="button"
    >
      {getCmsThreeDStartLabel({ config, locale, progress, status })}
    </button>
  );
}

export function CmsThreeDFullscreenControl({
  isFullscreen,
  locale,
  onToggle,
}: {
  readonly isFullscreen: boolean;
  readonly locale: SupportedLocale;
  readonly onToggle: () => void;
}) {
  const label = t(
    locale,
    isFullscreen
      ? "profileCms.interactive.exitFullscreen"
      : "profileCms.interactive.fullscreen"
  );

  return (
    <button
      aria-label={label}
      aria-pressed={isFullscreen}
      className="tw-absolute tw-right-4 tw-top-4 tw-z-30 tw-inline-flex tw-min-h-10 tw-max-w-[calc(100%-2rem)] tw-items-center tw-justify-center tw-border tw-border-white/15 tw-bg-black/55 tw-px-3 tw-text-center tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-white tw-backdrop-blur-md tw-transition hover:tw-border-white/35 hover:tw-text-primary-300"
      onClick={onToggle}
      type="button"
    >
      {label}
    </button>
  );
}

function getCmsThreeDEyebrow(
  config: CmsThreeDViewerConfig,
  locale: SupportedLocale
): string {
  if (config.kind === "room") {
    return t(locale, "profileCms.interactive.room.title");
  }

  return t(locale, "profileCms.interactive.object.title");
}

function getCmsThreeDDescription({
  config,
  isMobileFallback,
  locale,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly isMobileFallback: boolean;
  readonly locale: SupportedLocale;
}): string {
  if (isMobileFallback) {
    return t(locale, "profileCms.interactive.mobileFallback");
  }

  return config.description;
}

function getCmsThreeDStartLabel({
  config,
  locale,
  progress,
  status,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly locale: SupportedLocale;
  readonly progress: number;
  readonly status: CmsThreeDStatus;
}): string {
  if (status === "loading") {
    return t(locale, "profileCms.interactive.loading", {
      progress: Math.round(progress),
    });
  }

  if (config.kind === "room") {
    return t(locale, "profileCms.interactive.enterRoom");
  }

  return t(locale, "profileCms.interactive.loadObject");
}

function hasCmsThreeDBudgetWarning(config: CmsThreeDViewerConfig): boolean {
  const budgetBytes = config.budgetBytes;
  if (budgetBytes === undefined) {
    return false;
  }

  if (config.kind === "room") {
    return config.placements.some(
      (placement) =>
        placement.asset.fileSizeBytes !== undefined &&
        placement.asset.fileSizeBytes > budgetBytes
    );
  }

  return (
    config.asset.fileSizeBytes !== undefined &&
    config.asset.fileSizeBytes > budgetBytes
  );
}

export function CmsThreeDLinkTray({
  config,
  locale,
}: {
  readonly config: CmsThreeDViewerConfig;
  readonly locale: SupportedLocale;
}) {
  if (config.kind === "object") {
    return config.sourceHref ? (
      <div className="tw-absolute tw-bottom-4 tw-left-4 tw-z-20">
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-bg-black/80 tw-px-3 tw-text-sm tw-font-semibold tw-text-white hover:tw-text-primary-300"
          href={config.sourceHref}
        >
          {t(locale, "profileCms.interactive.openSourceMedia")}
        </a>
      </div>
    ) : null;
  }

  return (
    <nav
      aria-label={t(locale, "profileCms.interactive.roomWorksLabel")}
      className="tw-absolute tw-bottom-4 tw-left-4 tw-right-4 tw-z-20 tw-flex tw-flex-wrap tw-gap-2"
    >
      {config.placements.map((placement) => (
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-white/15 tw-bg-black/45 tw-px-3 tw-text-sm tw-font-semibold tw-text-white tw-backdrop-blur-md hover:tw-border-white/35 hover:tw-text-primary-300"
          href={placement.detailHref}
          key={placement.id}
        >
          {placement.label}
        </a>
      ))}
      {config.fallbackHref ? (
        <a
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-white/15 tw-bg-black/35 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-200 tw-backdrop-blur-md hover:tw-border-white/35 hover:tw-text-white"
          href={config.fallbackHref}
        >
          {t(locale, "profileCms.interactive.openFallback")}
        </a>
      ) : null}
    </nav>
  );
}
