"use client";

import Button from "@/components/utils/button/Button";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { motion } from "framer-motion";
import { useCallback } from "react";
import type { MemesSubmissionIdentity } from "../hooks/useMemesSubmissionIdentity";
import { SubmissionActionButton } from "../ui/SubmissionActionButton";
import { SubmissionIdentityPanel } from "../ui/SubmissionIdentityPanel";
import type { SubmissionPhase } from "../ui/SubmissionProgress";
import { PreviewLeaderboardGalleryCase } from "./components/PreviewLeaderboardGalleryCase";
import { PreviewLeaderboardListCase } from "./components/PreviewLeaderboardListCase";

interface MemesSubmissionPreviewScreenProps {
  readonly previewDrop: ExtendedDrop;
  readonly onBackToEdit: () => void;
  readonly onSubmit: () => void;
  readonly identity: MemesSubmissionIdentity;
  readonly isSubmitting: boolean;
  readonly submissionPhase: SubmissionPhase;
  readonly uploadProgress: number;
  readonly submitLabel?: string | undefined;
}

export function MemesSubmissionPreviewScreen({
  previewDrop,
  onBackToEdit,
  onSubmit,
  identity,
  isSubmitting,
  submissionPhase,
  uploadProgress,
  submitLabel,
}: MemesSubmissionPreviewScreenProps) {
  const locale = useBrowserLocale();
  const onDropClick = useCallback((_drop: ExtendedDrop) => {}, []);
  const resolvedSubmitLabel =
    submitLabel ?? t(locale, "memes.submission.action.submitArtwork");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tw-mx-auto tw-flex tw-h-full tw-max-w-6xl tw-flex-col tw-pb-8"
    >
      <div className="tw-flex-1 tw-space-y-10 tw-overflow-y-auto tw-px-4 tw-py-2 tw-pt-8 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700">
        <div className="tw-space-y-1">
          <h4 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "memes.submission.preview.title")}
          </h4>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
            {t(locale, "memes.submission.preview.description")}
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

      <div className="tw-mt-auto tw-flex tw-flex-col tw-gap-2 tw-border-t tw-border-iron-800 tw-px-4 tw-pt-3 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-3">
        <SubmissionIdentityPanel identity={identity} />
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 md:tw-shrink-0">
          <Button
            variant="secondary"
            onClick={onBackToEdit}
            disabled={isSubmitting}
            className="tw-flex-1 !tw-border-transparent !tw-bg-transparent !tw-shadow-none md:tw-flex-none"
          >
            {t(locale, "memes.submission.action.backToEdit")}
          </Button>
          <SubmissionActionButton
            identity={identity}
            isFormValid={true}
            isSubmitting={isSubmitting}
            submissionPhase={submissionPhase}
            uploadProgress={uploadProgress}
            submitLabel={resolvedSubmitLabel}
            onSubmit={onSubmit}
            className="tw-flex-1 md:tw-flex-none"
          />
        </div>
      </div>
    </motion.div>
  );
}
