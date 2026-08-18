"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DmUnreadStore,
  getDmUnreadConversation,
  getDmUnreadConversations,
  getDmUnreadSnapshotReady,
  getDmUnreadSummary,
  type DmUnreadReadOperation,
  type DmUnreadSummary,
} from "./dm-unread-store";

interface DmUnreadContextValue {
  readonly activeProfileId: string | null;
  readonly activationId: number;
  readonly store: DmUnreadStore;
  readonly applyServerState: (
    state: ApiDmUnreadConversationState,
    expectedProfileId: string | null,
    expectedActivationId: number
  ) => boolean;
  readonly beginRead: (
    expectedProfileId: string | null,
    expectedActivationId: number,
    waveId: string,
    readThroughSerialNo?: number
  ) => DmUnreadReadOperation | null;
  readonly reconcileFailedRead: (
    operation: DmUnreadReadOperation
  ) => Promise<void>;
  readonly cancelRead: (operation: DmUnreadReadOperation) => void;
}

const DmUnreadContext = createContext<DmUnreadContextValue | null>(null);
const RECOVERY_SNAPSHOT_COOLDOWN_MS = 1_500;
const DM_WAVE_LIST_INVALIDATION_DELAY_MS = 250;
const SNAPSHOT_RETRY_DELAYS_MS = [250, 750] as const;
let nextProfileActivationId = 1;

interface InFlightSnapshotRequest {
  readonly activationId: number;
  readonly jwt: string;
  readonly promise: Promise<boolean>;
  readonly requestId: number;
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

interface SnapshotSynchronizationRequest {
  readonly expectedProfileId: string;
  readonly isCurrentRequest: () => boolean;
  readonly jwt: string;
  readonly startedAtSequence: number;
  readonly store: DmUnreadStore;
}

const waitForSnapshotRetry = (delay: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delay);
  });

const synchronizeDmUnreadSnapshot = async (
  request: SnapshotSynchronizationRequest,
  attempt = 0
): Promise<boolean> => {
  try {
    const response = await commonApiFetch<unknown>({
      endpoint: "dm-drops/unread/snapshot",
      headers: { Authorization: `Bearer ${request.jwt}` },
      errorMode: "structured",
    });
    if (!request.isCurrentRequest()) {
      return false;
    }
    if (
      !isDmUnreadSnapshot(response) ||
      response.profile_id !== request.expectedProfileId
    ) {
      throw new Error("Invalid DM unread snapshot response");
    }
    request.store.applySnapshot(response, request.startedAtSequence);
    return true;
  } catch (error) {
    if (!request.isCurrentRequest()) {
      return false;
    }
    const retryDelay = SNAPSHOT_RETRY_DELAYS_MS[attempt];
    const status = getQueryErrorStatus(error);
    if (retryDelay === undefined || (status !== null && status < 500)) {
      console.error("Failed to synchronize DM unread state", error);
      return false;
    }
    await waitForSnapshotRetry(retryDelay);
    if (!request.isCurrentRequest()) {
      return false;
    }
    return synchronizeDmUnreadSnapshot(request, attempt + 1);
  }
};

