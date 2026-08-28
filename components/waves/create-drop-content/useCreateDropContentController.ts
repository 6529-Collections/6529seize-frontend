"use client";

import { ApiDropType } from "@/generated/models/ApiDropType";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import type { EditorState } from "lexical";
import {
  type Dispatch,
  type FocusEvent,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import type { CreateDropPollDraft } from "../CreateDropPoll";

import { containsDisallowedLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { getReferencedNftsFromEditorState } from "@/components/drops/create/lexical/utils/nftReferenceDetection";
import { getMentionedUsersFromEditorState } from "@/components/drops/create/lexical/utils/userMentionDetection";
import { getMentionedWavesFromEditorState } from "@/components/drops/create/lexical/utils/waveMentionDetection";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { isReservedIdentitySubmissionMetadataKey } from "@/helpers/waves/identity-submission-metadata";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { generateMetadataId, useDropMetadata } from "../hooks/useDropMetadata";
import {
  hasPendingInlineImageUploadDrop,
  hasPendingInlineImageUploadMarkdown,
} from "@/helpers/waves/inline-image-upload.helpers";
import { getIdentitySubmissionMetadataErrors } from "../utils/identitySubmissionMetadataValidation";
import { normalizeCurationDropInput } from "../utils/validateCurationDropUrl";
import {
  areHandlesEqual,
  isChatLinkRestrictionApplicable,
} from "@/helpers/waves/chat-link-restriction.helpers";
import { useLatestEditableChatDropTarget } from "../hooks/useLatestEditableChatDropTarget";
import type { CreateDropLayoutProps } from "./CreateDropLayout";
import {
  canAddDropPart,
  canSubmitComposerAction,
  canSubmitDrop,
  createMetadataHandlers,
  hasMetadataContent,
  isDuplicateIdentitySubmissionError,
} from "./content-helpers";
import { useCreateDropDraftState } from "./useCreateDropDraftState";
import { useCreateDropFileHandlers } from "./useCreateDropFileHandlers";
import { useCreateDropFocusBehavior } from "./useCreateDropFocusBehavior";
import { useCreateDropIdentityState } from "./useCreateDropIdentityState";
import { useCreateDropSubmission } from "./useCreateDropSubmission";
import { useCreateDropTyping } from "./useCreateDropTyping";
import { exportComposerMarkdown } from "./exportComposerMarkdown";
import { useCreateDropContainerWidth } from "./useCreateDropContainerWidth";
import { useCreateDropPollActions } from "./useCreateDropPollActions";
import { useStormPartActions } from "./useStormPartActions";
import type {
  CreateDropContentProps,
  ScopedValueState,
  UploadingFile,
} from "./types";

// eslint-disable-next-line max-lines-per-function -- This controller intentionally composes the focused composer hooks into one stable layout contract.
export function useCreateDropContentController({
  activeDrop,
  onCancelReplyQuote,
  onReplyTargetUnavailable,
  wave,
  drop,
  isStormMode,
  isDropMode,
  dropId,
  setDrop,
  setIsStormMode,
  onDropModeChange,
  onSwitchToDropModeWithUrl,
  submitDrop,
  dropModeToggleExitLabel,
  canExitDropMode,
  isChatBlockedBySlowMode,
  submissionExperience,
  canSubmitCurationUrl = true,
  curationUrlSubmitRestrictionMessage = null,
  externalAttachmentDrop,
  onExternalAttachmentDropConsumed,
  termsSignatureFlowEnabled = true,
  identityPickerPlacement = "modal",
  focusOnInitialActiveDrop = false,
  initialMarkdown = null,
  initialMarkdownKey = null,
}: CreateDropContentProps): CreateDropLayoutProps {
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { isApp } = useDeviceInfo();
  const isMobile = useIsMobileScreen();
  const locale = useBrowserLocale();
  const { actionsContainerRef, isWideContainer, setActionsContainerRef } =
    useCreateDropContainerWidth();
  const prevWaveIdRef = useRef(wave.id);
  const { editingDropId, setEditingDropId } = useEditingDrop();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useAuth();
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const waveChatScroll = useWaveChatScrollOptional();
  const { signDrop } = useDropSignature();

  const [submitting, setSubmitting] = useState(false);
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
  const [{ editorState, markdown: getMarkdown }, setEditorContent] = useState<{
    readonly editorState: EditorState | null;
    readonly markdown: string | null;
  }>({ editorState: null, markdown: null });
  const setEditorState = useCallback<
    Dispatch<SetStateAction<EditorState | null>>
  >((nextEditorState) => {
    setEditorContent((current) => {
      const resolvedEditorState =
        typeof nextEditorState === "function"
          ? nextEditorState(current.editorState)
          : nextEditorState;

      if (resolvedEditorState === current.editorState) {
        return current;
      }

      return {
        editorState: resolvedEditorState,
        markdown: resolvedEditorState
          ? exportComposerMarkdown(resolvedEditorState)
          : null,
      };
    });
  }, []);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [metadataOpenState, setMetadataOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [pollDraftState, setPollDraftState] =
    useState<ScopedValueState<CreateDropPollDraft> | null>(null);
  const [showOptionsState, setShowOptionsState] =
    useState<ScopedValueState<boolean> | null>(null);
  const closeOnNextInputRef = useRef(false);
  const prevIsDropModeRef = useRef(isDropMode);
  const [dropModeSessionEpoch, setDropModeSessionEpoch] = useState(0);
  useLayoutEffect(() => {
    if (prevWaveIdRef.current === wave.id) {
      return;
    }

    prevWaveIdRef.current = wave.id;
    closeOnNextInputRef.current = false;
    setIsStormMode(false);
  }, [setIsStormMode, wave.id]);
  const dropModeSessionScopeKey = `${wave.id}:drop-mode:${dropModeSessionEpoch}`;
  const keepDesktopOptionsVisible = !isMobile && isWideContainer;
  // Keep the scoped collapse state live so resizing back to a narrow layout
  // restores the chevron immediately.
  const showOptions =
    keepDesktopOptionsVisible ||
    (showOptionsState?.scopeKey === wave.id && showOptionsState.value);

  useLayoutEffect(() => {
    if (prevIsDropModeRef.current && !isDropMode) {
      setDropModeSessionEpoch((prev) => prev + 1);
    }

    prevIsDropModeRef.current = isDropMode;
  }, [isDropMode]);

  const isCurationSubmissionExperience =
    submissionExperience === WaveSubmissionExperience.CURATION_LEGACY;
  const isMetadataOpen =
    isDropMode &&
    (metadataOpenState?.scopeKey === dropModeSessionScopeKey
      ? metadataOpenState.value
      : false);
  const closeMetadata = useCallback(() => {
    setMetadataOpenState({
      scopeKey: dropModeSessionScopeKey,
      value: false,
    });
  }, [dropModeSessionScopeKey]);
  const handleDropModeChange = useCallback(
    (newIsDropMode: boolean) => {
      if (!newIsDropMode) {
        closeMetadata();
      }
      onDropModeChange(newIsDropMode);
    },
    [closeMetadata, onDropModeChange]
  );
  const {
    identitySubmissionMode,
    isIdentitySubmissionExperience,
    isIdentityPickerAllowed,
    selectedIdentitySelection,
    selectedIdentity,
    viewerIdentity,
    identityPickerErrorMessage,
    isIdentityPickerOpen,
    canDismissIdentityPicker,
    identityValidationMessage,
    showIdentityValidationMessage,
    showInlineIdentityPicker,
    showIdentityField,
    showModalIdentityPicker,
    showComposer,
    openIdentityPicker,
    closeIdentityPicker,
    closeIdentitySelectionPanel,
    handleIdentitySelection,
    markIdentitySubmitAttempted,
    disableIdentityPickerAutoOpen,
    resetIdentitySubmissionState,
  } = useCreateDropIdentityState({
    wave,
    submissionExperience,
    connectedProfile,
    isDropMode,
    dropModeSessionEpoch,
    canExitDropMode,
    identityPickerPlacement,
    handleDropModeChange,
  });
  const requiredMetadata = useMemo(() => {
    if (!isIdentitySubmissionExperience) {
      return wave.participation.required_metadata;
    }

    return wave.participation.required_metadata.filter(
      (item) => !isReservedIdentitySubmissionMetadataKey(item.name)
    );
  }, [isIdentitySubmissionExperience, wave.participation.required_metadata]);

  const { metadata, setMetadata, initialMetadata } = useDropMetadata({
    isDropMode,
    requiredMetadata,
  });
  const metadataErrorById = useMemo(
    () =>
      getIdentitySubmissionMetadataErrors({
        isIdentitySubmissionExperience:
          isIdentitySubmissionExperience && isDropMode,
        metadata,
      }),
    [isDropMode, isIdentitySubmissionExperience, metadata]
  );
  const hasMetadataValidationErrors = Object.keys(metadataErrorById).length > 0;

  const hasMetadata = useMemo(() => hasMetadataContent(metadata), [metadata]);
  const canMentionAll = wave.wave.authenticated_user_eligible_for_admin;
  const canCreatePoll = canMentionAll === true && !isDropMode;
  const pollDraft =
    canCreatePoll && pollDraftState?.scopeKey === wave.id
      ? pollDraftState.value
      : null;
  const {
    hasPollValidationError,
    hasValidPoll,
    markPollQuestionTouched,
    pollQuestionError,
    pollValidation,
    removePoll,
    togglePoll,
    updatePollDraft,
  } = useCreateDropPollActions({
    canCreatePoll,
    isStormMode,
    locale,
    markdown: getMarkdown,
    pollDraft,
    setPollDraftState,
    waveId: wave.id,
  });

  const collapseOptions = useCallback(() => {
    setShowOptionsState((current) =>
      current?.scopeKey === wave.id && current.value === false
        ? current
        : { scopeKey: wave.id, value: false }
    );
    closeOnNextInputRef.current = false;
  }, [wave.id]);
  const currentPartMentionedGroups = useMemo(
    () =>
      editorState
        ? getMentionedGroupsFromEditorState(editorState, canMentionAll)
        : [],
    [canMentionAll, editorState]
  );
  // Derived from the editor rather than from the session pick-registry: mention
  // nodes keep their profile id across the editor-state JSON a draft is stored
  // as, so a restored draft still submits real mentions instead of dead
  // `@[handle]` text.
  const currentPartMentionedUsers = useMemo(
    () => (editorState ? getMentionedUsersFromEditorState(editorState) : []),
    [editorState]
  );
  const currentPartMentionedWaves = useMemo(
    () => (editorState ? getMentionedWavesFromEditorState(editorState) : []),
    [editorState]
  );
  const currentPartReferencedNfts = useMemo(
    () => (editorState ? getReferencedNftsFromEditorState(editorState) : []),
    [editorState]
  );

  useCreateDropTyping({ markdown: getMarkdown, waveId: wave.id });

  const hasPendingInlineImageUpload = useMemo(
    () =>
      hasPendingInlineImageUploadMarkdown(getMarkdown) ||
      (drop ? hasPendingInlineImageUploadDrop(drop) : false),
    [drop, getMarkdown]
  );

  const isSlowModeSubmitBlocked = isChatBlockedBySlowMode && !isDropMode;
  const isChatLinksRestrictionActive = isChatLinkRestrictionApplicable({
    dropType: ApiDropType.Chat,
    linksDisabled: wave.chat.links_disabled === true,
    isWaveAdmin: wave.wave.authenticated_user_eligible_for_admin === true,
    isWaveCreator: areHandlesEqual(
      connectedProfile?.handle,
      wave.author.handle
    ),
  });
  const hasChatContentWithLink = useMemo(() => {
    if (!isChatLinksRestrictionActive || isDropMode) {
      return false;
    }

    const contentParts = [
      getMarkdown,
      ...(drop?.parts.map((part) => part.content ?? null) ?? []),
    ];

    return contentParts.some(containsDisallowedLink);
  }, [drop?.parts, getMarkdown, isChatLinksRestrictionActive, isDropMode]);
  const isLinksSubmitBlocked = hasChatContentWithLink;
  const canSubmit =
    canSubmitDrop({
      markdown: getMarkdown,
      files,
      parts: drop?.parts ?? [],
      hasMetadata,
      hasValidPoll,
      hasPoll: pollDraft !== null,
      hasPendingInlineImageUpload,
      hasMetadataValidationErrors,
      hasPollValidationError,
    }) &&
    !isSlowModeSubmitBlocked &&
    !isLinksSubmitBlocked;
  const dropForPartLimit = useMemo(() => {
    if (editingPartIndex === null || !drop) {
      return drop;
    }

    return {
      ...drop,
      parts: drop.parts.filter((_, index) => index !== editingPartIndex),
    };
  }, [drop, editingPartIndex]);
  const canAddPart = canAddDropPart({
    markdown: getMarkdown,
    files,
    drop: dropForPartLimit,
    hasPendingInlineImageUpload,
  });
  const hasCurrentDraft =
    (getMarkdown?.trim().length ?? 0) > 0 ||
    files.length > 0 ||
    uploadingFiles.length > 0 ||
    hasPendingInlineImageUpload;
  const latestEditableChatDropTarget = useLatestEditableChatDropTarget({
    waveId: wave.id,
    connectedProfile,
    isProxyMode: Boolean(activeProfileProxy),
  });
  const isComposerReadyForArrowEdit =
    !isDropMode &&
    !isStormMode &&
    !submitting &&
    editingDropId === null &&
    activeDrop === null &&
    (getMarkdown?.trim().length ?? 0) === 0 &&
    files.length === 0 &&
    (drop?.parts.length ?? 0) === 0;
  const canEditLastDropWithArrow =
    isComposerReadyForArrowEdit && latestEditableChatDropTarget !== null;
  const handleRequestEditLastDrop = useCallback((): boolean => {
    if (!isComposerReadyForArrowEdit || latestEditableChatDropTarget === null) {
      return false;
    }

    setEditingDropId(latestEditableChatDropTarget.id);
    waveChatScroll?.requestScrollToSerialNo({
      waveId: wave.id,
      serialNo: latestEditableChatDropTarget.serialNo,
    });
    return true;
  }, [
    isComposerReadyForArrowEdit,
    setEditingDropId,
    latestEditableChatDropTarget,
    wave.id,
    waveChatScroll,
  ]);
  const normalizedCurationDropUrl = useMemo(() => {
    if (!isCurationSubmissionExperience || isDropMode) {
      return null;
    }
    return normalizeCurationDropInput(getMarkdown ?? "");
  }, [getMarkdown, isCurationSubmissionExperience, isDropMode]);
  const showCurationDropModeWarning =
    !isDropMode &&
    normalizedCurationDropUrl !== null &&
    isCurationSubmissionExperience &&
    (canSubmitCurationUrl || !!curationUrlSubmitRestrictionMessage);

  const {
    createDropInputRef,
    shouldRefocusAfterChatSubmitRef,
    dropEditorRefreshKey,
    onReferencedNft,
    onMentionedUser,
    onMentionedWave,
    restoreMentionedEntities,
    getUpdatedDrop,
    createGifDrop,
    finalizeAndAddDropPart: finalizeAndAddDropPartDraft,
    refreshState,
  } = useCreateDropDraftState({
    metadata,
    initialMetadata,
    selectedIdentity,
    isIdentitySubmissionExperience,
    isDropMode,
    canCreatePoll,
    pollRequest: pollValidation.request,
    getMarkdown,
    files,
    drop,
    activeDrop,
    hasMetadata,
    hasValidPoll,
    isSafeWallet,
    address,
    canMentionAll,
    currentPartMentionedGroups,
    currentPartMentionedUsers,
    currentPartMentionedWaves,
    currentPartReferencedNfts,
    submitting,
    setDrop,
    setFiles,
    setEditorState,
    setMetadata,
    setPollDraftState,
    setMetadataOpenState,
    setShowOptionsState,
    resetIdentitySubmissionState,
    closeOnNextInputRef,
  });

  const showMentionAliasExpansionError = useCallback(() => {
    setToast({
      type: "error",
      title: t(locale, "waves.composer.mentionShortcuts.loadErrorTitle"),
      message: t(locale, "waves.composer.mentionShortcuts.loadErrorMessage"),
    });
  }, [locale, setToast]);

  const {
    breakIntoStorm: startStorm,
    finalizeResolvedDropPart,
    onCancelPartEdit,
    onDiscardStorm,
    onEditPart,
    onMovePart,
    onRemovePart,
  } = useStormPartActions({
    canAddPart,
    canMentionAll,
    collapseOptions,
    createDropInputRef,
    drop,
    editingPartIndex,
    finalizeAndAddDropPartDraft,
    keepOptionsVisible: keepDesktopOptionsVisible,
    onMentionAliasExpansionError: showMentionAliasExpansionError,
    refreshState,
    setDrop,
    setEditingPartIndex,
    setEditorState,
    setFiles,
    setIsStormMode,
    submitting,
  });
  const breakIntoStorm = useCallback(() => {
    if (pollDraft !== null) {
      return;
    }

    void startStorm();
  }, [pollDraft, startStorm]);

  useCreateDropFocusBehavior({
    activeDrop,
    isApp,
    focusOnInitialActiveDrop,
    createDropInputRef,
  });

  const handleDuplicateIdentitySubmissionError = useCallback(
    (error: unknown) => {
      if (!canExitDropMode) {
        return;
      }

      if (isDuplicateIdentitySubmissionError(error)) {
        handleDropModeChange(false);
      }
    },
    [canExitDropMode, handleDropModeChange]
  );

  const replyTargetRecovery = useMemo(
    () => ({
      locale,
      pollDraft,
      setMetadata,
      setPollDraftState,
      onReplyTargetUnavailable,
      restoreMentionedEntities,
    }),
    [
      locale,
      onReplyTargetUnavailable,
      pollDraft,
      restoreMentionedEntities,
      setMetadata,
      setPollDraftState,
    ]
  );

  const { missingRequirements, onDrop, onGifDrop } = useCreateDropSubmission({
    activeDrop,
    wave,
    isDropMode,
    isStormMode,
    canExitDropMode,
    isChatBlockedBySlowMode,
    isChatLinksRestrictionActive,
    isSlowModeSubmitBlocked,
    isLinksSubmitBlocked,
    canMentionAll,
    connectedProfile,
    replyTargetRecovery,
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
    finalizeAndAddDropPart: finalizeResolvedDropPart,
    refreshState,
    setSubmitting,
    setUploadingFiles,
    setFiles,
    setDrop,
    setIsStormMode,
    setMetadataOpenState,
    createDropInputRef,
    shouldRefocusAfterChatSubmitRef,
  });

  const onSwitchToDropMode = useCallback(() => {
    if (!normalizedCurationDropUrl) {
      return;
    }
    onSwitchToDropModeWithUrl(normalizedCurationDropUrl);
  }, [normalizedCurationDropUrl, onSwitchToDropModeWithUrl]);

  const { handleFileChange, removeFile } = useCreateDropFileHandlers({
    drop,
    files,
    keepOptionsVisible: keepDesktopOptionsVisible,
    waveId: wave.id,
    externalAttachmentDrop,
    onExternalAttachmentDropConsumed,
    setToast,
    setFiles,
    setDrop,
    setShowOptionsState,
    closeOnNextInputRef,
  });

  const handleSetShowOptions = useCallback(
    (next: boolean) => {
      setShowOptionsState({ scopeKey: wave.id, value: next });
      if (keepDesktopOptionsVisible) {
        closeOnNextInputRef.current = false;
        return;
      }
      closeOnNextInputRef.current = next;
    },
    [keepDesktopOptionsVisible, wave.id]
  );

  const handleEditorStateChange = useCallback(
    (newEditorState: EditorState) => {
      const nextMarkdown = exportComposerMarkdown(newEditorState);
      setEditorContent({
        editorState: newEditorState,
        markdown: nextMarkdown,
      });

      if (
        nextMarkdown.trim().length > 0 ||
        (!keepDesktopOptionsVisible && closeOnNextInputRef.current)
      ) {
        collapseOptions();
      }
    },
    [collapseOptions, keepDesktopOptionsVisible]
  );

  const handleEditorBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      markPollQuestionTouched();
      if (keepDesktopOptionsVisible) {
        return;
      }
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && actionsContainerRef.current?.contains(nextTarget)) {
        return;
      }
      setShowOptionsState({ scopeKey: wave.id, value: false });
      closeOnNextInputRef.current = false;
    },
    [
      actionsContainerRef,
      keepDesktopOptionsVisible,
      markPollQuestionTouched,
      wave.id,
    ]
  );

  const openMetadata = useCallback(() => {
    setMetadataOpenState({
      scopeKey: dropModeSessionScopeKey,
      value: true,
    });
  }, [dropModeSessionScopeKey]);

  const { onChangeKey, onChangeValue, onAddMetadata, onRemoveMetadata } =
    createMetadataHandlers({
      metadata,
      setMetadata,
      generateMetadataId,
    });

  // Clear active reply/quote when entering edit mode on mobile
  useEffect(() => {
    if (isApp && editingDropId && activeDrop) {
      onCancelReplyQuote();
    }
  }, [isApp, editingDropId, activeDrop, onCancelReplyQuote]);

  const animateOptions = showOptionsState?.scopeKey === wave.id;

  return {
    activeDrop,
    onCancelReplyQuote,
    dropId,
    submitting,
    wave,
    isApp,
    isDropMode,
    isStormModeActive: isStormMode,
    showIdentityField,
    showInlineIdentityPicker,
    showModalIdentityPicker,
    isIdentityPickerOpen,
    showComposer,
    identitySubmissionMode,
    selectedIdentitySelection,
    viewerIdentity,
    showIdentityValidationMessage,
    identityValidationMessage,
    openIdentityPicker,
    canExitDropMode,
    dropModeToggleExitLabel,
    closeIdentitySelectionPanel,
    identityPickerErrorMessage,
    canDismissIdentityPicker,
    closeIdentityPicker,
    handleIdentitySelection,
    setActionsContainerRef,
    isLinksSubmitBlocked,
    canAddPart,
    hasCurrentDraft,
    isCompactLayout: !keepDesktopOptionsVisible,
    showOptions,
    animateOptions,
    missingRequirements,
    canCreatePoll,
    hasPoll: pollDraft !== null,
    handleFileChange,
    openMetadata,
    togglePoll,
    breakIntoStorm,
    editingPartIndex,
    onCancelPartEdit,
    onEditPart,
    onMovePart,
    onRemovePart,
    onDiscardStorm,
    handleSetShowOptions,
    onGifDrop,
    dropEditorRefreshKey,
    createDropInputRef,
    editorState,
    canMentionAll,
    canSubmit: canSubmitComposerAction({
      canAddPart,
      canSubmit,
      editingPartIndex,
      isStormMode,
    }),
    handleEditorStateChange,
    handleEditorBlur,
    onReferencedNft,
    onMentionedUser,
    onMentionedWave,
    canEditLastDropWithArrow,
    handleRequestEditLastDrop,
    initialMarkdown,
    initialMarkdownKey,
    onDrop,
    pollDraft,
    pollQuestionError,
    pollValidationError: pollValidation.error,
    updatePollDraft,
    removePoll,
    showCurationDropModeWarning,
    canSubmitCurationUrl,
    curationUrlSubmitRestrictionMessage,
    onSwitchToDropMode,
    isMetadataOpen,
    metadata,
    metadataErrorById,
    onChangeKey,
    onChangeValue,
    onAddMetadata,
    onRemoveMetadata,
    closeMetadata,
    drop,
    files,
    uploadingFiles,
    removeFile,
    termsSignatureFlowEnabled,
    suppressInitialHeightAnimation: focusOnInitialActiveDrop,
  };
}
