"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
  readonly store: DmUnreadStore;
  readonly reconcileFailedRead: (
    operation: DmUnreadReadOperation
  ) => Promise<void>;
  readonly cancelRead: (operation: DmUnreadReadOperation) => void;
}

const DmUnreadContext = createContext<DmUnreadContextValue | null>(null);

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
  const activeProfileIdRef = useRef(activeProfileId);
  const latestSnapshotRequestByProfileRef = useRef(new Map<string, number>());
  const nextSnapshotRequestIdRef = useRef(1);
  const previousWebSocketStatusRef = useRef<WebSocketStatus | null>(null);
  const previousMobileActiveRef = useRef(isActive);
  const authJwt = getAuthJwt();
  const authFingerprint = getAuthTokenFingerprint(authJwt);

  useEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);

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
    async (expectedProfileId: string, jwt: string): Promise<boolean> => {
      const requestId = nextSnapshotRequestIdRef.current++;
      latestSnapshotRequestByProfileRef.current.set(
        expectedProfileId,
        requestId
      );
      try {
        const response = await commonApiFetch<unknown>({
          endpoint: "dm-drops/unread",
          headers: { Authorization: `Bearer ${jwt}` },
          errorMode: "structured",
        });
        if (
          latestSnapshotRequestByProfileRef.current.get(expectedProfileId) !==
            requestId ||
          !isDmUnreadSnapshot(response) ||
          response.profile_id !== expectedProfileId
        ) {
          return false;
        }
        store.applySnapshot(response);
        return true;
      } catch (error) {
        console.error("Failed to synchronize DM unread state", error);
        return false;
      }
    },
    [store]
  );

  const requestActiveSnapshot = useCallback(async (): Promise<boolean> => {
    const profileId = activeProfileIdRef.current;
    const jwt = getAuthJwt();
    if (!profileId || typeof jwt !== "string" || !isAuthJwtUsable(jwt)) {
      return false;
    }
    return requestSnapshot(profileId, jwt);
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
    void requestSnapshot(activeProfileId, authJwt);
  }, [
    activeProfileId,
    authFingerprint,
    authRevision,
    authJwt,
    isAuthenticated,
    requestSnapshot,
  ]);

  const invalidateDmWaveLists = useCallback(() => {
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
  }, [queryClient]);

  const handleUnreadStateChanged = useCallback(
    (value: unknown) => {
      if (!isDmUnreadConversationState(value)) {
        return;
      }
      if (store.applyServerState(value)) {
        invalidateDmWaveLists();
      }
    },
    [invalidateDmWaveLists, store]
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
          await requestSnapshot(operation.profileId, jwt);
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
    () => ({ activeProfileId, store, reconcileFailedRead, cancelRead }),
    [activeProfileId, cancelRead, reconcileFailedRead, store]
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
  const cancelRead = context?.cancelRead ?? null;
  const reconcileFailedRead = context?.reconcileFailedRead ?? null;
  const store = context?.store ?? null;
  return useMemo(() => {
    if (!store || !cancelRead || !reconcileFailedRead) {
      return null;
    }
    return {
      activeProfileId,
      applyServerState: (state: ApiDmUnreadConversationState) =>
        store.applyServerState(state),
      beginRead: (waveId: string, readThroughSerialNo?: number) =>
        store.beginRead(activeProfileId, waveId, readThroughSerialNo),
      cancelRead,
      reconcileFailedRead,
    };
  }, [activeProfileId, cancelRead, reconcileFailedRead, store]);
};
