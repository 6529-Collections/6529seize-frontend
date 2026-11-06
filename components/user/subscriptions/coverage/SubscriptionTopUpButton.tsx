import Button from "@/components/utils/button/Button";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function SubscriptionTopUpButton({
  status,
  expanded,
  onClick,
}: Readonly<{
  status: Status | undefined;
  expanded: boolean;
  onClick: () => void;
}>) {
  const locale = useBrowserLocale();
  const primary =
    status === Status.ActionRequired ||
    status === Status.RunningLow ||
    status === Status.NotSetUp;
  return (
    <Button
      variant={primary ? "primary" : "secondary"}
      size={null}
      id="subscription-top-up-opener"
      type="button"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls="profile-subscriptions-top-up"
      onClick={onClick}
      className={`tw-min-h-11 tw-w-full tw-px-3 tw-py-1.5 tw-text-sm tw-shadow-none sm:tw-min-h-9 sm:tw-w-auto ${primary ? "" : "!tw-border-white/[0.16] !tw-bg-transparent desktop-hover:hover:!tw-bg-white/[0.04]"}`}
    >
      {t(locale, "subscriptions.page.topUpTitle")}
    </Button>
  );
}
