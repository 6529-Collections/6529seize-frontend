"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import { shouldResyncOnResume } from "@/helpers/resumeSync.helpers";
import { WsMessageType } from "@/helpers/Types";
import useCapacitor from "@/hooks/useCapacitor";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  isAuthJwtUsable,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { ReconnectResyncSchedule } from "@/services/websocket/reconnectResync";
import { getSocketIdentityKey } from "@/services/websocket/socketIdentity";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { WebSocketContext } from "@/services/websocket/WebSocketContext";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { QueryClientContext } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DmUnreadContext,
  type DmUnreadContextValue,
} from "./dm-unread-context";
import {
  getSnapshotRetryDelay,
  isDmUnreadConversationState,
  SNAPSHOT_RECONCILIATION_INTERVAL_MS,
  synchronizeDmUnreadSnapshot,
  type SnapshotSynchronizationResult,
} from "./dm-unread-snapshot";
import { DmUnreadStore, type DmUnreadReadOperation } from "./dm-unread-store";
import {
  DmDropRecoveryPolicy,
  isIncomingDropUpdate,
  isIncomingDropUpdateRef,
} from "./dm-unread-drop-recovery";

const RECOVERY_SNAPSHOT_COOLDOWN_MS = 1_500;
// The first snapshot waits this long for a socket that is still connecting,
// so one request covers both the page's state and the connect gap.
const INITIAL_SNAPSHOT_SOCKET_WAIT_MS = 3_000;
let nextProfileActivationId = 1;

interface InFlightSnapshotRequest {
  readonly activationId: number;
  readonly jwt: string;
  readonly promise: Promise<SnapshotSynchronizationResult>;
  readonly requestId: number;
}

interface PendingDropRecovery {
  readonly minimumSnapshotRequestId: number;
  readonly serialNo: number;
}

