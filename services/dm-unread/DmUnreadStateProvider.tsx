"use client";

import { useAuth } from "@/components/auth/Auth";
import { getQueryErrorStatus } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import type { ApiDmUnreadSnapshot } from "@/generated/models/ApiDmUnreadSnapshot";
import { WsMessageType } from "@/helpers/Types";
import useCapacitor from "@/hooks/useCapacitor";
import { commonApiFetch } from "@/services/api/common-api";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  isAuthJwtUsable,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import type { ReactNode } from "react";
import {
  useCallback,
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
import { DmUnreadStore, type DmUnreadReadOperation } from "./dm-unread-store";
const RECOVERY_SNAPSHOT_COOLDOWN_MS = 1_500;
const DROP_UPDATE_RECOVERY_GRACE_MS = 1_500;
const SNAPSHOT_RECONCILIATION_INTERVAL_MS = 5 * 60 * 1_000;
const SNAPSHOT_RETRY_BASE_DELAYS_MS = [
  5_000,
  30_000,
  SNAPSHOT_RECONCILIATION_INTERVAL_MS,
] as const;
const SNAPSHOT_RETRY_JITTER_RATIO = 0.2;
let nextProfileActivationId = 1;

type SnapshotSynchronizationResult =
  | "synchronized"
  | "retryable-failure"
  | "terminal-failure"
  | "stale";

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

interface IncomingDropUpdate {
  readonly author: { readonly id: string };
  readonly serial_no: number;
  readonly wave: { readonly id: string };
}

interface IncomingDropUpdateRef {
  readonly author_id: string;
  readonly serial_no: number;
  readonly update_type: string;
  readonly wave_id: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDmUnreadConversationState = (
  value: unknown
): value is ApiDmUnreadConversationState => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value["profile_id"] === "string" &&
    typeof value["wave_id"] === "string" &&
    typeof value["unread_count"] === "number" &&
    (value["first_unread_drop_serial_no"] === null ||
      typeof value["first_unread_drop_serial_no"] === "number") &&
    typeof value["latest_drop_serial_no"] === "number" &&
    typeof value["latest_read_serial_no"] === "number" &&
    typeof value["version"] === "number"
  );
};

const isDmUnreadSnapshot = (value: unknown): value is ApiDmUnreadSnapshot => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value["profile_id"] === "string" &&
    typeof value["count"] === "number" &&
    Array.isArray(value["conversations"]) &&
    value["conversations"].every(isDmUnreadConversationState)
  );
};

const isIncomingDropUpdate = (value: unknown): value is IncomingDropUpdate => {
  if (!isRecord(value)) {
    return false;
  }
  const author = value["author"];
  const wave = value["wave"];
  return (
    typeof value["serial_no"] === "number" &&
    Number.isFinite(value["serial_no"]) &&
    isRecord(author) &&
    typeof author["id"] === "string" &&
    isRecord(wave) &&
    typeof wave["id"] === "string"
  );
};

const isIncomingDropUpdateRef = (
  value: unknown
): value is IncomingDropUpdateRef =>
  isRecord(value) &&
  typeof value["author_id"] === "string" &&
  typeof value["serial_no"] === "number" &&
  Number.isFinite(value["serial_no"]) &&
  value["update_type"] === WsMessageType.DROP_UPDATE &&
  typeof value["wave_id"] === "string";

interface SnapshotSynchronizationRequest {
  readonly expectedProfileId: string;
  readonly isCurrentRequest: () => boolean;
  readonly jwt: string;
  readonly startedAtSequence: number;
  readonly store: DmUnreadStore;
}

const getSnapshotRetryDelay = (attempt: number): number => {
  const baseDelay =
    SNAPSHOT_RETRY_BASE_DELAYS_MS[
      Math.min(attempt, SNAPSHOT_RETRY_BASE_DELAYS_MS.length - 1)
    ] ?? SNAPSHOT_RECONCILIATION_INTERVAL_MS;
  const jitterMultiplier =
    1 -
    SNAPSHOT_RETRY_JITTER_RATIO +
    ((globalThis.crypto.getRandomValues(new Uint32Array(1)).at(0) ?? 0) /
      2 ** 32) *
      SNAPSHOT_RETRY_JITTER_RATIO *
      2;
  return Math.round(baseDelay * jitterMultiplier);
};

