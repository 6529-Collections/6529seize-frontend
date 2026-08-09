"use client";

import { useState } from "react";
import { MuseumManagedImage } from "./MuseumManagedImage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const MUSEUM_PROPOSAL_INTENT_VIEW_BYTES = 16_000_000;

function formatMegabytes(bytes: number): string {
  return (bytes / 1_000_000).toFixed(1);
}

export function MuseumProposalImage({
  src,
  alt,
  width,
  height,
  sourceByteSize,
  sourceHref,
  sourceLabel,
  eager = false,
  className,
}: {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly sourceByteSize?: number;
  readonly sourceHref?: string;
  readonly sourceLabel?: string;
  readonly eager?: boolean;
  readonly className?: string;
}) {
  const requiresIntent =
    sourceByteSize !== undefined &&
    sourceByteSize >= MUSEUM_PROPOSAL_INTENT_VIEW_BYTES;
  const [revealed, setRevealed] = useState(!requiresIntent);
  const [mediaStatus, setMediaStatus] = useState<
    "idle" | "loading" | "revealed" | "error"
  >(requiresIntent ? "idle" : "loading");

  if (!revealed) {
    let statusMessage: string | null = null;
    if (mediaStatus === "loading") {
      statusMessage = t(DEFAULT_LOCALE, "museum.network.media.loading");
    } else if (mediaStatus !== "idle") {
      statusMessage = t(DEFAULT_LOCALE, "museum.network.media.error");
    }
    return (
      <>
        <span className="tw-sr-only" aria-live="polite">
          {statusMessage}
        </span>
        <button
          type="button"
          onClick={() => {
            setMediaStatus("loading");
            setRevealed(true);
          }}
          className="hover:tw-text-primary-200 tw-flex tw-min-h-12 tw-w-full tw-items-center tw-justify-center tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-bg-black tw-p-5 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            "museum.network.acquisitions.viewHistoricalProposalImage",
            {
              size: formatMegabytes(sourceByteSize ?? 0),
            }
          )}
        </button>
      </>
    );
  }
  let statusMessage: string;
  if (mediaStatus === "loading") {
    statusMessage = t(DEFAULT_LOCALE, "museum.network.media.loading");
  } else if (mediaStatus === "error") {
    statusMessage = t(DEFAULT_LOCALE, "museum.network.media.error");
  } else {
    statusMessage = t(DEFAULT_LOCALE, "museum.network.media.revealed");
  }
  return (
    <>
      <span className="tw-sr-only" aria-live="polite">
        {statusMessage}
      </span>
      <MuseumManagedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "low"}
        style={{ aspectRatio: `${width} / ${height}` }}
        className={className ?? "tw-block tw-h-auto tw-w-full"}
        failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
        retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
        {...(sourceHref === undefined || sourceLabel === undefined
          ? {}
          : { sourceHref, sourceLabel })}
        onStatusChange={setMediaStatus}
      />
    </>
  );
}
