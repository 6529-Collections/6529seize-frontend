"use client";

import { useRef, useState, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";
import CreateDropContent from "./CreateDropContent";
import CreateCurationDropContent from "./CreateCurationDropContent";
import QuorumProposalDropModal from "./quorum/QuorumProposalDropModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import {
  commonApiPost,
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiContentModerationProfileStatusResponse } from "@/generated/models/ApiContentModerationProfileStatusResponse";
import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useAuth } from "../auth/Auth";
import { useKeyPressEvent } from "react-use";
import { DropMode } from "./dropComposer.types";
import { ChatRestriction } from "@/hooks/useDropPriviledges";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useUnreadDividerOptional } from "@/contexts/wave/UnreadDividerContext";
import { useWave } from "@/hooks/useWave";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useModerationRejectedDropDelivery } from "./useModerationRejectedDropDelivery";
import { PROFILE_SUSPENDED_ERROR_CODE } from "@/services/api/content-moderation-api";
import { PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import WaveGuidelinesAgreementDialog from "./create-drop-content/WaveGuidelinesAgreementDialog";
import { useWaveGuidelinesAgreement } from "./create-drop-content/useWaveGuidelinesAgreement";
import { useWaveGuidelinesSubmission } from "./create-drop-content/useWaveGuidelinesSubmission";
import type {
  DropMutationBody,
  QueuedDropMutationBody,
  SlowModeChatReservation,
  SlowModeChatWaveState,
} from "./create-drop-content/drop-submission.types";
import { getDropSubmissionErrorContent } from "./create-drop-content/drop-submission-error.helpers";
import type { CreateDropProps } from "./create-drop-content/create-drop.types";

export default function CreateDrop({
  activeDrop,
  onCancelReplyQuote,
  onReplyTargetUnavailable,
  onDropAddedToQueue,
  onAllDropsAdded,
  onServerDropCreated,
  onExitFixedDropMode,
  wave,
  dropId,
  fixedDropMode,
  privileges,
  curationComposerVariant = "default",
  initialCurationUrl: initialCurationUrlProp = null,
  onSubmitCurationUrl,
  canSubmitCurationUrl,
  curationUrlSubmitRestrictionMessage = null,
  externalAttachmentDrop,
  onExternalAttachmentDropConsumed,
  termsSignatureFlowEnabled = true,
  identityPickerPlacement = "modal",
  forceStandardDropComposer = false,
  focusOnInitialActiveDrop = false,
  initialMarkdown = null,
  initialMarkdownKey = null,
}: CreateDropProps) {
  const locale = useBrowserLocale();
  const { setToast, connectedProfile } = useAuth();
  const { waitAndInvalidateDrops } = useContext(ReactQueryWrapperContext);
  const queryClient = useQueryClient();
  const unreadDividerContext = useUnreadDividerOptional();
  useKeyPressEvent("Escape", () => onCancelReplyQuote());
  const [isStormMode, setIsStormMode] = useState(false);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);
  const [dropModeOverride, setDropModeOverride] = useState<{
    scopeKey: string;
    value: boolean;
  } | null>(null);
  const [curationPrefillSeed, setCurationPrefillSeed] = useState<{
    scopeKey: string;
    url: string;
  } | null>(null);
  const [dismissedQuorumProposalScope, setDismissedQuorumProposalScope] =
    useState<string | null>(null);
  const { applyOptimisticDropUpdate, processDropRemoved, processIncomingDrop } =
    useMyStream();
  const retainModerationRejectedDrop = useModerationRejectedDropDelivery({
    applyOptimisticDropUpdate,
    processDropRemoved,
    waveId: wave.id,
  });
  const {
    agreeToGuidelines,
    declineGuidelines,
    dialogGuidelines,
    markChatSubmitted,
    requestGuidelinesAgreement,
  } = useWaveGuidelinesAgreement({
    profileId: connectedProfile?.id ?? null,
    wave,
  });
  const { isMemesWave, isCurationWave, isQuorumWave } = useWave(wave);
  const resolvedSubmissionExperience = resolveWaveSubmissionExperience({
    isMemesWave,
    isCurationWave,
    isQuorumWave,
    submissionStrategy: wave.participation.submission_strategy ?? null,
  });
  const submissionExperience = forceStandardDropComposer
    ? WaveSubmissionExperience.DEFAULT
    : resolvedSubmissionExperience;
  const canUseChatComposer =
    wave.chat.authenticated_user_eligible ||
    privileges.chatRestriction === ChatRestriction.SLOW_MODE;
  const getDefaultIsDropMode = () => {
    if (fixedDropMode === DropMode.CHAT) {
      return false;
    }
    if (fixedDropMode === DropMode.PARTICIPATION) {
      return true;
    }
    if (canUseChatComposer) return false;
    if (wave.participation.authenticated_user_eligible) return true;
    if (activeDrop) return false;
    return false;
  };

  const activeDropScope =
    activeDrop === null
      ? "none"
      : `${activeDrop.action}:${activeDrop.drop.id}:${activeDrop.partId}`;
  const modeScopeKey =
    `${wave.id}:${fixedDropMode}:${canUseChatComposer}:` +
    `${wave.participation.authenticated_user_eligible}:${activeDropScope}`;
  const modeScopeToken = modeScopeKey;
  const defaultIsDropMode = getDefaultIsDropMode();
  const isDropMode =
    dropModeOverride?.scopeKey === modeScopeToken
      ? dropModeOverride.value
      : defaultIsDropMode;
  const initialCurationUrl =
    curationPrefillSeed?.scopeKey === modeScopeToken
      ? curationPrefillSeed.url
      : initialCurationUrlProp;
  const isCurationDropMode =
    submissionExperience === WaveSubmissionExperience.CURATION_LEGACY &&
    isDropMode;
  const isQuorumProposalDropMode =
    submissionExperience === WaveSubmissionExperience.QUORUM_PROPOSAL &&
    isDropMode;
  const quorumProposalScopeKey = `${modeScopeToken}:${submissionExperience}`;
  const isQuorumProposalModalOpen =
    isQuorumProposalDropMode &&
    dismissedQuorumProposalScope !== quorumProposalScopeKey;
  const canUseCurationUrlSubmit =
    fixedDropMode === DropMode.CHAT
      ? onSubmitCurationUrl !== undefined && canSubmitCurationUrl !== false
      : true;
  const curationUrlRestrictionMessage =
    fixedDropMode === DropMode.CHAT &&
    onSubmitCurationUrl !== undefined &&
    canSubmitCurationUrl === false
      ? curationUrlSubmitRestrictionMessage
      : null;

  const canSwitchDropMode = useCallback(
    (newIsDropMode: boolean) => {
      if (fixedDropMode !== DropMode.BOTH) {
        return false;
      }

      if (newIsDropMode && !wave.participation.authenticated_user_eligible) {
        setToast({
          message: "You are not eligible to drop in this wave",
          type: "error",
        });
        return false;
      }

      if (!newIsDropMode && !canUseChatComposer) {
        setToast({
          message: "You are not eligible to chat in this wave",
          type: "error",
        });
        return false;
      }

      return true;
    },
    [canUseChatComposer, fixedDropMode, setToast, wave]
  );

  const onDropModeChange = useCallback(
    (newIsDropMode: boolean) => {
      if (
        !newIsDropMode &&
        fixedDropMode === DropMode.PARTICIPATION &&
        onExitFixedDropMode
      ) {
        setCurationPrefillSeed(null);
        setDismissedQuorumProposalScope(null);
        onExitFixedDropMode();
        return;
      }

      if (!canSwitchDropMode(newIsDropMode)) {
        return;
      }
      setCurationPrefillSeed(null);
      setDismissedQuorumProposalScope(null);
      setDropModeOverride({ scopeKey: modeScopeToken, value: newIsDropMode });
    },
    [canSwitchDropMode, fixedDropMode, modeScopeToken, onExitFixedDropMode]
  );

  const onSwitchToDropModeWithUrl = useCallback(
    (url: string) => {
      if (fixedDropMode === DropMode.CHAT) {
        if (onSubmitCurationUrl && canSubmitCurationUrl !== false) {
          onSubmitCurationUrl(url);
        }
        return;
      }

      if (!canSwitchDropMode(true)) {
        return;
      }
      setCurationPrefillSeed({ scopeKey: modeScopeToken, url });
      setDismissedQuorumProposalScope(null);
      setDropModeOverride({ scopeKey: modeScopeToken, value: true });
    },
    [
      canSubmitCurationUrl,
      canSwitchDropMode,
      fixedDropMode,
      modeScopeToken,
      onSubmitCurationUrl,
    ]
  );

  const onCloseQuorumProposal = useCallback(() => {
    if (fixedDropMode === DropMode.BOTH && canUseChatComposer) {
      onDropModeChange(false);
      return;
    }

    if (
      fixedDropMode === DropMode.PARTICIPATION &&
      onExitFixedDropMode !== undefined
    ) {
      onDropModeChange(false);
      return;
    }

    setDismissedQuorumProposalScope(quorumProposalScopeKey);
  }, [
    fixedDropMode,
    canUseChatComposer,
    onExitFixedDropMode,
    onDropModeChange,
    quorumProposalScopeKey,
  ]);

  const onOpenQuorumProposal = useCallback(() => {
    setDismissedQuorumProposalScope(null);
    if (!isDropMode) {
      onDropModeChange(true);
    }
  }, [isDropMode, onDropModeChange]);

  const slowModeChatStateByWaveRef = useRef<Map<string, SlowModeChatWaveState>>(
    new Map()
  );
  const slowModeChatReservationIdRef = useRef(0);

  const getSlowModeChatWaveState = useCallback((waveId: string) => {
    const currentState = slowModeChatStateByWaveRef.current.get(waveId);
    if (currentState !== undefined) {
      return currentState;
    }

    const nextState: SlowModeChatWaveState = {
      pendingReservationId: null,
      cooldownUntil: null,
      cooldownMs: null,
    };
    slowModeChatStateByWaveRef.current.set(waveId, nextState);
    return nextState;
  }, []);

  const getLocalSlowModeCooldownMs = useCallback(
    (dropRequest: ApiCreateDropRequest) => {
      if (dropRequest.wave_id !== wave.id) {
        return null;
      }

      const cooldownMs = wave.chat.slow_mode_cooldown_ms;
      const connectedHandle = connectedProfile?.handle?.toLowerCase() ?? null;
      const isCreator =
        connectedHandle !== null &&
        wave.author.handle?.toLowerCase() === connectedHandle;
      const isAdmin = wave.wave.authenticated_user_eligible_for_admin === true;

      if (typeof cooldownMs !== "number") {
        return null;
      }

      if (
        dropRequest.drop_type !== ApiDropType.Chat ||
        connectedHandle === null ||
        isCreator ||
        isAdmin
      ) {
        return null;
      }

      return cooldownMs;
    },
    [
      connectedProfile?.handle,
      wave.author.handle,
      wave.chat.slow_mode_cooldown_ms,
      wave.id,
      wave.wave.authenticated_user_eligible_for_admin,
    ]
  );

  const reserveSlowModeChatQueueSlot = useCallback(
    (dropRequest: ApiCreateDropRequest) => {
      const cooldownMs = getLocalSlowModeCooldownMs(dropRequest);
      if (cooldownMs === null) {
        return null;
      }

      const waveState = getSlowModeChatWaveState(dropRequest.wave_id);
      if (waveState.pendingReservationId !== null) {
        return false;
      }

      const cooldownUntil = waveState.cooldownUntil;
      if (cooldownUntil !== null && Date.now() < cooldownUntil) {
        return false;
      }

      waveState.cooldownUntil = null;
      waveState.cooldownMs = cooldownMs;
      slowModeChatReservationIdRef.current += 1;
      const reservation: SlowModeChatReservation = {
        id: slowModeChatReservationIdRef.current,
        waveId: dropRequest.wave_id,
        cooldownMs,
      };
      waveState.pendingReservationId = reservation.id;
      return reservation;
    },
    [getLocalSlowModeCooldownMs, getSlowModeChatWaveState]
  );

  const clearSlowModeChatPending = useCallback(
    (reservation: SlowModeChatReservation | null | undefined) => {
      if (reservation === null || reservation === undefined) {
        return;
      }

      const waveState = slowModeChatStateByWaveRef.current.get(
        reservation.waveId
      );
      if (waveState === undefined) {
        return;
      }

      if (waveState.pendingReservationId !== reservation.id) {
        return;
      }

      waveState.pendingReservationId = null;
      waveState.cooldownMs = null;
    },
    []
  );

  const startLocalSlowModeCooldown = useCallback(
    (body: QueuedDropMutationBody) => {
      const reservation = body.slowModeChatReservation;
      if (reservation === undefined) {
        return;
      }

      const waveState = slowModeChatStateByWaveRef.current.get(
        reservation.waveId
      );
      if (waveState?.pendingReservationId !== reservation.id) {
        return;
      }

      const nextDropAllowed = Date.now() + reservation.cooldownMs;
      waveState.pendingReservationId = null;
      waveState.cooldownUntil = nextDropAllowed;
      waveState.cooldownMs = reservation.cooldownMs;
      queryClient.setQueryData<ApiWave>(
        [QueryKey.WAVE, { wave_id: reservation.waveId }],
        (currentWave) => {
          const sourceWave =
            currentWave ?? (wave.id === reservation.waveId ? wave : undefined);
          if (sourceWave === undefined) {
            return currentWave;
          }

          return {
            ...sourceWave,
            chat: {
              ...sourceWave.chat,
              next_drop_allowed: nextDropAllowed,
            },
          };
        }
      );
      void queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE, { wave_id: reservation.waveId }],
        })
        .catch(() => undefined);
    },
    [queryClient, wave]
  );

  const addDropMutation = useMutation({
    mutationFn: async (body: QueuedDropMutationBody) => {
      return commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: `drops`,
        body: body.drop,
        errorMode: "structured",
      });
    },
    onSuccess: (serverDrop, body) => {
      if (body.dropId) {
        processDropRemoved(body.drop.wave_id, body.dropId);
      }
      startLocalSlowModeCooldown(body);
      void Promise.resolve(
        processIncomingDrop(serverDrop, ProcessIncomingDropType.DROP_INSERT)
      ).catch(() => undefined);
      body.onSuccess?.();

      if (
        submissionExperience === WaveSubmissionExperience.CURATION_LEGACY &&
        curationComposerVariant === "leaderboard"
      ) {
        setToast({
          message: "Drop submitted.",
          type: "success",
        });
      }
    },
    onError: (error, body) => {
      clearSlowModeChatPending(body.slowModeChatReservation);
      const isContentModerationRejection =
        getStructuredApiErrorStatus(error) === 422 &&
        getStructuredApiErrorCode(error) === "CONTENT_MODERATION_REJECTED";
      const isProfileSuspendedRejection =
        getStructuredApiErrorStatus(error) === 403 &&
        getStructuredApiErrorCode(error) === PROFILE_SUSPENDED_ERROR_CODE;
      if (isProfileSuspendedRejection && connectedProfile?.id) {
        queryClient.setQueryData<ApiContentModerationProfileStatusResponse>(
          [...PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY, connectedProfile.id],
          {
            profile_id: connectedProfile.id,
            status: ApiModeratedProfileStatus.Suspended,
          }
        );
      }
      setTimeout(() => {
        if (!body.dropId) {
          return;
        }

        if (
          isContentModerationRejection &&
          retainModerationRejectedDrop({
            dropId: body.dropId,
            rejectedWaveId: body.drop.wave_id,
          })
        ) {
          return;
        }

        processDropRemoved(body.drop.wave_id, body.dropId);
      }, 0);
      const isHandled = body.onError?.(error) === true;
      if (!isHandled) {
        const errorContent = getDropSubmissionErrorContent({
          error,
          isContentModerationRejection,
          isProfileSuspendedRejection,
          locale,
        });
        setToast({
          type: "error",
          title: t(locale, "contentModeration.dropSubmitErrorTitle"),
          ...errorContent,
        });
      }
    },
    retry: false,
  });

  // Use refs to avoid stale closures - fixes the stream unmounting issue
  const queueRef = useRef<QueuedDropMutationBody[]>([]);
  const isProcessingRef = useRef(false);
  const hasBatchErrorsRef = useRef(false);
  const hasServerDropCreatedCallbackErrorsRef = useRef(false);
  const inFlightProcessNextDropRef = useRef<Promise<void> | null>(null);

  const handleServerDropCreated = useCallback(
    async (serverDrop: ApiDrop) => {
      if (!onServerDropCreated) {
        return;
      }

      try {
        await onServerDropCreated(serverDrop);
      } catch (error) {
        hasServerDropCreatedCallbackErrorsRef.current = true;
        console.error("Error handling created server drop:", error);
      }
    },
    [onServerDropCreated]
  );

  const processNextDrop = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    while (queueRef.current.length > 0) {
      const dropRequest = queueRef.current.shift();
      if (dropRequest === undefined) {
        break;
      }
      try {
        const serverDrop = await addDropMutation.mutateAsync(dropRequest);
        await handleServerDropCreated(serverDrop);
      } catch (error) {
        hasBatchErrorsRef.current = true;
        console.error("Error processing drop:", error);
      }
    }

    isProcessingRef.current = false;

    const shouldNotifyAllDropsAdded =
      !hasBatchErrorsRef.current &&
      !hasServerDropCreatedCallbackErrorsRef.current;
    hasBatchErrorsRef.current = false;
    hasServerDropCreatedCallbackErrorsRef.current = false;
    void waitAndInvalidateDrops();
    if (shouldNotifyAllDropsAdded) {
      onAllDropsAdded?.();
    }
  }, [
    addDropMutation,
    handleServerDropCreated,
    onAllDropsAdded,
    waitAndInvalidateDrops,
  ]);

  const enqueueDrop = useCallback(
    (dropRequest: DropMutationBody): boolean => {
      const slowModeChatReservation = reserveSlowModeChatQueueSlot(
        dropRequest.drop
      );
      if (slowModeChatReservation === false) {
        return false;
      }

      const queuedDropRequest: QueuedDropMutationBody =
        slowModeChatReservation === null
          ? dropRequest
          : {
              ...dropRequest,
              slowModeChatReservation,
            };

      // Add to queue
      queueRef.current.push(queuedDropRequest);

      // Process immediately - avoids state update timing issues
      inFlightProcessNextDropRef.current = processNextDrop();

      // Clear unread divider when user sends a message
      if (unreadDividerContext) {
        unreadDividerContext.setUnreadDividerSerialNo(null);
      }

      // Trigger UI updates
      onDropAddedToQueue();

      if (dropRequest.drop.drop_type === ApiDropType.Chat) {
        markChatSubmitted();
      }

      // Explicitly blur any focused input to close keyboard for drop flows.
      if (
        dropRequest.drop.drop_type !== ApiDropType.Chat &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }

      return true;
    },
    [
      markChatSubmitted,
      onDropAddedToQueue,
      processNextDrop,
      reserveSlowModeChatQueueSlot,
      unreadDividerContext,
    ]
  );

  const submitDrop = useWaveGuidelinesSubmission({
    enqueueDrop,
    requestGuidelinesAgreement,
    setToast,
  });

  const createDropContentProps = useMemo(() => {
    const hasExitFixedDropMode = onExitFixedDropMode !== undefined;
    return {
      activeDrop,
      onCancelReplyQuote,
      onReplyTargetUnavailable,
      drop,
      isStormMode,
      isDropMode,
      dropId,
      setDrop,
      setIsStormMode,
      onDropModeChange,
      onSwitchToDropModeWithUrl,
      submitDrop,
      dropModeToggleExitLabel:
        fixedDropMode === DropMode.PARTICIPATION && hasExitFixedDropMode
          ? "Close create drop"
          : null,
      canExitDropMode:
        (fixedDropMode === DropMode.BOTH &&
          (privileges.chatRestriction === null ||
            privileges.chatRestriction === ChatRestriction.SLOW_MODE)) ||
        (fixedDropMode === DropMode.PARTICIPATION && hasExitFixedDropMode),
      isChatBlockedBySlowMode:
        privileges.chatRestriction === ChatRestriction.SLOW_MODE,
      externalAttachmentDrop,
      onExternalAttachmentDropConsumed,
      canSubmitCurationUrl: canUseCurationUrlSubmit,
      curationUrlSubmitRestrictionMessage: curationUrlRestrictionMessage,
      termsSignatureFlowEnabled,
      identityPickerPlacement,
      initialMarkdown,
      initialMarkdownKey,
    };
  }, [
    activeDrop,
    onCancelReplyQuote,
    onReplyTargetUnavailable,
    drop,
    isStormMode,
    isDropMode,
    dropId,
    setDrop,
    setIsStormMode,
    onDropModeChange,
    onSwitchToDropModeWithUrl,
    submitDrop,
    privileges,
    fixedDropMode,
    onExitFixedDropMode,
    externalAttachmentDrop,
    onExternalAttachmentDropConsumed,
    canUseCurationUrlSubmit,
    curationUrlRestrictionMessage,
    termsSignatureFlowEnabled,
    identityPickerPlacement,
    initialMarkdown,
    initialMarkdownKey,
  ]);

  let dropComposerContent: ReactNode;
  if (isQuorumProposalDropMode) {
    dropComposerContent = (
      <>
        <QuorumProposalDropModal
          isOpen={isQuorumProposalModalOpen}
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
          wave={wave}
          dropId={dropId}
          submitDrop={submitDrop}
          onClose={onCloseQuorumProposal}
          termsSignatureFlowEnabled={termsSignatureFlowEnabled}
        />
        {!isQuorumProposalModalOpen && (
          <div className="tw-flex tw-w-full tw-justify-end">
            <Button onClick={onOpenQuorumProposal} variant="tertiary" size="sm">
              {t(locale, "waves.submissionButtonLabel.defaultCreateProposal")}
            </Button>
          </div>
        )}
      </>
    );
  } else if (isCurationDropMode) {
    dropComposerContent = (
      <CreateCurationDropContent
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
        wave={wave}
        dropId={dropId}
        isDropMode={isDropMode}
        initialUrl={initialCurationUrl}
        submitDrop={submitDrop}
        curationComposerVariant={curationComposerVariant}
        termsSignatureFlowEnabled={termsSignatureFlowEnabled}
      />
    );
  } else {
    dropComposerContent = (
      <CreateDropContent
        {...createDropContentProps}
        wave={wave}
        submissionExperience={submissionExperience}
        focusOnInitialActiveDrop={focusOnInitialActiveDrop}
      />
    );
  }

  return (
    <>
      {dropComposerContent}
      <WaveGuidelinesAgreementDialog
        guidelines={dialogGuidelines}
        onAgree={agreeToGuidelines}
        onDecline={declineGuidelines}
      />
    </>
  );
}
