"use client";

import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useEditingDrop } from "@/contexts/EditingDropContext";
import type { EditorState } from "lexical";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/Auth";
import { HASHTAG_TRANSFORMER } from "../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../drops/create/lexical/transformers/ImageTransformer";
import { MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/MentionTransformer";
import { WAVE_MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/WaveMentionTransformer";
import { GROUP_MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/GroupMentionTransformer";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import {
  createDefaultDropPollDraft,
  validateCreateDropPollDraft,
  type CreateDropPollDraft,
} from "./CreateDropPoll";

import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import { containsDisallowedLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { WsMessageType } from "@/helpers/Types";
import { isReservedIdentitySubmissionMetadataKey } from "@/helpers/waves/identity-submission-metadata";
import { normalizeTypedEmojiShortcuts } from "@/helpers/waves/typed-emoji-shortcuts";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWebSocket } from "@/services/websocket";
import throttle from "lodash/throttle";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { EMOJI_TRANSFORMER } from "../drops/create/lexical/transformers/EmojiTransformer";
import { generateMetadataId, useDropMetadata } from "./hooks/useDropMetadata";
import {
  hasPendingInlineImageUploadDrop,
  hasPendingInlineImageUploadMarkdown,
} from "@/helpers/waves/inline-image-upload.helpers";
import { getIdentitySubmissionMetadataErrors } from "./utils/identitySubmissionMetadataValidation";
import { normalizeCurationDropInput } from "./utils/validateCurationDropUrl";
import {
  areHandlesEqual,
  isChatLinkRestrictionApplicable,
} from "@/helpers/waves/chat-link-restriction.helpers";
import { useLatestEditableChatDropTarget } from "./hooks/useLatestEditableChatDropTarget";
import CreateDropLayout from "./create-drop-content/CreateDropLayout";
import {
  canAddDropPart,
  canSubmitDrop,
  createMetadataHandlers,
  hasMetadataContent,
  isDuplicateIdentitySubmissionError,
} from "./create-drop-content/content-helpers";
import { useCreateDropDraftState } from "./create-drop-content/useCreateDropDraftState";
import { useCreateDropFileHandlers } from "./create-drop-content/useCreateDropFileHandlers";
import { useCreateDropFocusBehavior } from "./create-drop-content/useCreateDropFocusBehavior";
import { useCreateDropIdentityState } from "./create-drop-content/useCreateDropIdentityState";
import { useCreateDropSubmission } from "./create-drop-content/useCreateDropSubmission";
import type {
  CreateDropContentProps,
  ScopedValueState,
  UploadingFile,
} from "./create-drop-content/types";

export type {
  CreateDropMetadataType,
  UploadingFile,
} from "./create-drop-content/types";

const CONTAINER_WIDTH_THRESHOLD = 500;

const CreateDropContent: React.FC<CreateDropContentProps> = ({
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
}) => {
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { send } = useWebSocket();
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  const [actionsContainerElement, setActionsContainerElement] =
    useState<HTMLDivElement | null>(null);
  const shouldAnimateOptionsRef = useRef(false);
  const prevWaveIdRef = useRef(wave.id);
  const [isWideContainer, setIsWideContainer] = useState(false);
  const { editingDropId, setEditingDropId } = useEditingDrop();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useAuth();
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const waveChatScroll = useWaveChatScrollOptional();
  const { signDrop } = useDropSignature();

  const [submitting, setSubmitting] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [metadataOpenState, setMetadataOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [pollDraftState, setPollDraftState] =
    useState<ScopedValueState<CreateDropPollDraft> | null>(null);
  const [showOptionsState, setShowOptionsState] =
    useState<ScopedValueState<boolean> | null>(null);
  const closeOnNextInputRef = useRef(false);
  const shouldCollapseOptionsAfterMarkdownSyncRef = useRef(false);
  const prevIsDropModeRef = useRef(isDropMode);
  const [dropModeSessionEpoch, setDropModeSessionEpoch] = useState(0);
  const isWaveChanged = prevWaveIdRef.current !== wave.id;
  if (isWaveChanged) {
    prevWaveIdRef.current = wave.id;
    shouldAnimateOptionsRef.current = false;
    closeOnNextInputRef.current = false;
    shouldCollapseOptionsAfterMarkdownSyncRef.current = false;
  }
  const dropModeSessionScopeKey = `${wave.id}:drop-mode:${dropModeSessionEpoch}`;
  const showOptions =
    showOptionsState?.scopeKey === wave.id
      ? showOptionsState.value
      : isWideContainer;

  const setActionsContainerRef = useCallback((node: HTMLDivElement | null) => {
    actionsContainerRef.current = node;
    setActionsContainerElement(node);
  }, []);

  useLayoutEffect(() => {
    if (!actionsContainerElement) return;

    const setWidthState = (width: number) => {
      const isWide = width >= CONTAINER_WIDTH_THRESHOLD;
      setIsWideContainer((prev) => (prev === isWide ? prev : isWide));
    };

    const measureWidth = () => {
      setWidthState(actionsContainerElement.getBoundingClientRect().width);
    };

    measureWidth();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidthState(entry.contentRect.width);
      }
    });

    observer.observe(actionsContainerElement);
    return () => observer.disconnect();
  }, [actionsContainerElement]);

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
  const pollValidation = useMemo(
    () => validateCreateDropPollDraft(pollDraft),
    [pollDraft]
  );
  const hasValidPoll = pollValidation.request !== null;
  const hasPollValidationError =
    pollDraft !== null && pollValidation.error !== null;

  const getMarkdown = useMemo(
    () =>
      editorState
        ? normalizeTypedEmojiShortcuts(
            exportDropMarkdown(editorState, [
              ...SAFE_MARKDOWN_TRANSFORMERS,
              MENTION_TRANSFORMER,
              ...(canMentionAll ? [GROUP_MENTION_TRANSFORMER] : []),
              HASHTAG_TRANSFORMER,
              WAVE_MENTION_TRANSFORMER,
              IMAGE_TRANSFORMER,
              EMOJI_TRANSFORMER,
            ])
          )
        : null,
    [canMentionAll, editorState]
  );
  const collapseOptions = useCallback(() => {
    shouldAnimateOptionsRef.current = true;
    setShowOptionsState((current) =>
      current?.scopeKey === wave.id && current.value === false
        ? current
        : { scopeKey: wave.id, value: false }
    );
    closeOnNextInputRef.current = false;
  }, [wave.id]);
  useLayoutEffect(() => {
    if (!shouldCollapseOptionsAfterMarkdownSyncRef.current) {
      return;
    }

    shouldCollapseOptionsAfterMarkdownSyncRef.current = false;

    if ((getMarkdown?.trim().length ?? 0) === 0) {
      return;
    }

    collapseOptions();
  }, [collapseOptions, getMarkdown]);
  const currentPartMentionedGroups = useMemo(
    () =>
      editorState
        ? getMentionedGroupsFromEditorState(editorState, canMentionAll)
        : [],
    [canMentionAll, editorState]
  );

  const sendTyping = React.useCallback(() => {
    send(WsMessageType.USER_IS_TYPING, { wave_id: wave.id });
  }, [send, wave.id]);

  const throttleHandle = useMemo(() => {
    return throttle(sendTyping, 4000);
  }, [sendTyping]);

  useEffect(() => {
    if (!getMarkdown?.length) {
      return;
    }
    throttleHandle();
  }, [getMarkdown, throttleHandle]);

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
      hasPendingInlineImageUpload,
      hasMetadataValidationErrors,
      hasPollValidationError,
    }) &&
    !isSlowModeSubmitBlocked &&
    !isLinksSubmitBlocked;
  const canAddPart = canAddDropPart({
    markdown: getMarkdown,
    files,
    drop,
    hasPendingInlineImageUpload,
  });
  const latestEditableChatDropTarget = useLatestEditableChatDropTarget({
    waveId: wave.id,
    connectedProfile,
    isProxyMode: Boolean(activeProfileProxy),
  });
  const canEditLastDropWithArrow =
    !isDropMode &&
    !isStormMode &&
    !submitting &&
    editingDropId === null &&
    activeDrop === null &&
    (getMarkdown?.trim().length ?? 0) === 0 &&
    files.length === 0 &&
    (drop?.parts.length ?? 0) === 0 &&
    latestEditableChatDropTarget !== null;
  const handleRequestEditLastDrop = useCallback((): boolean => {
    if (!canEditLastDropWithArrow || !latestEditableChatDropTarget) {
      return false;
    }

    setEditingDropId(latestEditableChatDropTarget.id);
    waveChatScroll?.requestScrollToSerialNo({
      waveId: wave.id,
      serialNo: latestEditableChatDropTarget.serialNo,
    });
    return true;
  }, [
    canEditLastDropWithArrow,
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
    !!normalizedCurationDropUrl &&
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
    finalizeAndAddDropPart,
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
    submitting,
    setDrop,
    setFiles,
    setEditorState,
    setMetadata,
    setPollDraftState,
    setMetadataOpenState,
    setShowOptionsState,
    resetIdentitySubmissionState,
    shouldAnimateOptionsRef,
    closeOnNextInputRef,
    shouldCollapseOptionsAfterMarkdownSyncRef,
  });

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
    finalizeAndAddDropPart,
    refreshState,
    setSubmitting,
    setUploadingFiles,
    setFiles,
    setDrop,
    setIsStormMode,
    setMetadataOpenState,
    createDropInputRef,
    shouldRefocusAfterChatSubmitRef,
    shouldCollapseOptionsAfterMarkdownSyncRef,
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
    isWideContainer,
    waveId: wave.id,
    externalAttachmentDrop,
    onExternalAttachmentDropConsumed,
    setToast,
    setFiles,
    setDrop,
    setShowOptionsState,
    shouldAnimateOptionsRef,
    closeOnNextInputRef,
  });

  const handleSetShowOptions = useCallback(
    (next: boolean) => {
      shouldAnimateOptionsRef.current = true;
      setShowOptionsState({ scopeKey: wave.id, value: next });
      if (isWideContainer) {
        closeOnNextInputRef.current = false;
        return;
      }
      closeOnNextInputRef.current = next;
    },
    [isWideContainer, wave.id]
  );

  const handleEditorStateChange = useCallback(
    (newEditorState: EditorState) => {
      setEditorState(newEditorState);
      shouldCollapseOptionsAfterMarkdownSyncRef.current = true;

      if (isWideContainer) {
        return;
      }

      if (closeOnNextInputRef.current) {
        collapseOptions();
      }
    },
    [collapseOptions, isWideContainer]
  );

  const handleEditorBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (isWideContainer) {
        return;
      }
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && actionsContainerRef.current?.contains(nextTarget)) {
        return;
      }
      shouldAnimateOptionsRef.current = true;
      setShowOptionsState({ scopeKey: wave.id, value: false });
      closeOnNextInputRef.current = false;
    },
    [isWideContainer, wave.id]
  );

  useEffect(() => {
    if (!drop) {
      setIsStormMode(false);
      return;
    }

    if (!drop.parts.length) {
      setIsStormMode(false);
    }
  }, [drop, setIsStormMode]);

  const openMetadata = useCallback(() => {
    setMetadataOpenState({
      scopeKey: dropModeSessionScopeKey,
      value: true,
    });
  }, [dropModeSessionScopeKey]);

  const togglePoll = useCallback(() => {
    if (!canCreatePoll) {
      return;
    }

    setPollDraftState((current) =>
      current?.scopeKey === wave.id
        ? null
        : {
            scopeKey: wave.id,
            value: createDefaultDropPollDraft(),
          }
    );
  }, [canCreatePoll, wave.id]);

  const updatePollDraft = useCallback(
    (value: CreateDropPollDraft) => {
      setPollDraftState({
        scopeKey: wave.id,
        value,
      });
    },
    [wave.id]
  );

  const removePoll = useCallback(() => {
    setPollDraftState(null);
  }, []);

  const { onChangeKey, onChangeValue, onAddMetadata, onRemoveMetadata } =
    createMetadataHandlers({
      metadata,
      setMetadata,
      generateMetadataId,
    });

  const breakIntoStorm = () => {
    finalizeAndAddDropPart();
    setIsStormMode(true);
  };

  // Clear active reply/quote when entering edit mode on mobile
  useEffect(() => {
    if (isApp && editingDropId && activeDrop) {
      onCancelReplyQuote();
    }
  }, [isApp, editingDropId, activeDrop, onCancelReplyQuote]);

  const animateOptions =
    shouldAnimateOptionsRef.current && showOptionsState?.scopeKey === wave.id;

  return (
    <CreateDropLayout
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
      dropId={dropId}
      submitting={submitting}
      wave={wave}
      isDropMode={isDropMode}
      isStormModeActive={isStormMode}
      showIdentityField={showIdentityField}
      showInlineIdentityPicker={showInlineIdentityPicker}
      showModalIdentityPicker={showModalIdentityPicker}
      isIdentityPickerOpen={isIdentityPickerOpen}
      showComposer={showComposer}
      identitySubmissionMode={identitySubmissionMode}
      selectedIdentitySelection={selectedIdentitySelection}
      viewerIdentity={viewerIdentity}
      showIdentityValidationMessage={showIdentityValidationMessage}
      identityValidationMessage={identityValidationMessage}
      openIdentityPicker={openIdentityPicker}
      canExitDropMode={canExitDropMode}
      dropModeToggleExitLabel={dropModeToggleExitLabel}
      closeIdentitySelectionPanel={closeIdentitySelectionPanel}
      identityPickerErrorMessage={identityPickerErrorMessage}
      canDismissIdentityPicker={canDismissIdentityPicker}
      closeIdentityPicker={closeIdentityPicker}
      handleIdentitySelection={handleIdentitySelection}
      setActionsContainerRef={setActionsContainerRef}
      isLinksSubmitBlocked={isLinksSubmitBlocked}
      canAddPart={canAddPart}
      showOptions={showOptions}
      animateOptions={animateOptions}
      missingRequirements={missingRequirements}
      canCreatePoll={canCreatePoll}
      hasPoll={pollDraft !== null}
      handleFileChange={handleFileChange}
      openMetadata={openMetadata}
      togglePoll={togglePoll}
      breakIntoStorm={breakIntoStorm}
      handleSetShowOptions={handleSetShowOptions}
      onGifDrop={onGifDrop}
      dropEditorRefreshKey={dropEditorRefreshKey}
      createDropInputRef={createDropInputRef}
      editorState={editorState}
      canMentionAll={canMentionAll}
      canSubmit={canSubmit}
      handleEditorStateChange={handleEditorStateChange}
      handleEditorBlur={handleEditorBlur}
      onReferencedNft={onReferencedNft}
      onMentionedUser={onMentionedUser}
      onMentionedWave={onMentionedWave}
      canEditLastDropWithArrow={canEditLastDropWithArrow}
      handleRequestEditLastDrop={handleRequestEditLastDrop}
      onDrop={onDrop}
      pollDraft={pollDraft}
      pollValidationError={pollValidation.error}
      updatePollDraft={updatePollDraft}
      removePoll={removePoll}
      showCurationDropModeWarning={showCurationDropModeWarning}
      canSubmitCurationUrl={canSubmitCurationUrl}
      curationUrlSubmitRestrictionMessage={curationUrlSubmitRestrictionMessage}
      onSwitchToDropMode={onSwitchToDropMode}
      isMetadataOpen={isMetadataOpen}
      metadata={metadata}
      metadataErrorById={metadataErrorById}
      onChangeKey={onChangeKey}
      onChangeValue={onChangeValue}
      onAddMetadata={onAddMetadata}
      onRemoveMetadata={onRemoveMetadata}
      closeMetadata={closeMetadata}
      drop={drop}
      files={files}
      uploadingFiles={uploadingFiles}
      removeFile={removeFile}
      termsSignatureFlowEnabled={termsSignatureFlowEnabled}
    />
  );
};

export default memo(CreateDropContent);
