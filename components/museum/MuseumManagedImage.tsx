"use client";

import { useState, type CSSProperties } from "react";
import {
  getMuseumMediaDeliverySrcSet,
  getMuseumMediaDeliveryUrl,
} from "@/lib/museum/runtime/mediaDelivery";

export interface MuseumManagedImageProps {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly loading?: "eager" | "lazy";
  readonly fetchPriority?: "high" | "low" | "auto";
  readonly srcSet?: string;
  readonly sizes?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly failureMessage: string;
  readonly retryLabel: string;
  readonly sourceHref?: string;
  readonly sourceLabel?: string;
  readonly onStatusChange?: (status: "loading" | "revealed" | "error") => void;
}

export function MuseumMediaFailure({
  message,
  retryLabel,
  sourceHref,
  sourceLabel,
  onRetry,
}: {
  readonly message: string;
  readonly retryLabel: string;
  readonly sourceHref?: string;
  readonly sourceLabel?: string;
  readonly onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="tw-flex tw-h-full tw-min-h-32 tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-overflow-y-auto tw-p-5 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-300"
    >
      <p className="tw-m-0">{message}</p>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        {onRetry === undefined ? null : (
          <button
            type="button"
            onClick={onRetry}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {retryLabel}
          </button>
        )}
        {sourceHref !== undefined && sourceLabel !== undefined ? (
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {sourceLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function MuseumManagedImage({
  src,
  alt,
  width,
  height,
  loading = "lazy",
  fetchPriority = "auto",
  srcSet,
  sizes,
  className,
  style,
  failureMessage,
  retryLabel,
  sourceHref,
  sourceLabel,
  onStatusChange,
}: MuseumManagedImageProps) {
  const deliveredSrc = getMuseumMediaDeliveryUrl(src);
  const deliveredSrcSet = getMuseumMediaDeliverySrcSet(srcSet);
  const [failed, setFailed] = useState(alt.trim().length === 0);
  const [attempt, setAttempt] = useState(0);
  if (failed) {
    return (
      <MuseumMediaFailure
        message={failureMessage}
        retryLabel={retryLabel}
        {...(sourceHref === undefined || sourceLabel === undefined
          ? {}
          : { sourceHref, sourceLabel })}
        {...(alt.trim().length === 0
          ? {}
          : {
              onRetry: () => {
                setFailed(false);
                setAttempt((value) => value + 1);
                onStatusChange?.("loading");
              },
            })}
      />
    );
  }
  return (
    // The publication retains the exact governed URI. Approved accession bytes
    // traverse the strict same-origin delivery route without re-derivation.
    <img
      key={`${deliveredSrc}:${attempt}`}
      src={deliveredSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      srcSet={deliveredSrcSet}
      sizes={sizes}
      style={style}
      onError={() => {
        setFailed(true);
        onStatusChange?.("error");
      }}
      onLoad={() => onStatusChange?.("revealed")}
      className={className}
    />
  );
}
