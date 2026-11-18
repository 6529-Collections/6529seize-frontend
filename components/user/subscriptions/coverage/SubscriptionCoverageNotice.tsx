import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";
import { formatSubscriptionCoverageDeadline } from "./subscriptionCoverage.helpers";
import { subscriptionCoverageTimestamp } from "./subscriptionCoverageSummary.helpers";

export default function SubscriptionCoverageNotice({
  show,
  onRefresh,
  hasReadError = false,
  onRetry,
  calculatedAt,
}: Readonly<{
  show: boolean;
  onRefresh?: (() => void) | undefined;
  hasReadError?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  calculatedAt?: Date | undefined;
}>) {
  const locale = useBrowserLocale();
  if (!show && !hasReadError) return null;
  const action = show ? onRefresh : onRetry;
  const hasTimestamp =
    subscriptionCoverageTimestamp(calculatedAt) !== undefined;
  let message = t(
    locale,
    show ? "subscriptions.coverage.stale" : "subscriptions.page.refreshError"
  );
  if (show && hasTimestamp && calculatedAt) {
    message = t(locale, "subscriptions.coverage.summary.lastUpdated", {
      time: formatSubscriptionCoverageDeadline(locale, calculatedAt),
    });
  }

  return (
    <div
      role="status"
      className={
        show
          ? "tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1"
          : "tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-lg tw-bg-amber-400/[0.04] tw-px-3 tw-py-1"
      }
    >
      <p
        className={`tw-m-0 tw-text-pretty tw-leading-5 ${show ? "tw-text-xs tw-text-iron-400" : "tw-text-sm tw-text-amber-300"}`}
      >
        {message}
      </p>
      {action && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`tw-min-h-11 md:tw-min-h-9 ${show ? "!tw-px-0 tw-text-xs tw-font-normal tw-text-iron-300 tw-underline tw-underline-offset-4" : ""}`}
          onClick={action}
        >
          {t(
            locale,
            show ? "subscriptions.coverage.refresh" : "subscriptions.page.retry"
          )}
        </Button>
      )}
    </div>
  );
}
