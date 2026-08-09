"use client";

import { useState, type CSSProperties } from "react";

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

function MuseumMediaFailure({
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
      className="tw-flex tw-min-h-32 tw-flex-col tw-items-start tw-justify-center tw-gap-3 tw-p-5 tw-text-sm tw-leading-6 tw-text-iron-300"
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
    <img
      key={`${src}:${attempt}`}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      srcSet={srcSet}
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
