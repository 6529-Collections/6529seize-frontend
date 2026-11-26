"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { ApiDrop } from "@/generated/models/ApiDrop";

/**
 * What happens to the original: 6529.io deletes it ("delete"); on the 6529
 * Network its author withdraws it ("withdraw"), or, while the new version
 * isn't final yet, nothing is offered ("pending").
 */
export type ResubmitOriginalAction = "delete" | "withdraw" | "pending";

interface ResubmitDeleteConfirmationProps {
  readonly originalDrop: ApiDrop;
  readonly replacementDrop: Pick<ApiDrop, "title" | "metadata">;
  readonly action?: ResubmitOriginalAction | undefined;
  readonly isDeleting: boolean;
  readonly error: string | null;
  readonly onDeleteOriginal: () => void;
  readonly onKeepBoth: () => void;
}

const COPY: Record<
  ResubmitOriginalAction,
  {
    readonly eyebrow: string;
    readonly heading: string;
    readonly description: string;
    readonly confirm: string | null;
    readonly keep: string;
  }
> = {
  delete: {
    eyebrow: "New version submitted",
    heading: "Delete the original submission?",
    description:
      "Your edited submission is live. Delete the original to finish the resubmit flow, or keep both submissions for now.",
    confirm: "Delete Original",
    keep: "Keep Both for Now",
  },
  withdraw: {
    eyebrow: "New version sent",
    heading: "Withdraw the original submission?",
    description:
      "Your new version is on the 6529 Network and shows here once 6529.io lists it. Withdraw the original to finish, or keep both for now.",
    confirm: "Withdraw Original",
    keep: "Keep Both for Now",
  },
  pending: {
    eyebrow: "New version sent",
    heading: "Your new version isn't final yet",
    description:
      "It was sent to the 6529 Network and may still land. Your original stays in the running. Check in a few minutes, and once the new version shows, withdraw the original from its menu.",
    confirm: null,
    keep: "Close",
  },
};

const getDropTitle = (
  drop: Pick<ApiDrop, "title" | "metadata">,
  fallback: string
): string => {
  const metadataTitle = drop.metadata.find(
    (metadata) => metadata.data_key === "title"
  )?.data_value;

  return metadataTitle ?? drop.title ?? fallback;
};

export function ResubmitDeleteConfirmation({
  originalDrop,
  replacementDrop,
  action = "delete",
  isDeleting,
  error,
  onDeleteOriginal,
  onKeepBoth,
}: ResubmitDeleteConfirmationProps) {
  const originalTitle = getDropTitle(originalDrop, "Original submission");
  const replacementTitle = getDropTitle(replacementDrop, "New submission");
  const copy = COPY[action];

  return (
    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-4 tw-py-8 md:tw-px-8">
      <div className="tw-w-full tw-max-w-xl">
        <div className="tw-mb-6 tw-flex tw-flex-col tw-gap-y-2">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-primary-300">
            {copy.eyebrow}
          </span>
          <h4 className="tw-mb-0 tw-mt-0 tw-text-pretty tw-text-2xl tw-font-semibold tw-leading-8 tw-text-iron-100">
            {copy.heading}
          </h4>
          <p className="tw-mb-0 tw-mt-0 tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-400">
            {copy.description}
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
            {copy.keep}
          </SecondaryButton>
          {copy.confirm !== null && (
            <PrimaryButton
              onClicked={onDeleteOriginal}
              disabled={false}
              loading={isDeleting}
            >
              {copy.confirm}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
