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
  const lastReadSyncStateRef = useRef<ReadSyncState | null>(null);

  const syncReadState = useEffectEvent(async (state: ReadSyncState) => {
    if (document.visibilityState !== "visible") {
      return;
    }

    if (
      usesLoadedProxyForSameRole({
        previousState: lastReadSyncStateRef.current,
        currentState: state,
      })
    ) {
      lastReadSyncStateRef.current = state;
      return;
    }

    lastReadSyncStateRef.current = state;

    try {
      await Promise.resolve(removeWaveDeliveredNotifications(state.waveId));
    } catch (error) {
      console.error("Failed to remove wave delivered notifications:", error);
    }

    try {
      await markWaveNotificationsRead(state.waveId);
    } catch (error) {
      console.error("Failed to mark feed as read:", error);
    }
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

    void syncReadState({
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
