"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function JoinedWavesListRecovery({
  hasError,
  hasNextPage,
  isFetching,
  onLoadMore,
  onRetry,
}: {
  readonly hasError: boolean;
  readonly hasNextPage: boolean;
  readonly isFetching: boolean;
  readonly onLoadMore: () => void;
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  if (!hasError && !hasNextPage) return null;

  return (
    <div className="tw-space-y-2 tw-px-4 tw-py-3">
      {hasError && (
        <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-300">
          {t(locale, "waves.sidebar.joinedLoadError")}
        </p>
      )}
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        disabled={isFetching}
        aria-busy={isFetching}
        onClick={hasError ? onRetry : onLoadMore}
        aria-label={t(
          locale,
          hasError
            ? "waves.sidebar.joinedRetryLabel"
            : "waves.sidebar.joinedLoadMore"
        )}
      >
        {t(
          locale,
          hasError
            ? "waves.sidebar.joinedRetry"
            : "waves.sidebar.joinedLoadMore"
        )}
      </Button>
    </div>
  );
}
