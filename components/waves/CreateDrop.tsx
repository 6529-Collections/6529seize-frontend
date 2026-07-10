"use client";

import { useRef, useState, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";
import CreateDropStormParts from "./CreateDropStormParts";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropContent from "./CreateDropContent";
import CreateCurationDropContent from "./CreateCurationDropContent";
import QuorumProposalDropModal from "./quorum/QuorumProposalDropModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiPost } from "@/services/api/common-api";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useAuth } from "../auth/Auth";
import { useKeyPressEvent } from "react-use";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  CurationComposerVariant,
  IdentityPickerPlacement,
} from "./dropComposer.types";
import { DropMode } from "./dropComposer.types";
import {
  ChatRestriction,
  type DropPrivileges,
} from "@/hooks/useDropPriviledges";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useUnreadDividerOptional } from "@/contexts/wave/UnreadDividerContext";
import { useWave } from "@/hooks/useWave";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import { getMentionedGroupsFromParts } from "@/helpers/waves/drop-group-mentions";

interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly onReplyTargetUnavailable?: (() => void) | undefined;
  readonly onDropAddedToQueue: () => void;
  readonly onAllDropsAdded?: (() => void) | undefined;
  readonly onServerDropCreated?:
    | ((drop: ApiDrop) => Promise<void> | void)
    | undefined;
  readonly onExitFixedDropMode?: (() => void) | undefined;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly fixedDropMode: DropMode;
  readonly privileges: DropPrivileges;
  readonly curationComposerVariant?: CurationComposerVariant | undefined;
  readonly initialCurationUrl?: string | null | undefined;
  readonly onSubmitCurationUrl?: ((url: string) => void) | undefined;
  readonly canSubmitCurationUrl?: boolean | undefined;
  readonly curationUrlSubmitRestrictionMessage?: string | null | undefined;
  readonly externalAttachmentDrop?:
    | {
        readonly token: number;
        readonly files: File[];
      }
    | null
    | undefined;
  readonly onExternalAttachmentDropConsumed?: (() => void) | undefined;
  readonly termsSignatureFlowEnabled?: boolean | undefined;
  readonly identityPickerPlacement?: IdentityPickerPlacement | undefined;
  readonly forceStandardDropComposer?: boolean | undefined;
  readonly focusOnInitialActiveDrop?: boolean | undefined;
  readonly initialMarkdown?: string | null | undefined;
  readonly initialMarkdownKey?: string | null | undefined;
}

export interface DropMutationBody {
  readonly drop: ApiCreateDropRequest;
  readonly dropId: string | null;
  readonly onSuccess?: (() => void) | undefined;
  readonly onError?: ((error: unknown) => boolean | void) | undefined;
}

const ANIMATION_DURATION = 0.3;

interface SlowModeChatReservation {
  readonly id: number;
  readonly waveId: string;
  readonly cooldownMs: number;
}

interface QueuedDropMutationBody extends DropMutationBody {
  readonly slowModeChatReservation?: SlowModeChatReservation | undefined;
}

interface SlowModeChatWaveState {
  pendingReservationId: number | null;
  cooldownUntil: number | null;
  cooldownMs: number | null;
}

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
  const { processDropRemoved, processIncomingDrop } = useMyStream();
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
  const canMentionAll =
    wave.wave.authenticated_user_eligible_for_admin === true;
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

  const onRemovePart = useCallback(
    (partIndex: number) => {
      setDrop((prevDrop) => {
        if (!prevDrop) return null;
        const newParts = prevDrop.parts.filter((_, i) => i !== partIndex);
        return {
          ...prevDrop,
          parts: newParts,
          referenced_nfts: prevDrop.referenced_nfts,
          mentioned_users: prevDrop.mentioned_users,
          mentioned_groups: getMentionedGroupsFromParts(
            newParts,
            canMentionAll
          ),
          mentioned_waves: prevDrop.mentioned_waves ?? [],
          metadata: prevDrop.metadata,
        };
      });
    },
    [canMentionAll]
  );

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
      setTimeout(() => {
        if (body.dropId) {
          processDropRemoved(body.drop.wave_id, body.dropId);
        }
      }, 0);
      const isHandled = body.onError?.(error) === true;
      if (!isHandled) {
        setToast({
          type: "error",
          title: "Couldn't submit this drop.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
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

  const submitDrop = useCallback(
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
      onDropAddedToQueue,
      processNextDrop,
      reserveSlowModeChatQueueSlot,
      unreadDividerContext,
    ]
  );

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
            <button
              type="button"
              onClick={onOpenQuorumProposal}
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800"
            >
              Create Proposal
            </button>
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
      <AnimatePresence>
        {isStormMode && !isCurationDropMode && !isQuorumProposalDropMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: ANIMATION_DURATION }}
          >
            <CreateDropStormParts
              parts={drop?.parts ?? []}
              mentionedUsers={drop?.mentioned_users ?? []}
              mentionedGroups={drop?.mentioned_groups ?? []}
              mentionedWaves={drop?.mentioned_waves ?? []}
              referencedNfts={drop?.referenced_nfts ?? []}
              onRemovePart={onRemovePart}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {dropComposerContent}
    </>
  );
}
