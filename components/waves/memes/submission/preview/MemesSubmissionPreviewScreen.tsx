"use client";

import { LocalImagePreviewContext } from "@/components/drops/view/item/content/media/LocalImagePreviewContext";
import Button from "@/components/utils/button/Button";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { motion } from "framer-motion";
import { useCallback } from "react";
import type { MemesSubmissionIdentity } from "../hooks/useMemesSubmissionIdentity";
import { SubmissionActionButton } from "../ui/SubmissionActionButton";
import { SubmissionIdentityPanel } from "../ui/SubmissionIdentityPanel";
import { SubmissionSigningNote } from "../ui/SubmissionSigningNote";
import type { SubmissionPhase } from "../ui/SubmissionProgress";
import { PreviewLeaderboardGalleryCase } from "./components/PreviewLeaderboardGalleryCase";
import { PreviewLeaderboardListCase } from "./components/PreviewLeaderboardListCase";
import { ProposalCardPreview } from "../components/ProposalCardPreview";
import type { ProposalCardDocumentInput } from "@/lib/proposal-card/document";
import { AdditionalActionSummary } from "../components/AdditionalActionSummary";
import { MemesSubmissionAdditionalInfoKey } from "../types/OperationalData";

import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";

interface MemesSubmissionPreviewScreenProps {
  readonly collaborators?: readonly ApiMemeCollaboratorProfile[];
  readonly proposalCard?: ProposalCardDocumentInput | undefined;
  readonly previewDrop: ExtendedDrop;
  readonly onBackToEdit: () => void;
  readonly onSubmit: () => void;
  readonly identity: MemesSubmissionIdentity;
  readonly isSubmitting: boolean;
  readonly submissionPhase: SubmissionPhase;
  readonly uploadProgress: number;
  readonly submitLabel?: string | undefined;
}

/** Review the metadata-backed drop and its operational information before submitting. */
export function MemesSubmissionPreviewScreen({
  proposalCard,
  collaborators,
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

        <AdditionalActionSummary
          isAdditionalActionPromised={
            previewDrop.is_additional_action_promised === true
          }
          plan={
            previewDrop.metadata.find(
              (item) =>
                item.data_key ===
                String(MemesSubmissionAdditionalInfoKey.ADDITIONAL_ACTION_PLAN)
            )?.data_value
          }
        />
        {(collaborators?.length ?? 0) > 0 && (
          <div className="tw-space-y-2 tw-text-sm tw-text-iron-300">
            <p className="tw-m-0 tw-font-medium">
              {t(locale, "memes.collaborations.previewInvites")}
            </p>
            <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
              {collaborators?.map((profile) => (
                <li
                  key={profile.id}
                  className="tw-rounded-full tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-iron-100"
                >
                  @{profile.handle}
                </li>
              ))}
            </ul>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              {t(locale, "memes.collaborations.hint")}
            </p>
          </div>
        )}

        {proposalCard && (
          <div className="tw-space-y-3">
            <h4 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "memes.proposalFrame.preview")}
            </h4>
            <div className="tw-h-[min(65vh,600px)] tw-w-full">
              <ProposalCardPreview {...proposalCard} />
            </div>
          </div>
        )}
        <LocalImagePreviewContext.Provider
          value={previewDrop.parts[0]?.media[0]?.url ?? null}
        >
          <PreviewLeaderboardListCase
            drop={previewDrop}
            onDropClick={onDropClick}
          />
          <PreviewLeaderboardGalleryCase
            drop={previewDrop}
            onDropClick={onDropClick}
          />
        </LocalImagePreviewContext.Provider>
      </div>

      <div className="tw-mt-auto tw-space-y-2 tw-border-t tw-border-iron-800 tw-px-4 tw-pt-3">
        {identity.canSubmit && submissionPhase !== "success" && (
          <SubmissionSigningNote />
        )}
        <div className="tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-3">
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
      </div>
    </motion.div>
  );
}
