"use client";

import { useSyncExternalStore } from "react";

interface NotificationRealtimeState {
  readonly connected: boolean;
  readonly syncedProfileIds: readonly string[];
}

const DISCONNECTED_STATE: NotificationRealtimeState = {
  connected: false,
  syncedProfileIds: [],
};

let state = DISCONNECTED_STATE;
// AppWebSocketProvider mounts exactly one owner. Keeping the snapshot outside
// React lets polling hooks consume it without coupling them to socket context.
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const setNotificationRealtimeState = (
  connected: boolean,
  profileIds: readonly string[] = []
): void => {
  const syncedProfileIds = connected
    ? Array.from(new Set(profileIds.filter((profileId) => !!profileId))).sort()
    : [];
  if (
    state.connected === connected &&
    state.syncedProfileIds.length === syncedProfileIds.length &&
    state.syncedProfileIds.every(
      (profileId, index) => profileId === syncedProfileIds[index]
    )
  ) {
    return;
  }
  state = { connected, syncedProfileIds };
  emit();
};

export const useNotificationRealtimeState = (): NotificationRealtimeState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => DISCONNECTED_STATE
  );