export function DmUnreadStateProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const queryClient = useQueryClient();
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
  const isMountedRef = useRef(true);
  const latestSnapshotRequestByProfileRef = useRef(new Map<string, number>());
  const inFlightSnapshotByProfileRef = useRef(
    new Map<string, InFlightSnapshotRequest>()
  );
  const nextSnapshotRequestIdRef = useRef(1);
  const lastRecoverySnapshotAtRef = useRef(0);
  const dmWaveListInvalidationTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const previousWebSocketStatusRef = useRef<WebSocketStatus | null>(null);
  const previousMobileActiveRef = useRef(isActive);
  const authJwt = getAuthJwt();
  const authFingerprint = getAuthTokenFingerprint(authJwt);

  useLayoutEffect(() => {
    activeProfileIdRef.current = activeProfileId;
    activeActivationRef.current = profileActivation;
    if (activeProfileId) {
      store.resetProfile(activeProfileId);
    }
  }, [activeProfileId, profileActivation, store]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
      expectedActivationId: number
    ): Promise<boolean> => {
      const existingRequest =
        inFlightSnapshotByProfileRef.current.get(expectedProfileId);
      if (
        existingRequest?.jwt === jwt &&
        existingRequest.activationId === expectedActivationId
      ) {
        return existingRequest.promise;
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
      }).finally(() => {
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

  const requestActiveSnapshot = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    if (
      now - lastRecoverySnapshotAtRef.current <
      RECOVERY_SNAPSHOT_COOLDOWN_MS
    ) {
      return false;
    }
    const activation = activeActivationRef.current;
    const profileId = activation.profileId;
    const jwt = getAuthJwt();
    if (!profileId || typeof jwt !== "string" || !isAuthJwtUsable(jwt)) {
      return false;
    }
    lastRecoverySnapshotAtRef.current = now;
    return requestSnapshot(profileId, jwt, activation.id);
  }, [requestSnapshot]);

  useEffect(() => {
    if (
      !activeProfileId ||
      !isAuthenticated ||
      typeof authJwt !== "string" ||
      !isAuthJwtUsable(authJwt)
    ) {
      return;
    }
    void requestSnapshot(activeProfileId, authJwt, profileActivation.id);
  }, [
    activeProfileId,
    authFingerprint,
    authRevision,
    authJwt,
    isAuthenticated,
    requestSnapshot,
    profileActivation.id,
  ]);

  const invalidateDmWaveLists = useCallback(() => {
    if (dmWaveListInvalidationTimerRef.current !== null) {
      return;
    }
    dmWaveListInvalidationTimerRef.current = setTimeout(() => {
      dmWaveListInvalidationTimerRef.current = null;
      queryClient
        .invalidateQueries(
          {
            predicate: (query) => {
              const [key, params] = query.queryKey;
              return (
                key === QueryKey.WAVES_V2 &&
                isRecord(params) &&
                params["direct_message"] === true
              );
            },
          },
          { cancelRefetch: false }
        )
        .catch(() => undefined);
    }, DM_WAVE_LIST_INVALIDATION_DELAY_MS);
  }, [queryClient]);

  useEffect(
    () => () => {
      if (dmWaveListInvalidationTimerRef.current !== null) {
        clearTimeout(dmWaveListInvalidationTimerRef.current);
      }
    },
    []
  );

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
      const changed = store.applyServerState(state);
      if (changed) {
        invalidateDmWaveLists();
      }
      return changed;
    },
    [invalidateDmWaveLists, store]
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

  useEffect(() => {
    const previousStatus = previousWebSocketStatusRef.current;
    const currentStatus = isConnected
      ? WebSocketStatus.CONNECTED
      : WebSocketStatus.DISCONNECTED;
    previousWebSocketStatusRef.current = currentStatus;
    if (
      // The websocket hook exposes connection state, not a reconnect callback.
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
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

const useDmUnreadContext = (): DmUnreadContextValue => {
  const context = useContext(DmUnreadContext);
  if (!context) {
    throw new Error(
      "DM unread selectors must be used within DmUnreadStateProvider"
    );
  }
  return context;
};

export const useDmUnreadConversation = (
  waveId: string
): ApiDmUnreadConversationState | null => {
  const { activeProfileId, store } = useDmUnreadContext();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  return getDmUnreadConversation(snapshot, activeProfileId, waveId);
};

export const useDmUnreadSummary = (): DmUnreadSummary => {
  const { activeProfileId, store } = useDmUnreadContext();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  return getDmUnreadSummary(snapshot, activeProfileId);
};

export const useDmUnreadConversations = (): Readonly<
  Record<string, ApiDmUnreadConversationState>
> => {
  const { activeProfileId, store } = useDmUnreadContext();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  return useMemo(
    () => getDmUnreadConversations(snapshot, activeProfileId),
    [activeProfileId, snapshot]
  );
};

export const useDmUnreadSnapshotReady = (): boolean => {
  const { activeProfileId, store } = useDmUnreadContext();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  return getDmUnreadSnapshotReady(snapshot, activeProfileId);
};

export const useOptionalDmUnreadActions = () => {
  const context = useContext(DmUnreadContext);
  const activeProfileId = context?.activeProfileId ?? null;
  const activationId = context?.activationId ?? 0;
  const applyServerState = context?.applyServerState ?? null;
  const beginRead = context?.beginRead ?? null;
  const cancelRead = context?.cancelRead ?? null;
  const reconcileFailedRead = context?.reconcileFailedRead ?? null;
  const store = context?.store ?? null;
  return useMemo(() => {
    if (
      !store ||
      !applyServerState ||
      !beginRead ||
      !cancelRead ||
      !reconcileFailedRead
    ) {
      return null;
    }
    return {
      activeProfileId,
      applyServerState: (state: ApiDmUnreadConversationState) =>
        applyServerState(state, activeProfileId, activationId),
      beginRead: (waveId: string, readThroughSerialNo?: number) =>
        beginRead(activeProfileId, activationId, waveId, readThroughSerialNo),
      cancelRead,
      reconcileFailedRead,
    };
  }, [
    activationId,
    activeProfileId,
    applyServerState,
    beginRead,
    cancelRead,
    reconcileFailedRead,
    store,
  ]);
};
