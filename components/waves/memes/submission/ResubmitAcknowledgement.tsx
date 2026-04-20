"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";

interface ResubmitAcknowledgementProps {
  readonly onAccept: () => void;
  readonly onCancel: () => void;
}

export function ResubmitAcknowledgement({
  onAccept,
  onCancel,
}: ResubmitAcknowledgementProps) {
  return (
    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-4 tw-py-8 md:tw-px-8">
      <div className="tw-w-full tw-max-w-2xl">
        <div className="tw-mb-6 tw-flex tw-flex-col tw-gap-y-3">
          <span className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            Resubmission
          </span>
          <h4 className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-100">
            This creates a new submission
          </h4>
          <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            This is not editing your current submission. We copy the previous
            version&apos;s data so the new submission is easier to prepare.
          </p>
        </div>

        <div className="tw-mb-6 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
          <ul className="tw-mb-0 tw-flex tw-list-disc tw-flex-col tw-gap-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
            <li>
              The new submission starts with zero votes. Votes on the original
              do not transfer.
            </li>
            <li>
              Your previous version stays live while you finish the new
              submission.
            </li>
            <li>
              After the new submission is live, you&apos;ll be asked whether to
              delete the original.
            </li>
          </ul>
        </div>

        <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
          <SecondaryButton onClicked={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton
            onClicked={onAccept}
            disabled={false}
            loading={false}
            padding="tw-px-5 tw-py-2.5"
          >
            I Understand, Start Resubmission
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
