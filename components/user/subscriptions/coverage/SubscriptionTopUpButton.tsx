import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function SubscriptionTopUpButton({
  primary,
  expanded,
  onClick,
}: Readonly<{
  primary: boolean;
  expanded: boolean;
  onClick: () => void;
}>) {
  const locale = useBrowserLocale();
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
