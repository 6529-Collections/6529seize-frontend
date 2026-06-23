"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useEffect, useRef } from "react";

export function MetricTile({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-px-4 tw-py-3">
      <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </p>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-primary-300">
        {formatNumberWithCommas(value)}
      </p>
    </div>
  );
}

export function StateBlock({
  title,
  message,
  onRetry,
}: {
  readonly title: string;
  readonly message: string;
  readonly onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-5">
      <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
        {title}
      </p>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function LoadMoreSentinel({
  canLoadMore,
  isLoading,
  onLoadMore,
}: {
  readonly canLoadMore: boolean;
  readonly isLoading: boolean;
  readonly onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [canLoadMore, isLoading, onLoadMore]);

  if (!canLoadMore) {
    return null;
  }

  return (
    <div ref={sentinelRef} aria-hidden="true" className="tw-h-1 tw-w-full" />
  );
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
