"use client";

import { motion } from "framer-motion";
import { useCallback } from "react";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";


import { PreviewLeaderboardGalleryCase } from "./components/PreviewLeaderboardGalleryCase";
import { PreviewLeaderboardListCase } from "./components/PreviewLeaderboardListCase";

interface MemesSubmissionPreviewScreenProps {
  readonly previewDrop: ExtendedDrop;
  readonly onBackToEdit: () => void;
  readonly onSubmit: () => void;
  readonly isSubmitting: boolean;
}

export function MemesSubmissionPreviewScreen({
  previewDrop,
  onBackToEdit,
  onSubmit,
  isSubmitting,
}: MemesSubmissionPreviewScreenProps) {
  const onDropClick = useCallback((_drop: ExtendedDrop) => {}, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tw-mx-auto tw-flex tw-h-full tw-max-w-6xl tw-flex-col tw-pb-8"
    >
      <div className="tw-flex-1 tw-space-y-10 tw-overflow-y-auto tw-px-4 tw-py-2 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700">
        <div className="tw-space-y-1">
          <h4 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
            Submission Preview
          </h4>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
            Read-only preview of how your submission may appear in different
            views.
          </p>
        </div>

        <PreviewLeaderboardListCase
          drop={previewDrop}
          onDropClick={onDropClick}
        />
        <PreviewLeaderboardGalleryCase
          drop={previewDrop}
          onDropClick={onDropClick}
        />
      </div>

      <div className="tw-mt-auto tw-flex tw-items-center tw-justify-between tw-border-t tw-border-iron-800 tw-px-4 tw-pt-6">
        <SecondaryButton onClicked={onBackToEdit} disabled={isSubmitting}>
          Back to Edit
        </SecondaryButton>
        <PrimaryButton
          onClicked={onSubmit}
          disabled={false}
          loading={isSubmitting}
          padding="tw-px-6 tw-py-3"
        >
          Submit Artwork
        </PrimaryButton>
      </div>
    </motion.div>
  );
}
