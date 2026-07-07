"use client";

import { containsDisallowedLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { DropMutationBody } from "@/components/waves/CreateDrop";
import type { CreateDropInputHandles } from "@/components/waves/CreateDropInput";
import type { MissingRequirements } from "@/components/waves/utils/getMissingRequirements";
import { getMissingRequirements } from "@/components/waves/utils/getMissingRequirements";
import { getOptimisticDrop } from "@/components/waves/utils/getOptimisticDrop";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import type { CreateDropConfig } from "@/entities/IDrop";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import type { useDropSignature } from "@/hooks/drops/useDropSignature";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import {
  filterMentionedUsers,
  filterMentionedWaves,
  getMentionedGroupsForParts,
} from "./content-helpers";
import { generateParts, toApiCreateDropParts } from "./part-builders";
import type {
  ConnectedProfile,
  CreateDropMetadataType,
  MutableCurrentRef,
  ScopedValueState,
  UploadingFile,
} from "./types";

export const useCreateDropSubmission = ({
  activeDrop,
  wave,
  isDropMode,
  canExitDropMode,
  isChatBlockedBySlowMode,
  isChatLinksRestrictionActive,
  isSlowModeSubmitBlocked,
  isLinksSubmitBlocked,
  canMentionAll,
  connectedProfile,
  submitting,
  getMarkdown,
  files,
  metadata,
  drop,
  hasPendingInlineImageUpload,
  identityValidationMessage,
  hasMetadataValidationErrors,
  hasPollValidationError,
  dropModeSessionScopeKey,
  isIdentityPickerAllowed,
  isApp,
  requestAuth,
  setToast,
  signDrop,
  submitDrop,
  addOptimisticDrop,
  processIncomingDrop,
  handleDropModeChange,
  handleDuplicateIdentitySubmissionError,
  markIdentitySubmitAttempted,
  disableIdentityPickerAutoOpen,
  getUpdatedDrop,
  createGifDrop,
  finalizeAndAddDropPart,
  refreshState,
  setSubmitting,
  setUploadingFiles,
  setFiles,
  setMetadataOpenState,
  createDropInputRef,
  shouldRefocusAfterChatSubmitRef,
  shouldCollapseOptionsAfterMarkdownSyncRef,
}: {
  readonly activeDrop: ActiveDropState | null;
  readonly wave: ApiWave;
  readonly isDropMode: boolean;
  readonly canExitDropMode: boolean;
  readonly isChatBlockedBySlowMode: boolean;
  readonly isChatLinksRestrictionActive: boolean;
  readonly isSlowModeSubmitBlocked: boolean;
  readonly isLinksSubmitBlocked: boolean;
  readonly canMentionAll: boolean;
  readonly connectedProfile: ConnectedProfile;
  readonly submitting: boolean;
  readonly getMarkdown: string | null;
  readonly files: File[];
  readonly metadata: CreateDropMetadataType[];
  readonly drop: CreateDropConfig | null;
  readonly hasPendingInlineImageUpload: boolean;
  readonly identityValidationMessage: string | null;
  readonly hasMetadataValidationErrors: boolean;
  readonly hasPollValidationError: boolean;
  readonly dropModeSessionScopeKey: string;
  readonly isIdentityPickerAllowed: boolean;
  readonly isApp: boolean;
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly setToast: (toast: AppToastInput) => void;
  readonly signDrop: ReturnType<typeof useDropSignature>["signDrop"];
  readonly submitDrop: (dropRequest: DropMutationBody) => boolean;
  readonly addOptimisticDrop: (params: {
    readonly drop: ApiDrop;
  }) => Promise<void>;
  readonly processIncomingDrop: (
    drop: ApiDrop,
    type: ProcessIncomingDropType
  ) => Promise<void>;
  readonly handleDropModeChange: (newIsDropMode: boolean) => void;
  readonly handleDuplicateIdentitySubmissionError: (error: unknown) => void;
  readonly markIdentitySubmitAttempted: () => void;
  readonly disableIdentityPickerAutoOpen: () => void;
  readonly getUpdatedDrop: () => CreateDropConfig;
  readonly createGifDrop: (gif: string) => CreateDropConfig;
  readonly finalizeAndAddDropPart: () => CreateDropConfig;
  readonly refreshState: () => void;
  readonly setSubmitting: Dispatch<SetStateAction<boolean>>;
  readonly setUploadingFiles: Dispatch<SetStateAction<UploadingFile[]>>;
  readonly setFiles: Dispatch<SetStateAction<File[]>>;
  readonly setMetadataOpenState: Dispatch<
    SetStateAction<ScopedValueState<boolean> | null>
  >;
  readonly createDropInputRef: MutableCurrentRef<CreateDropInputHandles | null>;
  readonly shouldRefocusAfterChatSubmitRef: MutableCurrentRef<boolean>;
  readonly shouldCollapseOptionsAfterMarkdownSyncRef: MutableCurrentRef<boolean>;
}) => {
  const getUpdatedDropRequest = async (
    requestBody: ApiCreateDropRequest
  ): Promise<ApiCreateDropRequest | null> => {
    if (requestBody.drop_type === ApiDropType.Chat) {
      return requestBody;
    }
    if (!wave.participation.signature_required) {
      return requestBody;
    }

    // Use direct signature if there are no terms to display
    if (!wave.participation.terms) {
      const { success, signature, signatureMessage } = await signDrop({
        drop: requestBody,
        termsOfService: null,
      });

      if (!success || !signature) {
        return null;
      }

      return {
        ...requestBody,
        signature,
        ...(signatureMessage ? { signature_message: signatureMessage } : {}),
      };
    }

    // For terms that need to be displayed, use the terms flow
    return new Promise<ApiCreateDropRequest | null>((resolve) => {
      // Define callback for when signing completes
      const handleSigningComplete = (result: {
        success: boolean;
        signature?: string | undefined;
        signatureMessage?: string | undefined;
      }) => {
        if (!result.success || !result.signature) {
          resolve(null);
          return;
        }

        const updatedDropRequest = {
          ...requestBody,
          signature: result.signature,
          ...(result.signatureMessage
            ? { signature_message: result.signatureMessage }
            : {}),
        };
        resolve(updatedDropRequest);
      };

      // Show the terms modal through a global event
      const event = new CustomEvent("showTermsModal", {
        detail: {
          drop: requestBody,
          termsOfService: wave.participation.terms,
          onComplete: handleSigningComplete,
        },
      });
      document.dispatchEvent(event);
    });
  };

  const prepareAndSubmitDrop = async (dropRequest: CreateDropConfig) => {
    if (submitting) {
      return;
    }

    if (dropRequest.drop_type === ApiDropType.Chat && isChatBlockedBySlowMode) {
      return;
    }

    if (
      dropRequest.drop_type === ApiDropType.Chat &&
      isChatLinksRestrictionActive &&
      dropRequest.parts.some((part) => containsDisallowedLink(part.content))
    ) {
      return;
    }

    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }

    if (!dropRequest.parts.length) {
      setSubmitting(false);
      return;
    }

    try {
      const generatedParts = await generateParts(
        dropRequest.parts,
        setUploadingFiles
      );
      if (!generatedParts.length) {
        setSubmitting(false);
        return;
      }
      const parts = toApiCreateDropParts(generatedParts);

      const requestBody: ApiCreateDropRequest = {
        ...dropRequest,
        mentioned_users: filterMentionedUsers({
          mentionedUsers: dropRequest.mentioned_users,
          parts: dropRequest.parts,
        }),
        mentioned_waves: filterMentionedWaves({
          mentionedWaves: dropRequest.mentioned_waves ?? [],
          parts: dropRequest.parts,
        }),
        mentioned_groups: getMentionedGroupsForParts({
          parts: dropRequest.parts,
          canMentionAll,
        }),
        metadata: dropRequest.metadata,
        wave_id: wave.id,
        parts,
      };

      const updatedDropRequest = await getUpdatedDropRequest(requestBody);
      if (!updatedDropRequest) {
        setSubmitting(false);
        return;
      }

      const optimisticDrop = getOptimisticDrop(
        {
          ...updatedDropRequest,
          parts: updatedDropRequest.parts.map((part, index) => ({
            ...part,
            media: generatedParts[index]?.media ?? part.media,
          })),
        },
        connectedProfile,
        wave,
        activeDrop,
        isDropMode ? ApiDropType.Participatory : ApiDropType.Chat
      );

      const submitAccepted = submitDrop({
        drop: updatedDropRequest,
        dropId: optimisticDrop?.id ?? null,
        onSuccess:
          isDropMode && canExitDropMode
            ? () => handleDropModeChange(false)
            : undefined,
        onError:
          isDropMode && canExitDropMode
            ? handleDuplicateIdentitySubmissionError
            : undefined,
      });
      if (!submitAccepted) {
        return;
      }

      const shouldKeepChatFocused =
        updatedDropRequest.drop_type === ApiDropType.Chat;

      if (optimisticDrop) {
        const optimisticDropWithAttachments = {
          ...optimisticDrop,
          parts: optimisticDrop.parts.map((part, index) => ({
            ...part,
            attachments: generatedParts[index]?.uploaded_attachments ?? [],
          })),
        };
        addOptimisticDrop({ drop: optimisticDropWithAttachments });
        setTimeout(
          () =>
            processIncomingDrop(
              optimisticDropWithAttachments,
              ProcessIncomingDropType.DROP_INSERT
            ),
          0
        );
      }
      if (getMarkdown?.length) {
        shouldCollapseOptionsAfterMarkdownSyncRef.current = false;
        createDropInputRef.current?.clearEditorState();
      }
      if (shouldKeepChatFocused) {
        shouldRefocusAfterChatSubmitRef.current = true;
      } else if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (isApp && !shouldKeepChatFocused) {
        void import("@capacitor/core").then(({ Capacitor }) => {
          if (Capacitor.getPlatform() === "android") {
            void import("@capacitor/keyboard").then(({ Keyboard }) => {
              void Keyboard.hide().catch(() => {});
            });
          }
        });
      }
      setFiles([]);
      if (isIdentityPickerAllowed) {
        disableIdentityPickerAutoOpen();
      }
      refreshState();
    } catch (error) {
      setToast({
        type: "error",
        title: "Couldn't submit this drop.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const missingRequirements = useMemo<MissingRequirements>(
    () =>
      getMissingRequirements(
        isDropMode,
        metadata,
        files,
        wave.participation.required_media
      ),
    [files, isDropMode, metadata, wave.participation.required_media]
  );

  const onDrop = async (): Promise<void> => {
    if (submitting) {
      return;
    }

    if (hasPendingInlineImageUpload) {
      return;
    }

    if (isSlowModeSubmitBlocked) {
      return;
    }

    if (isLinksSubmitBlocked) {
      return;
    }

    if (identityValidationMessage) {
      markIdentitySubmitAttempted();
      return;
    }

    if (hasMetadataValidationErrors) {
      setMetadataOpenState({
        scopeKey: dropModeSessionScopeKey,
        value: true,
      });
      return;
    }

    if (hasPollValidationError) {
      return;
    }

    if (
      missingRequirements.metadata.length ||
      missingRequirements.media.length
    ) {
      return;
    }

    const hasPartsInDrop = (drop?.parts.length ?? 0) > 0;
    const hasCurrentContent =
      (getMarkdown?.trim().length ?? 0) > 0 || files.length > 0;

    if (hasPartsInDrop && hasCurrentContent) {
      finalizeAndAddDropPart();
      return;
    }

    await prepareAndSubmitDrop(getUpdatedDrop());
  };

  const onGifDrop = async (gif: string): Promise<void> => {
    if (submitting) {
      return;
    }
    if (hasPendingInlineImageUpload) {
      return;
    }
    if (identityValidationMessage) {
      markIdentitySubmitAttempted();
      return;
    }

    if (hasMetadataValidationErrors) {
      setMetadataOpenState({
        scopeKey: dropModeSessionScopeKey,
        value: true,
      });
      return;
    }

    if (hasPollValidationError) {
      return;
    }

    await prepareAndSubmitDrop(createGifDrop(gif));
  };

  return {
    missingRequirements,
    onDrop,
    onGifDrop,
  };
};
