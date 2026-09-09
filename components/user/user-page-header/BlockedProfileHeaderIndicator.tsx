import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { NoSymbolIcon } from "@heroicons/react/24/outline";

export default function BlockedProfileHeaderIndicator() {
  const locale = useBrowserLocale();

  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-red/35 tw-bg-red/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-red tw-shadow-[0_0_16px_rgba(249,112,102,0.12)] tw-backdrop-blur-sm">
      <NoSymbolIcon aria-hidden="true" className="tw-size-3.5" />
      <span>{t(locale, "contentModeration.profile.blocked")}</span>
    </span>
  );
}
