import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import { useContext, useMemo, useSyncExternalStore } from "react";
import {
  DmUnreadContext,
  type DmUnreadContextValue,
} from "./dm-unread-context";
import {
  getDmUnreadConversation,
  getDmUnreadConversations,
  getDmUnreadSummary,
  type DmUnreadSummary,
} from "./dm-unread-store";

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
