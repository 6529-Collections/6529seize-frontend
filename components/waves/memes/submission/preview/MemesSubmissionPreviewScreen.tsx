"use client";

import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { SingleWaveDropContent } from "@/components/waves/drop/SingleWaveDropContent";
import { WaveDropAdditionalInfo } from "@/components/waves/drop/WaveDropAdditionalInfo";
import { WaveLeaderboardGalleryItem } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";
import { MemesWaveSmallLeaderboardDrop } from "@/components/waves/small-leaderboard/MemesWaveSmallLeaderboardDrop";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { motion } from "framer-motion";
import { useCallback } from "react";

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
  const onSmallDropClick = useCallback(() => {}, []);

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

        <section className="tw-space-y-3">
          <h5 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
            Leaderboard List Card
          </h5>
          <div className="tw-pointer-events-none">
            <MemesLeaderboardDrop
              drop={previewDrop}
              onDropClick={onDropClick}
            />
          </div>
        </section>

        <section className="tw-space-y-3">
          <h5 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
            Leaderboard Grid Variants
          </h5>
          <div className="tw-grid tw-gap-4 lg:tw-grid-cols-2">
            <div className="tw-pointer-events-none">
              <WaveLeaderboardGalleryItem
                drop={previewDrop}
                onDropClick={onDropClick}
              />
            </div>
            <div className="tw-pointer-events-none">
              <WaveLeaderboardGridItem
                drop={previewDrop}
                mode="content_only"
                onDropClick={onDropClick}
              />
            </div>
          </div>
        </section>

        <section className="tw-space-y-3">
          <h5 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
            Small Leaderboard Card
          </h5>
          <div className="tw-pointer-events-none">
            <MemesWaveSmallLeaderboardDrop
              drop={previewDrop}
              onDropClick={onSmallDropClick}
            />
          </div>
        </section>

        <section className="tw-space-y-3">
          <h5 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
            Drop Detail Preview
          </h5>
          <div className="tw-pointer-events-none tw-space-y-6">
            <SingleWaveDropContent drop={previewDrop} />
            <WaveDropAdditionalInfo drop={previewDrop} />
          </div>
        </section>
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
