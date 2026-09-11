"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useContentModerationReportStatus } from "@/hooks/content-moderation/useContentModerationReportStatus";
import { t } from "@/i18n/messages";
import { FlagIcon } from "@heroicons/react/24/outline";

export default function ContentModerationDropActions({
  drop,
  mobile = false,
  onReport,
}: {
  readonly drop: ApiDrop;
  readonly mobile?: boolean | undefined;
  readonly onReport: () => void;
}) {
  const locale = useBrowserLocale();
  const reportStatus = useContentModerationReportStatus(drop);
  const { connectedProfile, activeProfileProxy } = useAuth();
  const isOwnDrop = connectedProfile?.id === drop.author.id;
  const isUnavailable =
    isOwnDrop || activeProfileProxy !== null || drop.id.startsWith("temp-");

  if (isUnavailable) return null;

  const buttonClassName = mobile
    ? "tw-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-iron-300 tw-transition-colors active:tw-bg-iron-800 disabled:tw-opacity-50"
    : "tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-bg-iron-800 disabled:tw-opacity-50";
  const labelClassName = mobile
    ? "tw-text-base tw-font-semibold"
    : "tw-text-sm tw-font-medium";
  const iconClassName = mobile ? "tw-size-5" : "tw-size-4";

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={(event) => {
        event.stopPropagation();
        onReport();
      }}
    >
      <FlagIcon aria-hidden="true" className={iconClassName} />
      <span className={labelClassName}>
        {t(
          locale,
          reportStatus === null
            ? "contentModeration.actions.report"
            : "contentModeration.report.viewStatus"
        )}
      </span>
    </button>
  );
}
