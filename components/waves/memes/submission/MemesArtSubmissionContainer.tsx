"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemesArtSubmissionShell } from "./MemesArtSubmissionShell";
import { MemesArtSubmissionStepContent } from "./MemesArtSubmissionStepContent";
import { ResubmitAcknowledgement } from "./ResubmitAcknowledgement";
import { ResubmitDeleteConfirmation } from "./ResubmitDeleteConfirmation";
import MemesSubmissionDocumentation, {
  type MemesSubmissionDocumentationHandle,
} from "./MemesSubmissionDocumentation";
import { SubmissionStep } from "./types/Steps";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "./hooks/useArtworkSubmissionMutation";
import { useMemesSubmissionIdentity } from "./hooks/useMemesSubmissionIdentity";
import { useResubmissionDelete } from "./hooks/useResubmissionDelete";
import type { SubmissionPhase } from "./ui/SubmissionProgress";
import { buildPreviewDrop } from "./utils/buildPreviewDrop";
import { buildMemesSubmissionDraftFromDrop } from "./utils/submissionDraft";

interface MemesArtSubmissionContainerProps {
  readonly onClose: () => void;
  readonly wave: ApiWave;
  readonly sourceDrop?: ExtendedDrop | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

/**
 * MemesArtSubmissionContainer - Main container component for the artwork submission flow
 *
 * This component has been simplified by:
 * 1. Moving form state management to a custom hook with reducer pattern
 * 2. Extracting the modal layout to a separate component
 * 3. Using an enum with a component map for cleaner step routing
 * 4. Using direct component composition instead of component injection
 * 5. Using a separate mutation hook for API submission
 * 6. Using a dedicated progress component for visual feedback
 */
const MemesArtSubmissionContainer: FC<MemesArtSubmissionContainerProps> = ({
  onClose,
  wave,
  sourceDrop,
  onSourceDropDeleted,
}) => {
  const keyboardFocusContainerRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(keyboardFocusContainerRef);

  const initialDraft = useMemo(
    () =>
      sourceDrop ? buildMemesSubmissionDraftFromDrop(sourceDrop) : undefined,
    [sourceDrop]
  );
  const isResubmission = Boolean(sourceDrop);
  const [hasAcknowledgedResubmission, setHasAcknowledgedResubmission] =
    useState(!isResubmission);

  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm(initialDraft);
  const { handleBackToArtwork, setAdditionalMedia } = form;
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
  const { isSafeWallet } = useSeizeConnectContext();
  const identity = useMemesSubmissionIdentity(wave);
  const locale = useBrowserLocale();
  const submitLabel = isResubmission
    ? t(locale, "memes.submission.action.submitNewVersion")
    : t(locale, "memes.submission.action.submitArtwork");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDrop, setPreviewDrop] = useState<ExtendedDrop | null>(null);
  const documentationRef = useRef<MemesSubmissionDocumentationHandle>(null);
  const documentationWallet = (
    getWalletAddress() ?? identity.address
  )?.toLowerCase();
  const documentationActor = `${connectedProfile?.id ?? "signed-out"}:${activeProfileProxy?.id ?? "direct"}:${documentationWallet ?? "no-wallet"}`;
  const [documentationStartedBy, setDocumentationStartedBy] = useState<
    string | null
  >(null);
  const hasDocumentation = documentationStartedBy === documentationActor;
  const requestClose = useCallback(() => {
    const preparation = documentationRef.current?.prepareClose();
    if (!preparation) {
      onClose();
      return;
    }
    void preparation.then((saved) => {
      if (saved) onClose();
    });
  }, [onClose]);

  // Use the mutation hook for submission
  const {
    submitArtwork,
    uploadProgress,
    submissionPhase,
    submissionError,
    isSubmitting,
  } = useArtworkSubmissionMutation();
  const {
    replacementDrop,
    isDeletingOriginal,
    deleteOriginalError,
    handleResubmissionSuccess,
    handleDeleteOriginalClick,
    handleKeepBoth,
  } = useResubmissionDelete({
    sourceDrop,
    onClose: requestClose,
    onSourceDropDeleted,
  });