export function DmUnreadStateProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { activeProfileProxy, connectedProfile, isAuthenticated } = useAuth();
  const { isActive, isCapacitor } = useCapacitor();
  // Auth events re-render so the token below is read again.
  const [, setAuthRevision] = useState(0);
  const [store] = useState(() => new DmUnreadStore());
  const [reconnectResync] = useState(() => new ReconnectResyncSchedule());
  const activeProfileId =
    activeProfileProxy?.created_by.id ?? connectedProfile?.id ?? null;
  const profileActivation = useMemo(
    () => ({
      id: nextProfileActivationId++,
      profileId: activeProfileId,
    }),
    [activeProfileId]
  );
  const activeProfileIdRef = useRef(activeProfileId);
  const activeActivationRef = useRef(profileActivation);
  const appActivityRef = useRef({ isActive, isCapacitor });
  const isMountedRef = useRef(true);
  const latestSnapshotRequestByProfileRef = useRef(new Map<string, number>());
  const inFlightSnapshotByProfileRef = useRef(
    new Map<string, InFlightSnapshotRequest>()
  );
  const nextSnapshotRequestIdRef = useRef(1);
  const lastRecoverySnapshotAtRef = useRef(0);
  // When any snapshot last started, for the focus and visibility rule.
  const lastSnapshotStartedAtRef = useRef(0);
  const terminalSnapshotFailureActivationIdsRef = useRef(new Set<number>());
  const nextSnapshotAllowedAtByActivationRef = useRef(
    new Map<number, number>()
  );
  const previousMobileActiveRef = useRef(isActive);
  const pendingDropRecoveryByWaveRef = useRef(
    new Map<string, PendingDropRecovery>()
  );
  const dropRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const dropRecoveryDueAtRef = useRef(0);
  const [dropRecoveryPolicy] = useState(() => new DmDropRecoveryPolicy());
  // Optional so the provider also works outside a QueryClientProvider.
  const queryClient = useContext(QueryClientContext);
  const authJwt = getAuthJwt();
  // A rotated token for the same identity keeps the snapshot loop running;
  // each request reads the current token.
  const authIdentity = getSocketIdentityKey(authJwt);
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const socketStatus = useContext(WebSocketContext)?.status;
  const socketStatusRef = useRef(socketStatus);

  useLayoutEffect(() => {
    activeProfileIdRef.current = activeProfileId;
    activeActivationRef.current = profileActivation;
    terminalSnapshotFailureActivationIdsRef.current.clear();
    nextSnapshotAllowedAtByActivationRef.current.clear();
    pendingDropRecoveryByWaveRef.current.clear();
    if (dropRecoveryTimerRef.current !== null) {
      clearTimeout(dropRecoveryTimerRef.current);
      dropRecoveryTimerRef.current = null;
    }
    if (activeProfileId) {
      store.resetProfile(activeProfileId);
    }
  }, [activeProfileId, profileActivation, store]);

  useLayoutEffect(() => {
    appActivityRef.current = { isActive, isCapacitor };
  }, [isActive, isCapacitor]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (dropRecoveryTimerRef.current !== null) {
        clearTimeout(dropRecoveryTimerRef.current);
      }
      reconnectResync.cancel();
    };
  }, [reconnectResync]);

  useEffect(() => {
    const handleAuthChanged = () =>
      setAuthRevision((currentRevision) => currentRevision + 1);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener(PROFILE_SWITCHED_EVENT, handleAuthChanged);
    window.addEventListener(WALLET_ACCOUNTS_UPDATED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener(PROFILE_SWITCHED_EVENT, handleAuthChanged);
      window.removeEventListener(
        WALLET_ACCOUNTS_UPDATED_EVENT,
        handleAuthChanged
      );
    };
  }, []);

  const requestSnapshot = useCallback(
    async (
      expectedProfileId: string,
      jwt: string,
      expectedActivationId: number,
      minimumRequestId = 0
    ): Promise<SnapshotSynchronizationResult> => {
      let existingRequest =
        inFlightSnapshotByProfileRef.current.get(expectedProfileId);
      if (
        existingRequest?.jwt === jwt &&
        existingRequest.activationId === expectedActivationId &&
        existingRequest.requestId >= minimumRequestId
      ) {
        return existingRequest.promise;
      }
      if (
        existingRequest?.jwt === jwt &&
        existingRequest.activationId === expectedActivationId
      ) {
        await existingRequest.promise;
        if (
          !isMountedRef.current ||
          activeActivationRef.current.id !== expectedActivationId ||
          activeActivationRef.current.profileId !== expectedProfileId
        ) {
          return "stale";
        }
        existingRequest =
          inFlightSnapshotByProfileRef.current.get(expectedProfileId);
        if (
          existingRequest?.jwt === jwt &&
          existingRequest.activationId === expectedActivationId &&
          existingRequest.requestId >= minimumRequestId
        ) {
          return existingRequest.promise;
        }
      }
      const requestId = nextSnapshotRequestIdRef.current++;
      lastSnapshotStartedAtRef.current = Date.now();
      const startedAtSequence = store.beginSnapshot();
      latestSnapshotRequestByProfileRef.current.set(
        expectedProfileId,
        requestId
      );
      const isCurrentRequest = () =>
        isMountedRef.current &&
        latestSnapshotRequestByProfileRef.current.get(expectedProfileId) ===
          requestId &&
        activeActivationRef.current.id === expectedActivationId &&
        activeActivationRef.current.profileId === expectedProfileId;
      const requestPromise = synchronizeDmUnreadSnapshot({
        expectedProfileId,
        isCurrentRequest,
        jwt,
        startedAtSequence,
        store,
      })
        .then((result) => {
          if (result === "synchronized") {
            terminalSnapshotFailureActivationIdsRef.current.delete(
              expectedActivationId
            );
            nextSnapshotAllowedAtByActivationRef.current.delete(
              expectedActivationId
            );
          } else if (result === "terminal-failure") {
            // A token that rotated while this request ran was not the one
            // rejected; the loop retries with the current one.
            const currentJwt = getAuthJwt();
            if (currentJwt !== jwt && isAuthJwtUsable(currentJwt)) {
              return "retryable-failure";
            }
            terminalSnapshotFailureActivationIdsRef.current.add(
              expectedActivationId
            );
            nextSnapshotAllowedAtByActivationRef.current.delete(
              expectedActivationId
            );
          }
          return result;
        })
        .finally(() => {
          const currentRequest =
            inFlightSnapshotByProfileRef.current.get(expectedProfileId);
          if (currentRequest?.requestId === requestId) {
            inFlightSnapshotByProfileRef.current.delete(expectedProfileId);
          }
        });
      inFlightSnapshotByProfileRef.current.set(expectedProfileId, {
        activationId: expectedActivationId,
        jwt,
        promise: requestPromise,
        requestId,
      });
      return requestPromise;
    },
    [store]
  );

  const requestActiveSnapshot =
    useCallback(async (): Promise<SnapshotSynchronizationResult> => {
      const now = Date.now();
      if (
        now - lastRecoverySnapshotAtRef.current <
        RECOVERY_SNAPSHOT_COOLDOWN_MS
      ) {
        return "stale";
      }
      const activation = activeActivationRef.current;
      if (
        terminalSnapshotFailureActivationIdsRef.current.has(activation.id) ||
        now <
          (nextSnapshotAllowedAtByActivationRef.current.get(activation.id) ?? 0)
      ) {
        return "stale";
      }
      const profileId = activation.profileId;
      const jwt = getAuthJwt();
      if (!profileId || typeof jwt !== "string" || !isAuthJwtUsable(jwt)) {
        return "stale";
      }
      lastRecoverySnapshotAtRef.current = now;
      return requestSnapshot(profileId, jwt, activation.id);
    }, [requestSnapshot]);

  const requestDropRecoverySnapshot = useCallback(
    async (minimumRequestId: number) => {
      const activation = activeActivationRef.current;
      if (
        terminalSnapshotFailureActivationIdsRef.current.has(activation.id) ||
        Date.now() <
          (nextSnapshotAllowedAtByActivationRef.current.get(activation.id) ?? 0)
      ) {
        return;
      }
      const profileId = activation.profileId;
      const currentJwt = getAuthJwt();
      if (
        !profileId ||
        typeof currentJwt !== "string" ||
        !isAuthJwtUsable(currentJwt)
      ) {
        return;
      }
      await requestSnapshot(
        profileId,
        currentJwt,
        activation.id,
        minimumRequestId
      );
    },
    [requestSnapshot]
  );

  // Layout effects run before passive ones in a commit, so the snapshot
  // effect below reads this commit's socket status.
  useLayoutEffect(() => {
    socketStatusRef.current = socketStatus;
  }, [socketStatus]);

  useEffect(() => {
    if (!activeProfileId || !isAuthenticated || !hasUsableAuthJwt) {
      return;
    }
    const expectedProfileId = activeProfileId;
    const expectedActivationId = profileActivation.id;
    let cancelled = false;
    let hasAttemptedSnapshot = false;
    let recoveryAttempt = 0;
    let reconciliationTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleSnapshot = (delay: number) => {
      if (cancelled) {
        return;
      }
      reconciliationTimer = setTimeout(() => {
        void synchronizeSnapshot();
      }, delay);
    };

    const isActiveForReconciliation = () => {
      const currentActivity = appActivityRef.current;
      if (currentActivity.isCapacitor) {
        return currentActivity.isActive;
      }
      return document.visibilityState === "visible";
    };

    async function synchronizeSnapshot(): Promise<void> {
      if (cancelled) {
        return;
      }
      if (hasAttemptedSnapshot && !isActiveForReconciliation()) {
        scheduleSnapshot(SNAPSHOT_RECONCILIATION_INTERVAL_MS);
        return;
      }
      const jwt = getAuthJwt();
      if (
        typeof jwt !== "string" ||
        !isAuthJwtUsable(jwt) ||
        getSocketIdentityKey(jwt) !== authIdentity
      ) {
        return;
      }
      hasAttemptedSnapshot = true;
      const result = await requestSnapshot(
        expectedProfileId,
        jwt,
        expectedActivationId
      );
      if (result === "stale") {
        return;
      }
      if (result === "synchronized") {
        recoveryAttempt = 0;
        scheduleSnapshot(SNAPSHOT_RECONCILIATION_INTERVAL_MS);
        return;
      }
      if (result === "terminal-failure") {
        return;
      }
      const retryDelay = getSnapshotRetryDelay(recoveryAttempt);
      recoveryAttempt += 1;
      nextSnapshotAllowedAtByActivationRef.current.set(
        expectedActivationId,
        Date.now() + retryDelay
      );
      scheduleSnapshot(retryDelay);
    }

    // A socket that is still connecting gets a few seconds: its first
    // connect starts this snapshot, which then also covers the gap before
    // the socket was ready. Otherwise the snapshot starts now.
    let initialTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelWaitForConnect: (() => void) | null = null;
    const startInitialSnapshot = () => {
      cancelWaitForConnect?.();
      cancelWaitForConnect = null;
      if (initialTimer !== null) {
        clearTimeout(initialTimer);
        initialTimer = null;
      }
      void synchronizeSnapshot();
    };
    if (
      socketStatusRef.current === WebSocketStatus.CONNECTING ||
      socketStatusRef.current === WebSocketStatus.AUTHENTICATING
    ) {
      cancelWaitForConnect =
        reconnectResync.runOnNextConnect(startInitialSnapshot);
      initialTimer = setTimeout(
        startInitialSnapshot,
        INITIAL_SNAPSHOT_SOCKET_WAIT_MS
      );
    } else {
      startInitialSnapshot();
    }
    return () => {
      cancelled = true;
      cancelWaitForConnect?.();
      if (initialTimer !== null) {
        clearTimeout(initialTimer);
      }
      if (reconciliationTimer !== null) {
        clearTimeout(reconciliationTimer);
      }
    };
  }, [
    activeProfileId,
    authIdentity,
    hasUsableAuthJwt,
    isAuthenticated,
    reconnectResync,
    requestSnapshot,
    profileActivation.id,
  ]);

  const applyServerState = useCallback(
    (
      state: ApiDmUnreadConversationState,
      expectedProfileId: string | null,
      expectedActivationId: number
    ): boolean => {
      const activation = activeActivationRef.current;
      if (
        expectedProfileId === null ||
        state.profile_id !== expectedProfileId ||
        activation.profileId !== expectedProfileId ||
        activation.id !== expectedActivationId
      ) {
        return false;
      }
      return store.applyServerState(state);
    },
    [store]
  );

  const beginRead = useCallback(
    (
      expectedProfileId: string | null,
      expectedActivationId: number,
      waveId: string,
      readThroughSerialNo?: number
    ): DmUnreadReadOperation | null => {
      const activation = activeActivationRef.current;
      if (
        expectedProfileId === null ||
        activation.profileId !== expectedProfileId ||
        activation.id !== expectedActivationId
      ) {
        return null;
      }
      return store.beginRead(expectedProfileId, waveId, readThroughSerialNo);
    },
    [store]
  );

  const handleUnreadStateChanged = useCallback(
    (value: unknown) => {
      if (!isDmUnreadConversationState(value)) {
        return;
      }
      const activation = activeActivationRef.current;
      applyServerState(value, activation.profileId, activation.id);
    },
    [applyServerState]
  );

  const { isConnected } = useWebSocketMessage<unknown>(
    WsMessageType.DM_UNREAD_STATE_CHANGED,
    handleUnreadStateChanged
  );

  const scheduleDropRecovery = useCallback(
    (
      authorId: string,
      serialNo: number,
      waveId: string,
      isDirectMessage: unknown
    ) => {
      const activation = activeActivationRef.current;
      const profileId = activation.profileId;
      if (!profileId || authorId === profileId) {
        return;
      }
      if (!store.needsIncomingDropRecovery(profileId, waveId, serialNo)) {
        return;
      }
      const delayMs = dropRecoveryPolicy.getDelay({
        waveId,
        isDirectMessage,
        hasConversation: store.hasConversation(profileId, waveId),
        queryClient,
      });
      if (delayMs === null) {
        return;
      }
      const previousPending = pendingDropRecoveryByWaveRef.current.get(waveId);
      pendingDropRecoveryByWaveRef.current.set(waveId, {
        minimumSnapshotRequestId: Math.max(
          previousPending?.minimumSnapshotRequestId ?? 0,
          nextSnapshotRequestIdRef.current
        ),
        serialNo: Math.max(
          previousPending?.serialNo ?? 0,
          Math.floor(serialNo)
        ),
      });
      // One timer per tab; a direct message can pull a later check earlier.
      const dueAt = Date.now() + delayMs;
      if (dropRecoveryTimerRef.current !== null) {
        if (dropRecoveryDueAtRef.current <= dueAt) return;
        clearTimeout(dropRecoveryTimerRef.current);
      }
      dropRecoveryDueAtRef.current = dueAt;
      const expectedActivationId = activation.id;
      dropRecoveryTimerRef.current = setTimeout(() => {
        dropRecoveryTimerRef.current = null;
        const pendingDrops = Array.from(
          pendingDropRecoveryByWaveRef.current.entries()
        );
        pendingDropRecoveryByWaveRef.current.clear();
        const currentActivation = activeActivationRef.current;
        if (
          currentActivation.id !== expectedActivationId ||
          currentActivation.profileId !== profileId
        ) {
          return;
        }
        const hasLaggingConversation = pendingDrops.some(
          ([pendingWaveId, pending]) =>
            store.needsIncomingDropRecovery(
              profileId,
              pendingWaveId,
              pending.serialNo
            )
        );
        if (hasLaggingConversation) {
          const minimumRequestId = Math.max(
            ...pendingDrops.map(
              ([, pending]) => pending.minimumSnapshotRequestId
            )
          );
          void requestDropRecoverySnapshot(minimumRequestId);
        }
      }, delayMs);
    },
    [dropRecoveryPolicy, queryClient, requestDropRecoverySnapshot, store]
  );

  const handleDropUpdate = useCallback(
    (value: unknown) => {
      if (isIncomingDropUpdate(value)) {
        scheduleDropRecovery(
          value.author.id,
          value.serial_no,
          value.wave.id,
          value.wave.is_direct_message
        );
      }
    },
    [scheduleDropRecovery]
  );

  const handleDropUpdateRef = useCallback(
    (value: unknown) => {
      if (isIncomingDropUpdateRef(value)) {
        scheduleDropRecovery(
          value.author_id,
          value.serial_no,
          value.wave_id,
          undefined
        );
      }
    },
    [scheduleDropRecovery]
  );

  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE, handleDropUpdate);
  useWebSocketMessage<unknown>(
    WsMessageType.DROP_UPDATE_REF,
    handleDropUpdateRef
  );

  // Snapshot on the first connection, after reconnects and on the server's
  // resync marker, which means DM frames may not have arrived.
  useWebSocketMessage<unknown>(WsMessageType.RESYNC_REQUIRED, () =>
    reconnectResync.schedule(requestActiveSnapshot)
  );
  useEffect(() => {
    reconnectResync.update(isConnected, requestActiveSnapshot);
  }, [isConnected, reconnectResync, requestActiveSnapshot]);

  useEffect(() => {
    if (!isCapacitor) {
      return;
    }
    if (!previousMobileActiveRef.current && isActive) {
      void requestActiveSnapshot();
    }
    previousMobileActiveRef.current = isActive;
  }, [isActive, isCapacitor, requestActiveSnapshot]);

  useEffect(() => {
    if (isCapacitor) {
      return;
    }
    // Focus and visibility fire often on desktop; a snapshot runs only after
    // the tab was hidden 30 s or more, or 60 s after the last snapshot.
    // Coming back online follows a real connectivity gap and always syncs.
    let hiddenSince: number | null =
      document.visibilityState === "visible" ? null : Date.now();
    const synchronizeIfVisible = (event: Event) => {
      if (document.visibilityState !== "visible") {
        if (event.type === "visibilitychange") hiddenSince ??= Date.now();
        return;
      }
      const shouldSync =
        event.type === "online" ||
        shouldResyncOnResume({
          now: Date.now(),
          hiddenSince,
          lastSyncAt: lastSnapshotStartedAtRef.current,
        });
      hiddenSince = null;
      if (shouldSync) void requestActiveSnapshot();
    };
    document.addEventListener("visibilitychange", synchronizeIfVisible);
    window.addEventListener("focus", synchronizeIfVisible);
    window.addEventListener("online", synchronizeIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", synchronizeIfVisible);
      window.removeEventListener("focus", synchronizeIfVisible);
      window.removeEventListener("online", synchronizeIfVisible);
    };
  }, [isCapacitor, requestActiveSnapshot]);

  const reconcileFailedRead = useCallback(
    async (operation: DmUnreadReadOperation): Promise<void> => {
      if (activeProfileIdRef.current === operation.profileId) {
        const jwt = getAuthJwt();
        if (typeof jwt === "string" && isAuthJwtUsable(jwt)) {
          await requestSnapshot(
            operation.profileId,
            jwt,
            activeActivationRef.current.id
          );
        }
      }
      store.rollbackRead(operation);
    },
    [requestSnapshot, store]
  );

  const cancelRead = useCallback(
    (operation: DmUnreadReadOperation): void => {
      store.rollbackRead(operation);
    },
    [store]
  );

  const contextValue = useMemo<DmUnreadContextValue>(
    () => ({
      activeProfileId,
      activationId: profileActivation.id,
      store,
      applyServerState,
      beginRead,
      reconcileFailedRead,
      cancelRead,
    }),
    [
      activeProfileId,
      applyServerState,
      beginRead,
      cancelRead,
      profileActivation.id,
      reconcileFailedRead,
      store,
    ]
  );

  return (
    <DmUnreadContext.Provider value={contextValue}>
      {children}
    </DmUnreadContext.Provider>
  );
}

export {
  useDmUnreadConversation,
  useDmUnreadConversations,
  useDmUnreadSummary,
  useOptionalDmUnreadActions,
} from "./dm-unread-hooks";
