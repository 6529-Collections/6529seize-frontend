"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import {
  getDisplayQuickVoteAmounts,
  getQuickVoteAbsoluteRemainingPower,
  getQuickVoteRatingRange,
  isMemesQuickVoteVoteableDrop,
} from "@/hooks/memesQuickVote.helpers";
import {
  clampDropRatingRange,
  createInitialOptimisticRemainingVotePowerState,
  getCurrentOptimisticRemainingVotePowerState,
  getEffectiveOptimisticRemainingVotePower,
  reconcileOptimisticRemainingVotePower,
  reduceOptimisticRemainingVotePower,
  restoreOptimisticRemainingVotePower,
  type KeyedOptimisticRemainingVotePowerState,
} from "@/hooks/memesQuickVote.queue.state";
import {
  MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import {
  runBestEffortSync,
  useMemesQuickVoteSessionState,
  type UseMemesQuickVoteSessionStateResult,
} from "@/hooks/useMemesQuickVoteSessionState";
import { useQueryClient } from "@tanstack/react-query";
import {
  type ContextType,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type UseMemesQuickVoteQueueOptions = {
  readonly enabled?: boolean | undefined;
  readonly sessionId: number;
};

export type UseMemesQuickVoteQueueResult = {
  readonly activeDrop: ExtendedDrop | null;
  readonly hasDiscoveryError: boolean;
  readonly isExhausted: boolean;
  readonly isLoading: boolean;
  readonly isRestartingRound: boolean;
  readonly isReady: boolean;
  readonly leftThisRoundCount: number;
  readonly latestUsedAmount: number | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly recentAmounts: number[];
  readonly retryDiscovery: () => void;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
  readonly skipDrop: (drop: ExtendedDrop) => Promise<boolean>;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
};

const useInvalidateQuickVoteUndiscoveredDrop = ({
  contextProfile,
  proxyId,
  queryClient,
  waveId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly proxyId: string | null | undefined;
  readonly queryClient: ReturnType<typeof useQueryClient>;
  readonly waveId: string | null;
}) =>
  useCallback(() => {
    queryClient
      .invalidateQueries({
        predicate: (query) => {
          if (
            !Array.isArray(query.queryKey) ||
            query.queryKey[0] !==
              MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY ||
            typeof query.queryKey[1] !== "object" ||
            query.queryKey[1] === null
          ) {
            return false;
          }

          const undiscoveredQuery = query.queryKey[1] as {
            readonly context_profile?: string | null;
            readonly proxyId?: string | null;
            readonly waveId?: string | null;
          };

          return (
            undiscoveredQuery.context_profile === (contextProfile ?? null) &&
            undiscoveredQuery.proxyId === (proxyId ?? null) &&
            undiscoveredQuery.waveId === waveId
          );
        },
      })
      .catch(() => {
        // Query invalidation is best-effort. The next footer read will recover.
      });
  }, [contextProfile, proxyId, queryClient, waveId]);

const useMemesQuickVoteQueueSubmission = ({
  invalidateQuickVoteUndiscoveredDrop,
  requestAuth,
  session,
  setAndPersistRecentAmounts,
  setOptimisticRemainingVotePowerState,
  setToast,
  stateKey,
}: {
  readonly invalidateQuickVoteUndiscoveredDrop: () => void;
  readonly requestAuth: ContextType<typeof AuthContext>["requestAuth"];
  readonly session: UseMemesQuickVoteSessionStateResult;
  readonly setAndPersistRecentAmounts: (
    updater: (current: number[]) => number[]
  ) => void;
  readonly setOptimisticRemainingVotePowerState: Dispatch<
    SetStateAction<KeyedOptimisticRemainingVotePowerState>
  >;
  readonly setToast: ContextType<typeof AuthContext>["setToast"];
  readonly stateKey: string;
}) =>
  useMemesQuickVoteSubmit({
    onRatingFailure: (drop, amount, type) => {
      session.restoreFailedDrop(drop);

      if (type === "vote") {
        setOptimisticRemainingVotePowerState((current) =>
          restoreOptimisticRemainingVotePower({
            amount,
            current: getCurrentOptimisticRemainingVotePowerState({
              key: stateKey,
              state: current,
            }),
            remainingPower: getQuickVoteAbsoluteRemainingPower(
              getQuickVoteRatingRange(drop)
            ),
          })
        );
      }

      invalidateQuickVoteUndiscoveredDrop();
    },
    onRatingQueued: (drop, amount, type) => {
      session.advanceVisibleDrop(drop);

      if (type === "vote") {
        setOptimisticRemainingVotePowerState((current) =>
          reduceOptimisticRemainingVotePower({
            amount,
            current: getCurrentOptimisticRemainingVotePowerState({
              key: stateKey,
              state: current,
            }),
            remainingPower: getQuickVoteAbsoluteRemainingPower(
              getQuickVoteRatingRange(drop)
            ),
          })
        );
      }
    },
    onRatingSuccess: (_drop, _amount, nextRemainingPower, type) => {
      if (type === "vote") {
        setOptimisticRemainingVotePowerState((current) =>
          reconcileOptimisticRemainingVotePower({
            current: getCurrentOptimisticRemainingVotePowerState({
              key: stateKey,
              state: current,
            }),
            nextRemainingPower,
          })
        );
      }

      invalidateQuickVoteUndiscoveredDrop();
      runBestEffortSync(session.syncUndiscoveredWindow);
    },
    requestAuth,
    setAndPersistRecentAmounts,
    setToast,
  });

export const useMemesQuickVoteQueue = ({
  enabled = true,
  sessionId,
}: UseMemesQuickVoteQueueOptions): UseMemesQuickVoteQueueResult => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const {
    contextProfile,
    isEnabled: isQuickVoteEnabled,
    isLoaded: isSettingsLoaded,
    memesWaveId,
    proxyId,
  } = useMemesQuickVoteContext();
  const waveId =
    typeof memesWaveId === "string" && memesWaveId.length > 0
      ? memesWaveId
      : null;
  const stateKey = `${sessionId}:${waveId ?? ""}:${contextProfile ?? ""}`;
  const [
    optimisticRemainingVotePowerState,
    setOptimisticRemainingVotePowerState,
  ] = useState<KeyedOptimisticRemainingVotePowerState>(() =>
    createInitialOptimisticRemainingVotePowerState(stateKey)
  );
  const { recentAmountsByRecency, setAndPersistRecentAmounts } =
    useMemesQuickVoteStorage({
      contextProfile,
      memesWaveId,
    });
  const pendingDropIdsRef = useRef<readonly string[]>([]);
  const session = useMemesQuickVoteSessionState({
    contextProfile,
    enabled,
    isQuickVoteEnabled,
    isSettingsLoaded,
    pendingDropIdsRef,
    stateKey,
    waveId,
  });
  const invalidateQuickVoteUndiscoveredDrop =
    useInvalidateQuickVoteUndiscoveredDrop({
      contextProfile,
      proxyId,
      queryClient,
      waveId,
    });
  const { pendingDropIds, submitSkip, submitVote } =
    useMemesQuickVoteQueueSubmission({
      invalidateQuickVoteUndiscoveredDrop,
      requestAuth,
      session,
      setAndPersistRecentAmounts,
      setOptimisticRemainingVotePowerState,
      setToast,
      stateKey,
    });

  useEffect(() => {
    pendingDropIdsRef.current = pendingDropIds;
  }, [pendingDropIds]);

  const activeApiDrop = session.sessionState.currentDrop;
  const nextApiDrop = session.sessionState.lookaheadDrops[0] ?? null;
  const effectiveOptimisticRemainingPower =
    getEffectiveOptimisticRemainingVotePower({
      activeApiDrop,
      state: getCurrentOptimisticRemainingVotePowerState({
        key: stateKey,
        state: optimisticRemainingVotePowerState,
      }),
    });
  const activeDropCandidate = useMemo(() => {
    if (!activeApiDrop) {
      return null;
    }

    return clampDropRatingRange(
      convertApiDropToExtendedDrop(activeApiDrop),
      effectiveOptimisticRemainingPower
    );
  }, [activeApiDrop, effectiveOptimisticRemainingPower]);
  const activeDrop = isMemesQuickVoteVoteableDrop(activeDropCandidate)
    ? activeDropCandidate
    : null;
  const nextDropCandidate = useMemo(() => {
    if (!nextApiDrop) {
      return null;
    }

    return clampDropRatingRange(
      convertApiDropToExtendedDrop(nextApiDrop),
      effectiveOptimisticRemainingPower
    );
  }, [effectiveOptimisticRemainingPower, nextApiDrop]);
  const nextDrop = isMemesQuickVoteVoteableDrop(nextDropCandidate)
    ? nextDropCandidate
    : null;
  const latestUsedAmount = recentAmountsByRecency.at(-1) ?? null;
  const recentAmounts = getDisplayQuickVoteAmounts(recentAmountsByRecency);

  return {
    activeDrop,
    hasDiscoveryError: session.sessionState.hasDiscoveryError,
    isExhausted: session.sessionState.isExhausted,
    isLoading: session.sessionState.isLoading && activeDrop === null,
    isRestartingRound: session.sessionState.isRestartingRound,
    isReady: activeDrop !== null,
    leftThisRoundCount: session.sessionState.leftThisRoundCount,
    latestUsedAmount,
    nextDrop,
    recentAmounts,
    retryDiscovery: () => {
      runBestEffortSync(session.syncUndiscoveredWindow);
    },
    skipDrop: submitSkip,
    submitVote,
    uncastPower: activeDrop
      ? getQuickVoteAbsoluteRemainingPower(getQuickVoteRatingRange(activeDrop))
      : null,
    unratedCount: session.sessionState.unratedCount,
    votingLabel: activeDrop
      ? WAVE_VOTING_LABELS[activeDrop.wave.voting_credit_type]
      : null,
  };
};
