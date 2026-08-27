import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { MinusCircleIcon } from "@heroicons/react/24/outline";

export default function SuspendedProfileHeaderIndicator() {
  const locale = useBrowserLocale();

  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-amber-400/35 tw-bg-amber-400/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-amber-300 tw-shadow-[0_0_16px_rgba(251,191,36,0.12)] tw-backdrop-blur-sm">
      <MinusCircleIcon aria-hidden="true" className="tw-size-3.5" />
      <span>{t(locale, "contentModeration.profile.suspended")}</span>
    </span>
  );
}
