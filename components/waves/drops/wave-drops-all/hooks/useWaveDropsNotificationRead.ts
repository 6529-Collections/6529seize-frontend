import { useWaveNotificationsReadMarkerState } from "@/hooks/useMarkWaveNotificationsRead";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface UseWaveDropsNotificationReadParams {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
}

interface ReadSyncState {
  readonly waveId: string;
  readonly identityKey: string;
  readonly proxyRoleIdentityKey: string | null;
}

type ReadSyncStatus = "pending" | "success" | "failed" | "skipped";

interface ReadSyncAttempt {
  readonly state: ReadSyncState;
  readonly promise: Promise<ReadSyncStatus>;
  status: ReadSyncStatus;
}

interface ReadGuardState {
  readonly enabled: boolean;
  readonly hookInstanceId: symbol;
  readonly waveId: string;
}

const usedTemporaryProxyRole = (state: ReadSyncState): boolean =>
  state.proxyRoleIdentityKey !== null &&
  state.identityKey === state.proxyRoleIdentityKey;

const usesLoadedProxyForSameRole = ({
  previousState,
  currentState,
}: {
  readonly previousState: ReadSyncState | null;
  readonly currentState: ReadSyncState;
}): boolean =>
  previousState !== null &&
  previousState.waveId === currentState.waveId &&
  usedTemporaryProxyRole(previousState) &&
  currentState.proxyRoleIdentityKey !== null &&
  currentState.identityKey !== currentState.proxyRoleIdentityKey &&
  previousState.identityKey === currentState.proxyRoleIdentityKey;

export const useWaveDropsNotificationRead = ({
  waveId,
  enabled = true,
  removeWaveDeliveredNotifications,
}: UseWaveDropsNotificationReadParams) => {
  const readSyncAttemptRef = useRef<ReadSyncAttempt | null>(null);
  const hookInstanceIdRef = useRef(Symbol("useWaveDropsNotificationRead"));
  const isHookMountedRef = useRef(false);
  const latestReadGuardStateRef = useRef<ReadGuardState>({
    enabled,
    hookInstanceId: hookInstanceIdRef.current,
    waveId,
  });

  useLayoutEffect(() => {
    latestReadGuardStateRef.current = {
      enabled,
      hookInstanceId: hookInstanceIdRef.current,
      waveId,
    };
  }, [enabled, waveId]);

  useLayoutEffect(() => {
    isHookMountedRef.current = true;

    return () => {
      isHookMountedRef.current = false;
    };
  }, []);

  const { markWaveNotificationsRead, identityKey, proxyRoleIdentityKey } =
    useWaveNotificationsReadMarkerState();
  const latestReadActionsRef = useRef({
    removeWaveDeliveredNotifications,
    markWaveNotificationsRead,
  });

  useLayoutEffect(() => {
    latestReadActionsRef.current = {
      removeWaveDeliveredNotifications,
      markWaveNotificationsRead,
    };
  }, [markWaveNotificationsRead, removeWaveDeliveredNotifications]);

  const canSendReadForWave = useCallback((expectedWaveId: string): boolean => {
    const latestState = latestReadGuardStateRef.current;

    return (
      isHookMountedRef.current &&
      latestState.hookInstanceId === hookInstanceIdRef.current &&
      latestState.waveId === expectedWaveId &&
      latestState.enabled === true &&
      document.visibilityState === "visible"
    );
  }, []);

  const syncReadState = useCallback(
    (state: ReadSyncState) => {
      const runReadSyncAttempt = async (
        currentState: ReadSyncState
      ): Promise<ReadSyncStatus> => {
        try {
          const { removeWaveDeliveredNotifications: latestRemove } =
            latestReadActionsRef.current;
          await Promise.resolve(latestRemove(currentState.waveId));
        } catch (error) {
          console.error(
            "Failed to remove wave delivered notifications:",
            error
          );
        }

        try {
          const { markWaveNotificationsRead: latestMarkRead } =
            latestReadActionsRef.current;
          const readResult = await latestMarkRead(currentState.waveId, {
            shouldSend: () => canSendReadForWave(currentState.waveId),
          });
          return readResult === "sent" ? "success" : "skipped";
        } catch (error) {
          console.error("Failed to mark feed as read:", error);
          return "failed";
        }
      };

      const trackReadSyncAttempt = ({
        currentState,
        promise,
      }: {
        readonly currentState: ReadSyncState;
        readonly promise: Promise<ReadSyncStatus>;
      }): ReadSyncAttempt => {
        let attempt: ReadSyncAttempt | null = null;
        const trackedPromise = promise.then((status) => {
          if (attempt) {
            attempt.status = status;
          }
          return status;
        });

        attempt = {
          state: currentState,
          status: "pending",
          promise: trackedPromise,
        };
        readSyncAttemptRef.current = attempt;
        return attempt;
      };

      const markReadSyncAttemptCovered = (currentState: ReadSyncState) => {
        readSyncAttemptRef.current = {
          state: currentState,
          status: "success",
          promise: Promise.resolve("success"),
        };
      };

      if (document.visibilityState !== "visible") {
        return;
      }

      const previousAttempt = readSyncAttemptRef.current;

      if (
        usesLoadedProxyForSameRole({
          previousState: previousAttempt?.state ?? null,
          currentState: state,
        })
      ) {
        if (previousAttempt?.status === "success") {
          markReadSyncAttemptCovered(state);
          return;
        }

        if (previousAttempt?.status === "pending") {
          let followUpAttempt: ReadSyncAttempt | null = null;
          const followUpPromise = previousAttempt.promise.then(
            async (previousStatus) => {
              if (previousStatus === "success") {
                return "success";
              }

              if (readSyncAttemptRef.current !== followUpAttempt) {
                return "failed";
              }

              return runReadSyncAttempt(state);
            }
          );

          followUpAttempt = trackReadSyncAttempt({
            currentState: state,
            promise: followUpPromise,
          });
          return;
        }
      }

      trackReadSyncAttempt({
        currentState: state,
        promise: runReadSyncAttempt(state),
      });
    },
    [canSendReadForWave]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const syncReadStateWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void syncReadState({
          waveId,
          identityKey,
          proxyRoleIdentityKey,
        });
      }
    };

    syncReadState({
      waveId,
      identityKey,
      proxyRoleIdentityKey,
    });
    document.addEventListener("visibilitychange", syncReadStateWhenVisible);
    return () =>
      document.removeEventListener(
        "visibilitychange",
        syncReadStateWhenVisible
      );
  }, [enabled, identityKey, proxyRoleIdentityKey, syncReadState, waveId]);
};
