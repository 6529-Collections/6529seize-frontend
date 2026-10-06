"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
  return (
    <section className="tw-my-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-iron-950 tw-p-4">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div role="status" className="tw-min-w-0 tw-space-y-1">
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            {confirmed
              ? t(locale, "waves.submissions.confirmed", {
                  competition: competitionName,
                })
              : t(locale, "waves.submissions.saved")}
          </p>
          {!confirmed && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(
                locale,
                checking
                  ? "waves.submissions.checking"
                  : "waves.submissions.unconfirmed"
              )}
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
        <Button variant="secondary" size="sm" onClick={onViewEntry}>
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
          >
            {t(locale, "waves.submissions.checkAgain")}
          </Button>
        )}
      </div>
    </section>
  );
}
