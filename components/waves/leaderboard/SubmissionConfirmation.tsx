"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useId } from "react";

export default function SubmissionConfirmation({
  competitionName,
  confirmed,
  checking = false,
  onViewEntry,
  onCheckAgain,
  onDismiss,
}: {
  readonly competitionName: string;
  readonly confirmed: boolean;
  readonly checking?: boolean;
  readonly onViewEntry: () => void;
  readonly onCheckAgain?: (() => void) | undefined;
  readonly onDismiss?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const headingId = useId();
  const detailId = useId();
  const describedBy = confirmed ? headingId : `${headingId} ${detailId}`;
  return (
    <section
      aria-labelledby={headingId}
      className="tw-my-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-iron-950 tw-p-4"
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0 tw-space-y-1">
          <output aria-atomic="true" className="tw-block tw-space-y-1">
            <span
              id={headingId}
              className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50"
            >
              {confirmed
                ? t(locale, "waves.submissions.confirmed", {
                    competition: competitionName,
                  })
                : t(locale, "waves.submissions.saved")}
            </span>
            {!confirmed && checking && (
              <span
                id={detailId}
                className="tw-block tw-text-sm tw-text-iron-300"
              >
                {t(locale, "waves.submissions.checking")}
              </span>
            )}
          </output>
          {!confirmed && !checking && (
            <p
              id={detailId}
              role="alert"
              className="tw-m-0 tw-text-sm tw-text-iron-300"
            >
              {t(locale, "waves.submissions.unconfirmed")}
            </p>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={onDismiss}
            aria-label={t(locale, "waves.submissions.dismiss")}
          >
            <XMarkIcon aria-hidden="true" className="tw-size-5" />
          </Button>
        )}
      </div>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewEntry}
          aria-describedby={describedBy}
        >
          {t(
            locale,
            confirmed
              ? "waves.submissions.viewEntry"
              : "waves.proposalCard.viewArtwork"
          )}
        </Button>
        {!confirmed && onCheckAgain && (
          <Button
            variant="secondary"
            size="sm"
            loading={checking}
            onClick={onCheckAgain}
            aria-describedby={describedBy}
          >
            {t(locale, "waves.submissions.checkAgain")}
          </Button>
        )}
      </div>
    </section>
  );
}
