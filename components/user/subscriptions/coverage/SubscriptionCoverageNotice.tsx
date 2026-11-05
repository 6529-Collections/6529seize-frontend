import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";

export default function SubscriptionCoverageNotice({
  show,
  onRefresh,
}: Readonly<{ show: boolean; onRefresh?: (() => void) | undefined }>) {
  const locale = useBrowserLocale();
  if (!show) return null;

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
      <p
        role="status"
        className="tw-m-0 tw-text-pretty tw-text-sm tw-leading-5 tw-text-amber-300"
      >
        {t(locale, "subscriptions.coverage.stale")}
      </p>
      {onRefresh && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="tw-min-h-11 md:tw-min-h-9"
          onClick={onRefresh}
        >
          {t(locale, "subscriptions.coverage.refresh")}
        </Button>
      )}
    </div>
  );
}
