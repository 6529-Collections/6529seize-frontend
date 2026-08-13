"use client";

import { useCallback, useRef, useState } from "react";
import { MuseumManagedImage } from "./MuseumManagedImage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumExternalProposalPresentationVariant } from "@/lib/museum/publication/types";

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
  variants = [],
  sizes = "(min-width: 1280px) 42vw, (min-width: 640px) 70vw, 100vw",
  sourceHref,
  sourceLabel,
  eager = false,
  requireIntentForLargeSource = true,
  className,
}: {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly sourceByteSize?: number;
  readonly variants?:
    | readonly MuseumExternalProposalPresentationVariant[]
    | undefined;
  readonly sizes?: string;
  readonly sourceHref?: string;
  readonly sourceLabel?: string;
  readonly eager?: boolean;
  readonly requireIntentForLargeSource?: boolean;
  readonly className?: string;
}) {
  const responsiveVariants = [...variants].sort(
    (left, right) => left.width - right.width
  );
  const smallest = responsiveVariants.at(0);
  const renderedSrc = smallest?.url ?? src;
  const renderedWidth = smallest?.width ?? width;
  const renderedHeight = smallest?.height ?? height;
  const srcSet =
    responsiveVariants.length === 0
      ? undefined
      : responsiveVariants
          .map((variant) => `${variant.url} ${variant.width}w`)
          .join(", ");
  const requiresIntent =
    responsiveVariants.length === 0 &&
    requireIntentForLargeSource &&
    sourceByteSize !== undefined &&
    sourceByteSize >= MUSEUM_PROPOSAL_INTENT_VIEW_BYTES;
  const [revealed, setRevealed] = useState(!requiresIntent);
  const [mediaStatus, setMediaStatus] = useState<
    "idle" | "loading" | "revealed" | "error"
  >(requiresIntent ? "idle" : "loading");
  const focusOnRevealRef = useRef(false);
  const focusRevealedMedia = useCallback((node: HTMLDivElement | null) => {
    if (node === null || !focusOnRevealRef.current) return;
    focusOnRevealRef.current = false;
    node.focus();
  }, []);

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
            focusOnRevealRef.current = true;
            setMediaStatus("loading");
            setRevealed(true);
          }}
          className="hover:tw-text-primary-200 tw-flex tw-h-full tw-min-h-12 tw-w-full tw-items-center tw-justify-center tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-bg-black tw-p-5 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
    <div
      ref={focusRevealedMedia}
      tabIndex={-1}
      aria-label={statusMessage}
      className="tw-outline-none"
    >
      <span className="tw-sr-only" aria-live="polite">
        {statusMessage}
      </span>
      <MuseumManagedImage
        src={renderedSrc}
        {...(srcSet === undefined ? {} : { srcSet, sizes })}
        alt={alt}
        width={renderedWidth}
        height={renderedHeight}
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
    </div>
  );
}
