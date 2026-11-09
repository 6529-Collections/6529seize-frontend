import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";

export default function SubscriptionCoverageNotice({
  show,
  onRefresh,
  hasReadError = false,
  onRetry,
}: Readonly<{
  show: boolean;
  onRefresh?: (() => void) | undefined;
  hasReadError?: boolean | undefined;
  onRetry?: (() => void) | undefined;
}>) {
  const locale = useBrowserLocale();
  if (!show && !hasReadError) return null;
  const action = show ? onRefresh : onRetry;

  return (
    <div
      role="status"
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-lg tw-bg-amber-400/[0.04] tw-px-3 tw-py-1"
    >
      <p className="tw-m-0 tw-text-pretty tw-text-sm tw-leading-5 tw-text-amber-300">
        {t(
          locale,
          show
            ? "subscriptions.coverage.stale"
            : "subscriptions.page.refreshError"
        )}
      </p>
      {action && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="tw-min-h-11 md:tw-min-h-9"
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
