"use client";

import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { FlagIcon } from "@heroicons/react/24/outline";
import { useContentModerationDropGateContext } from "./ContentModerationDropGateContext";

export default function ContentModerationReportStatusButton({
  compact = false,
}: {
  readonly compact?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const context = useContentModerationDropGateContext();
  const status = context?.reportStatus ?? null;
  if (status === null) return null;

  const isOpen = status === ApiContentModerationReportStatus.Open;
  let fullLabel = t(locale, "contentModeration.report.noActionTaken");
  if (isOpen) {
    fullLabel = t(locale, "contentModeration.report.awaitingReview");
  } else if (status === ApiContentModerationReportStatus.ResolvedRemoved) {
    fullLabel = t(locale, "contentModeration.report.contentRemoved");
  }
  const shortLabel = t(
    locale,
    isOpen
      ? "contentModeration.report.reportedShort"
      : "contentModeration.report.reviewedShort"
  );
  const visibleLabel =
    status === ApiContentModerationReportStatus.ResolvedAllowed
      ? fullLabel
      : shortLabel;

  return (
    <button
      type="button"
      title={fullLabel}
      aria-label={fullLabel}
      onClick={(event) => {
        event.stopPropagation();
        context?.openReportDetails();
      }}
      className={`tw-text-primary-200 tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-500/10 tw-align-middle tw-font-semibold tw-transition-colors hover:tw-border-primary-400/45 hover:tw-bg-primary-500/15 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
        compact
          ? "tw-px-1.5 tw-py-0.5 tw-text-[10px]"
          : "tw-self-start tw-px-2 tw-py-0.5 tw-text-xs"
      }`}
    >
      <FlagIcon aria-hidden="true" className="tw-size-3.5 tw-flex-none" />
      <span>{visibleLabel}</span>
    </button>
  );
}
