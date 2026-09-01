"use client";

import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function ContentModerationAuthorNotice({
  status,
  compact = false,
}: {
  readonly status: ApiDropModerationStatus;
  readonly compact?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const statusLabel = t(
    locale,
    status === ApiDropModerationStatus.ModeratorRemoved
      ? "contentModeration.author.removed"
      : "contentModeration.author.quarantined"
  );

  return (
    <div
      data-testid="content-moderation-author-notice"
      className="tw-flex tw-min-w-0 tw-items-start tw-gap-1.5 tw-text-amber-300"
    >
      <ShieldExclamationIcon
        aria-hidden="true"
        className="tw-mt-px tw-size-3.5 tw-flex-none"
      />
      <span className="tw-min-w-0 tw-text-xs tw-leading-4">
        <span className="tw-font-semibold">{statusLabel}</span>
        {!compact && (
          <span className="tw-ml-1 tw-text-iron-400">
            {t(locale, "contentModeration.author.visibility")}
          </span>
        )}
      </span>
    </div>
  );
}
