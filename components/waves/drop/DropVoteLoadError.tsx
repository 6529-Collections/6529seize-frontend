import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function DropVoteLoadError({
  kind,
  onRetry,
}: {
  readonly kind: "voters" | "logs";
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div
      role="alert"
      className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-p-6"
    >
      <span className="tw-text-sm tw-text-rose-300">
        {t(locale, `waves.voteDetails.${kind}.error`)}
      </span>
      <Button variant="tertiary" size="xs" onClick={onRetry}>
        {t(locale, "waves.voteDetails.retry")}
      </Button>
    </div>
  );
}
