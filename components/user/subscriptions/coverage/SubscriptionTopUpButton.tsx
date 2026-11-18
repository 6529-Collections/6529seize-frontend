import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function SubscriptionTopUpButton({
  primary,
  expanded,
  onClick,
  forFutureDrops = false,
}: Readonly<{
  primary: boolean;
  expanded: boolean;
  onClick: () => void;
  forFutureDrops?: boolean | undefined;
}>) {
  const locale = useBrowserLocale();
  let variant: "primary" | "secondary" | "ghost" = primary
    ? "primary"
    : "secondary";
  if (forFutureDrops) variant = "ghost";
  return (
    <Button
      variant={variant}
      size={null}
      id="subscription-top-up-opener"
      type="button"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls="profile-subscriptions-top-up"
      onClick={onClick}
      className={`tw-min-h-11 tw-w-full tw-px-3 tw-py-1.5 tw-text-sm tw-shadow-none sm:tw-min-h-9 sm:tw-w-auto ${primary ? "" : "!tw-border-white/[0.16] !tw-bg-transparent desktop-hover:hover:!tw-bg-white/[0.04]"} ${forFutureDrops ? "!tw-w-auto !tw-border-0 !tw-px-0 tw-text-xs tw-font-normal tw-underline tw-underline-offset-4" : ""}`}
    >
      {t(
        locale,
        forFutureDrops
          ? "subscriptions.coverage.summary.topUpFutureDrops"
          : "subscriptions.page.topUpTitle"
      )}
    </Button>
  );
}
