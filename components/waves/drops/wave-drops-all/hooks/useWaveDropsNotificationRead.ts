import { useWaveNotificationsReadMarkerState } from "@/hooks/useMarkWaveNotificationsRead";
import { useEffect, useEffectEvent, useRef } from "react";

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

type ReadSyncStatus = "pending" | "success" | "failed";

interface ReadSyncAttempt {
  readonly state: ReadSyncState;
  readonly promise: Promise<ReadSyncStatus>;
  status: ReadSyncStatus;
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
  const { markWaveNotificationsRead, identityKey, proxyRoleIdentityKey } =
    useWaveNotificationsReadMarkerState();
  const readSyncAttemptRef = useRef<ReadSyncAttempt | null>(null);

  const syncReadState = useEffectEvent((state: ReadSyncState) => {
    const runReadSyncAttempt = async (
      currentState: ReadSyncState
    ): Promise<ReadSyncStatus> => {
      try {
        await Promise.resolve(
          removeWaveDeliveredNotifications(currentState.waveId)
        );
      } catch (error) {
        console.error("Failed to remove wave delivered notifications:", error);
      }

      try {
        await markWaveNotificationsRead(currentState.waveId);
        return "success";
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
  });

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
  }, [enabled, identityKey, proxyRoleIdentityKey, waveId]);
};
