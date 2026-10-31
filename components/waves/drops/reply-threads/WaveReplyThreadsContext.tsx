"use client";

import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { createReplyCountReconciliation } from "./reply-count-reconciliation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface ExpandedReplyThreadsStore {
  readonly isExpanded: (dropId: string) => boolean;
  readonly setExpanded: (dropId: string, expanded: boolean) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

/**
 * Expanded state lives outside the drops so it survives virtual-scroll
 * unmounts, and each drop re-renders only when its own thread changes.
 */
const createExpandedReplyThreadsStore = (): ExpandedReplyThreadsStore => {
  const expandedDropIds = new Set<string>();
  const listeners = new Set<() => void>();
  return {
    isExpanded: (dropId) => expandedDropIds.has(dropId),
    setExpanded: (dropId, expanded) => {
      if (expandedDropIds.has(dropId) === expanded) {
        return;
      }
      if (expanded) {
        expandedDropIds.add(dropId);
      } else {
        expandedDropIds.delete(dropId);
      }
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

interface WaveReplyThreadsContextValue {
  readonly waveId: string;
  readonly store: ExpandedReplyThreadsStore;
  readonly getWave: () => ApiWave;
}

const WaveReplyThreadsContext =
  createContext<WaveReplyThreadsContextValue | null>(null);

/**
 * Reconcile the original thread as well as the immediate parent when replies
 * change. Compact events use the same API-backed ancestry traversal.
 */
function useLiveReplyCounts(waveId: string, enabled: boolean) {
  const { applyOptimisticDropUpdate } = useMyStreamActions();
  const reconciliationRef = useRef<ReturnType<
    typeof createReplyCountReconciliation
  > | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const reconciliation = createReplyCountReconciliation({
      waveId,
      fetchDrop: fetchDropByIdBatched,
      applyCount: (dropId, count) => {
        applyOptimisticDropUpdate({
          waveId,
          dropId,
          update: (draft) =>
            draft.type === DropSize.FULL
              ? { ...draft, replies_count: count }
              : draft,
        });
      },
      onError: (error) =>
        console.error("Failed to refresh collapsed reply counts:", error),
    });
    reconciliationRef.current = reconciliation;
    return () => {
      reconciliation.dispose();
      reconciliationRef.current = null;
    };
  }, [applyOptimisticDropUpdate, enabled, waveId]);

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (drop) => {
        const parentDropId = drop.reply_to?.drop_id;
        if (!enabled || drop.wave.id !== waveId || !parentDropId) {
          return;
        }
        reconciliationRef.current?.request(parentDropId);
      },
      [enabled, waveId]
    )
  );

  useWebSocketMessage<unknown>(
    WsMessageType.DROP_UPDATE_REF,
    useCallback(
      (message) => {
        if (
          enabled &&
          isWsDropUpdateRefData(message) &&
          message.wave_id === waveId &&
          message.update_type === WsMessageType.DROP_UPDATE
        ) {
          reconciliationRef.current?.request(message.drop_id);
        }
      },
      [enabled, waveId]
    )
  );
}

export const useExpandedReplyThreadsStore = (): ExpandedReplyThreadsStore => {
  const [store] = useState(createExpandedReplyThreadsStore);
  return store;
};

/** Provides reply threads only while `enabled`; children never remount. */
export function WaveReplyThreadsProvider({
  enabled,
  wave,
  store,
  children,
}: {
  readonly enabled: boolean;
  readonly wave: ApiWave;
  readonly store: ExpandedReplyThreadsStore;
  readonly children: ReactNode;
}) {
  const waveRef = useRef(wave);
  useEffect(() => {
    waveRef.current = wave;
  }, [wave]);
  useLiveReplyCounts(wave.id, enabled);

  const getWave = useCallback(() => waveRef.current, []);
  const value = useMemo(
    () => (enabled ? { waveId: wave.id, store, getWave } : null),
    [enabled, wave.id, store, getWave]
  );

  return (
    <WaveReplyThreadsContext.Provider value={value}>
      {children}
    </WaveReplyThreadsContext.Provider>
  );
}

/** Null outside the main stream of a collapsed-reply wave. */
export const useWaveReplyThreads = (): WaveReplyThreadsContextValue | null =>
  useContext(WaveReplyThreadsContext);

const noopSubscribe = () => () => undefined;

export function useReplyThreadExpanded(
  threads: WaveReplyThreadsContextValue | null,
  dropId: string
): boolean {
  return useSyncExternalStore(
    threads?.store.subscribe ?? noopSubscribe,
    () => threads?.store.isExpanded(dropId) ?? false,
    () => false
  );
}
