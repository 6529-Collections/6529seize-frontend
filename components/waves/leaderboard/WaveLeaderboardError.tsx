"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WaveLeaderboardError({
  onRetry,
  retrying = false,
  hasEntries = false,
}: {
  readonly onRetry: () => void;
  readonly retrying?: boolean;
  readonly hasEntries?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <div
      role="alert"
      className="tw-my-3 tw-space-y-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4"
    >
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(
          locale,
          hasEntries
            ? "waves.leaderboard.refreshError"
            : "waves.leaderboard.loadError"
        )}
      </p>
      <Button
        variant="secondary"
        size="sm"
        loading={retrying}
        onClick={onRetry}
      >
        {t(locale, "waves.leaderboard.retry")}
      </Button>
    </div>
  );
}