const synchronizeDmUnreadSnapshot = async (
  request: SnapshotSynchronizationRequest
): Promise<SnapshotSynchronizationResult> => {
  try {
    const response = await commonApiFetch<unknown>({
      endpoint: "dm-drops/unread/snapshot",
      headers: { Authorization: `Bearer ${request.jwt}` },
      errorMode: "structured",
    });
    if (!request.isCurrentRequest()) {
      return "stale";
    }
    if (
      !isDmUnreadSnapshot(response) ||
      response.profile_id !== request.expectedProfileId
    ) {
      throw new Error("Invalid DM unread snapshot response");
    }
    request.store.applySnapshot(response, request.startedAtSequence);
    return "synchronized";
  } catch (error) {
    if (!request.isCurrentRequest()) {
      return "stale";
    }
    const status = getQueryErrorStatus(error);
    if (status !== null && status >= 400 && status < 500 && status !== 429) {
      console.error("Failed to synchronize DM unread state", error);
      return "terminal-failure";
    }
    return "retryable-failure";
  }
};

export function DmUnreadStateProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { activeProfileProxy, connectedProfile, isAuthenticated } = useAuth();
  const { isActive, isCapacitor } = useCapacitor();
  const [authRevision, setAuthRevision] = useState(0);
  const [store] = useState(() => new DmUnreadStore());
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
  const terminalSnapshotFailureActivationIdsRef = useRef(new Set<number>());
  const nextSnapshotAllowedAtByActivationRef = useRef(
    new Map<number, number>()
  );
  const previousWebSocketStatusRef = useRef<WebSocketStatus | null>(null);
  const previousMobileActiveRef = useRef(isActive);
  const pendingDropRecoveryByWaveRef = useRef(
    new Map<string, PendingDropRecovery>()
  );
  const dropRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const authJwt = getAuthJwt();
  const authFingerprint = getAuthTokenFingerprint(authJwt);

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
    };
  }, []);

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

  useEffect(() => {
    if (
      !activeProfileId ||
      !isAuthenticated ||
      typeof authJwt !== "string" ||
      !isAuthJwtUsable(authJwt)
    ) {
      return;
    }
    const expectedProfileId = activeProfileId;
    const expectedJwt = authJwt;
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
      hasAttemptedSnapshot = true;
      const result = await requestSnapshot(
        expectedProfileId,
        expectedJwt,
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

    void synchronizeSnapshot();
    return () => {
      cancelled = true;
      if (reconciliationTimer !== null) {
        clearTimeout(reconciliationTimer);
      }
    };
  }, [
    activeProfileId,
    authFingerprint,
    authRevision,
    authJwt,
    isAuthenticated,
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
    (authorId: string, serialNo: number, waveId: string) => {
      const activation = activeActivationRef.current;
      const profileId = activation.profileId;
      if (!profileId || authorId === profileId) {
        return;
      }
      if (!store.needsIncomingDropRecovery(profileId, waveId, serialNo)) {
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
      if (dropRecoveryTimerRef.current !== null) {
        return;
      }
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
      }, DROP_UPDATE_RECOVERY_GRACE_MS);
    },
    [requestDropRecoverySnapshot, store]
  );

  const handleDropUpdate = useCallback(
    (value: unknown) => {
      if (isIncomingDropUpdate(value)) {
        scheduleDropRecovery(value.author.id, value.serial_no, value.wave.id);
      }
    },
    [scheduleDropRecovery]
  );

  const handleDropUpdateRef = useCallback(
    (value: unknown) => {
      if (isIncomingDropUpdateRef(value)) {
        scheduleDropRecovery(value.author_id, value.serial_no, value.wave_id);
      }
    },
    [scheduleDropRecovery]
  );

  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE, handleDropUpdate);
  useWebSocketMessage<unknown>(
    WsMessageType.DROP_UPDATE_REF,
    handleDropUpdateRef
  );

  useEffect(() => {
    const previousStatus = previousWebSocketStatusRef.current;
    const currentStatus = isConnected
      ? WebSocketStatus.CONNECTED
      : WebSocketStatus.DISCONNECTED;
    previousWebSocketStatusRef.current = currentStatus;
    if (
      // The websocket hook exposes connection state, not a reconnect callback.
      currentStatus === WebSocketStatus.CONNECTED &&
      previousStatus !== WebSocketStatus.CONNECTED
    ) {
      void requestActiveSnapshot();
    }
  }, [isConnected, requestActiveSnapshot]);

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
    const synchronizeIfVisible = () => {
      if (document.visibilityState === "visible") {
        void requestActiveSnapshot();
      }
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
