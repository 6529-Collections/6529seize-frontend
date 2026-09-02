import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export const ModerationRejectedDeliveryStatus = ({
  contentOffsetClass,
}: {
  readonly contentOffsetClass: string;
}) => {
  const locale = useBrowserLocale();

  return (
    <div
      className={`tw-text-red-300 tw-mt-1 tw-flex tw-items-center tw-gap-x-1.5 tw-text-xs tw-font-medium tw-leading-5 ${contentOffsetClass}`}
      data-testid="moderation-rejected-delivery-status"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0"
      />
      <span>{t(locale, "contentModeration.delivery.moderationRejected")}</span>
    </div>
  );
};
