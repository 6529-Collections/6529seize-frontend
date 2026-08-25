"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function BlockedProfileHeaderIndicator({
  isUnblocking,
  onUnblock,
}: {
  readonly isUnblocking: boolean;
  readonly onUnblock: () => void;
}) {
  const locale = useBrowserLocale();

  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/55 tw-px-2.5 tw-py-1 tw-text-xs tw-text-iron-300 tw-backdrop-blur-sm">
      <span>{t(locale, "contentModeration.profile.blocked")}</span>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        disabled={isUnblocking}
        onClick={onUnblock}
        className="tw-inline-flex tw-cursor-pointer tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-font-semibold tw-text-iron-50 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-60 desktop-hover:hover:tw-text-white"
      >
        {isUnblocking ? (
          <CircleLoader size={CircleLoaderSize.SMALL} />
        ) : (
          t(locale, "contentModeration.actions.unblock")
        )}
      </button>
    </span>
  );
}
