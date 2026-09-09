"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useContentModerationDropGateContext } from "./ContentModerationDropGateContext";
import ContentModerationReportStatusButton from "./ContentModerationReportStatusButton";
import ContentModerationAuthorNotice from "./ContentModerationAuthorNotice";

function InlineAction({
  label,
  tooltip,
  disabled = false,
  onClick,
}: {
  readonly label: string;
  readonly tooltip: string;
  readonly disabled?: boolean | undefined;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="tw-cursor-pointer tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 desktop-hover:hover:tw-text-white"
    >
      {label}
    </button>
  );
}

export default function ContentModerationDropStatusControls() {
  const locale = useBrowserLocale();
  const context = useContentModerationDropGateContext();
  const hasReportStatus = context !== null && context.reportStatus !== null;
  const revealedPersonalModeration =
    context?.revealedPersonalModeration ?? null;
  const authorModerationStatus =
    context?.canViewGlobalModeratedContent === true
      ? context.globalModerationStatus
      : null;

  if (
    !hasReportStatus &&
    revealedPersonalModeration === null &&
    authorModerationStatus === null
  ) {
    return null;
  }

  return (
    <div className="tw-mb-1 tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
      {authorModerationStatus !== null && (
        <ContentModerationAuthorNotice status={authorModerationStatus} />
      )}
      {hasReportStatus && <ContentModerationReportStatusButton />}
      {hasReportStatus && revealedPersonalModeration !== null && (
        <span aria-hidden="true" className="tw-text-xs tw-text-iron-500">
          ·
        </span>
      )}
      {revealedPersonalModeration !== null && (
        <>
          <InlineAction
            label={t(locale, "contentModeration.actions.hideAgain")}
            tooltip={t(locale, "contentModeration.tooltips.hideAgain")}
            onClick={revealedPersonalModeration.hideAgain}
          />
          <span aria-hidden="true" className="tw-text-xs tw-text-iron-500">
            ·
          </span>
          <InlineAction
            label={revealedPersonalModeration.persistLabel}
            tooltip={revealedPersonalModeration.persistTooltip}
            disabled={revealedPersonalModeration.persistPending}
            onClick={revealedPersonalModeration.persist}
          />
        </>
      )}
    </div>
  );
}
