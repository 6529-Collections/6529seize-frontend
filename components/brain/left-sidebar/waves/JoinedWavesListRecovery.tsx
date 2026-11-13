"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function JoinedWavesListRecovery({
  collection = "joined",
  hasError,
  hasNextPage,
  isFetching,
  onLoadMore,
  onRetry,
}: {
  readonly collection?: "joined" | "all";
  readonly hasError: boolean;
  readonly hasNextPage: boolean;
  readonly isFetching: boolean;
  readonly onLoadMore: () => void;
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  if (!hasError && !hasNextPage) return null;

  const loadMore =
    collection === "all"
      ? ("waves.sidebar.allLoadMore" as const)
      : ("waves.sidebar.joinedLoadMore" as const);
  const retryLabel =
    collection === "all"
      ? ("waves.sidebar.allRetryLabel" as const)
      : ("waves.sidebar.joinedRetryLabel" as const);

  return (
    <div className="tw-space-y-2 tw-px-4 tw-py-3">
      {hasError && (
        <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-300">
          {t(
            locale,
            collection === "all"
              ? "waves.sidebar.allLoadError"
              : "waves.sidebar.joinedLoadError"
          )}
        </p>
      )}
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        disabled={isFetching}
        aria-busy={isFetching}
        onClick={hasError ? onRetry : onLoadMore}
        aria-label={t(locale, hasError ? retryLabel : loadMore)}
      >
        {t(locale, hasError ? "waves.sidebar.joinedRetry" : loadMore)}
      </Button>
    </div>
  );
}