  // Auto-close on successful submission after a short delay
  useEffect(() => {
    if (isResubmission || hasDocumentation) return;
    if (submissionPhase !== "success") return;
    const timer = setTimeout(() => {
      onClose();
    }, 1200); // Brief delay to show success state

    return () => clearTimeout(timer);
  }, [isResubmission, hasDocumentation, submissionPhase, onClose]);

  const resetPreviewState = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewDrop(null);
  }, []);

  const handleArtworkCommentaryMediaChange = useCallback(
    (media: string[]) => {
      setAdditionalMedia({ artwork_commentary_media: media });
    },
    [setAdditionalMedia]
  );

  const handlePreviewImageChange = useCallback(
    (url: string) => {
      setAdditionalMedia({ preview_image: url });
    },
    [setAdditionalMedia]
  );

  const handlePromoVideoChange = useCallback(
    (url: string) => {
      setAdditionalMedia({ promo_video: url });
    },
    [setAdditionalMedia]
  );

  // Phase change handler
  const handlePhaseChange = useCallback((phase: SubmissionPhase) => {
    // Any additional phase-specific handling can be done here
    console.warn(`Submission phase changed to: ${phase}`);
  }, []);

  const handleOpenPreview = useCallback(() => {
    const { imageUrl, traits, operationalData, isAdditionalActionPromised } =
      form.getSubmissionData();
    const media = form.getMediaSelection();

    setPreviewDrop(
      buildPreviewDrop({
        wave,
        traits,
        operationalData,
        isAdditionalActionPromised,
        mediaSelection: media,
        uploadArtworkUrl: imageUrl,
        connectedProfile,
      })
    );
    setIsPreviewMode(true);
  }, [connectedProfile, form, wave]);

  const handleBackToEdit = useCallback(() => {
    setIsPreviewMode(false);
  }, []);

  const handleBackFromAdditionalInfo = useCallback(() => {
    resetPreviewState();
    handleBackToArtwork();
  }, [handleBackToArtwork, resetPreviewState]);

  const handleResubmissionSubmitted = useCallback(
    async (drop: ApiDrop) => {
      await handleResubmissionSuccess(drop);
      resetPreviewState();
    },
    [handleResubmissionSuccess, resetPreviewState]
  );

  // Handle final submission
  const handleSubmit = useCallback(async () => {
    const signerAddress = identity.address;
    const authWalletAddress = getWalletAddress();
    if (
      !identity.canSubmit ||
      !signerAddress ||
      authWalletAddress?.toLowerCase() !== signerAddress.toLowerCase()
    ) {
      setToast({
        message: t(locale, "memes.submission.identity.changedBeforeSubmit"),
        type: "error",
      });
      return null;
    }
    const expectedAuthStateFingerprint = getAuthStateFingerprint({
      walletAddress: authWalletAddress,
      jwt: getAuthJwt(),
    });

    // Get submission data including all traits
    const { traits, operationalData, isAdditionalActionPromised } =
      form.getSubmissionData();
    const media = form.getMediaSelection();
    const onSubmitted = async (drop: ApiDrop | null) => {
      if (
        drop &&
        getAuthStateFingerprint({
          walletAddress: getWalletAddress(),
          jwt: getAuthJwt(),
        }) === expectedAuthStateFingerprint
      ) {
        documentationRef.current?.onDropSubmitted(drop.id);
      }
      if (drop && isResubmission) {
        await handleResubmissionSubmitted(drop);
      }

      return drop;
    };

    if (media.mediaSource === "upload") {
      if (!media.selectedFile && !media.existingMedia) {
        return null;
      }

      const result = await submitArtwork(
        {
          ...(media.selectedFile ? { imageFile: media.selectedFile } : {}),
          ...(media.existingMedia
            ? { existingMedia: media.existingMedia }
            : {}),
          traits,
          operationalData,
          isAdditionalActionPromised,
          waveId: wave.id,
          termsOfService: wave.participation.terms,
        },
        signerAddress,
        isSafeWallet,
        {
          onPhaseChange: handlePhaseChange,
          expectedAuthStateFingerprint,
          identityChangedMessage: t(
            locale,
            "memes.submission.identity.changedBeforeSubmit"
          ),
        }
      );
      return onSubmitted(result);
    }

    if (!media.isExternalValid) {
      return null;
    }

    const result = await submitArtwork(
      {
        externalMedia: {
          url: media.externalUrl,
          mimeType: media.externalMimeType,
        },
        traits,
        operationalData,
        isAdditionalActionPromised,
        waveId: wave.id,
        termsOfService: wave.participation.terms,
      },
      signerAddress,
      isSafeWallet,
      {
        onPhaseChange: handlePhaseChange,
        expectedAuthStateFingerprint,
        identityChangedMessage: t(
          locale,
          "memes.submission.identity.changedBeforeSubmit"
        ),
      }
    );
    return onSubmitted(result);
  }, [
    form,
    handlePhaseChange,
    handleResubmissionSubmitted,
    isResubmission,
    identity.address,
    identity.canSubmit,
    isSafeWallet,
    locale,
    setToast,
    submitArtwork,
    wave.id,
    wave.participation.terms,
  ]);

  const handleSubmitClick = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  const handleAcceptResubmissionAcknowledgement = useCallback(() => {
    setHasAcknowledgedResubmission(true);
  }, []);

  const shellDescription =
    isResubmission && hasAcknowledgedResubmission && !replacementDrop
      ? t(locale, "memes.submission.shell.resubmissionDescription")
      : undefined;

  let submissionContent: ReactNode;

  if (isResubmission && !hasAcknowledgedResubmission) {
    submissionContent = (
      <ResubmitAcknowledgement
        onAccept={handleAcceptResubmissionAcknowledgement}
        onCancel={requestClose}
      />
    );
  } else if (sourceDrop && replacementDrop) {
    submissionContent = (
      <ResubmitDeleteConfirmation
        originalDrop={sourceDrop}
        replacementDrop={replacementDrop}
        isDeleting={isDeletingOriginal}
        error={deleteOriginalError}
        onDeleteOriginal={handleDeleteOriginalClick}
        onKeepBoth={handleKeepBoth}
      />
    );
  } else {
    submissionContent = (
      <MemesArtSubmissionStepContent
        form={form}
        wave={wave}
        isPreviewMode={isPreviewMode}
        previewDrop={previewDrop}
        isSubmitting={isSubmitting}
        submissionPhase={submissionPhase}
        uploadProgress={uploadProgress}
        submissionError={submissionError}
        submitLabel={submitLabel}
        identity={identity}
        onClose={requestClose}
        onBackToEdit={handleBackToEdit}
        onBackFromAdditionalInfo={handleBackFromAdditionalInfo}
        onOpenPreview={handleOpenPreview}
        onSubmitClick={handleSubmitClick}
        onArtworkCommentaryMediaChange={handleArtworkCommentaryMediaChange}
        onPreviewImageChange={handlePreviewImageChange}
        onPromoVideoChange={handlePromoVideoChange}
      />
    );
  }

  return (
    <div ref={keyboardFocusContainerRef} className="tw-h-full tw-min-h-0">
      <MemesArtSubmissionShell
        title={
          isResubmission
            ? t(locale, "memes.submission.shell.resubmitTitle")
            : t(locale, "memes.submission.shell.submitTitle")
        }
        description={shellDescription}
        onClose={requestClose}
      >
        <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-col">
          <div className="tw-min-h-0 tw-flex-1">{submissionContent}</div>
          {connectedProfile?.id && !activeProfileProxy && (
            <MemesSubmissionDocumentation
              key={documentationActor}
              ref={documentationRef}
              waveId={wave.id}
              title={form.traits.title}
              description={form.traits.description}
              preferredCredit={connectedProfile.handle ?? undefined}
              visible={
                form.currentStep === SubmissionStep.ADDITIONAL_INFO ||
                hasDocumentation
              }
              onStarted={() => setDocumentationStartedBy(documentationActor)}
              onDiscardClose={onClose}
            />
          )}
        </div>
      </MemesArtSubmissionShell>
    </div>
  );
};

export default MemesArtSubmissionContainer;
