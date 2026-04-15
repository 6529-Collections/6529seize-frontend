"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { ApiDrop } from "@/generated/models/ApiDrop";

interface ResubmitDeleteConfirmationProps {
  readonly originalDrop: ApiDrop;
  readonly replacementDrop: ApiDrop;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly onDeleteOriginal: () => void;
  readonly onKeepBoth: () => void;
}

const getDropTitle = (drop: ApiDrop, fallback: string): string => {
  const metadataTitle = drop.metadata.find(
    (metadata) => metadata.data_key === "title"
  )?.data_value;

  return metadataTitle ?? drop.title ?? fallback;
};

export function ResubmitDeleteConfirmation({
  originalDrop,
  replacementDrop,
  isDeleting,
  error,
  onDeleteOriginal,
  onKeepBoth,
}: ResubmitDeleteConfirmationProps) {
  const originalTitle = getDropTitle(originalDrop, "Original submission");
  const replacementTitle = getDropTitle(replacementDrop, "New submission");

  return (
    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-4 tw-py-8 md:tw-px-8">
      <div className="tw-w-full tw-max-w-xl">
        <div className="tw-mb-6 tw-flex tw-flex-col tw-gap-y-3">
          <span className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            New version submitted
          </span>
          <h4 className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-100">
            Delete the original submission?
          </h4>
          <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            Your edited submission is live. Delete the original to finish the
            resubmit flow, or keep both submissions for now.
          </p>
        </div>

        <div className="tw-mb-6 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
          <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
            <div>
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                Original
              </span>
              <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-medium tw-text-iron-200">
                {originalTitle}
              </p>
            </div>
            <div>
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                New
              </span>
              <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-medium tw-text-iron-200">
                {replacementTitle}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="tw-mb-6 tw-rounded-lg tw-bg-red/10 tw-p-3 tw-text-sm tw-font-medium tw-text-red">
            {error}
          </p>
        )}

        <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
          <SecondaryButton onClicked={onKeepBoth} disabled={isDeleting}>
            Keep Both for Now
          </SecondaryButton>
          <PrimaryButton
            onClicked={onDeleteOriginal}
            disabled={false}
            loading={isDeleting}
            padding="tw-px-5 tw-py-2.5"
          >
            Delete Original
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
