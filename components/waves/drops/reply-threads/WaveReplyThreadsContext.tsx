"use client";

import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
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
 * Bumps the parent's reply count when a new reply arrives. A later refetch of
 * the parent replaces the bumped count with the server count.
 */
function useLiveReplyCounts(waveId: string, enabled: boolean) {
  const { applyOptimisticDropUpdate } = useMyStream();
  const [mountedAt] = useState(() => Date.now());
  const countedReplyIdsRef = useRef(new Set<string>());

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (drop) => {
        const parentDropId = drop.reply_to?.drop_id;
        const isNewReply =
          enabled &&
          drop.wave.id === waveId &&
          !!parentDropId &&
          !drop.updated_at &&
          drop.created_at >= mountedAt &&
          !countedReplyIdsRef.current.has(drop.id);
        if (!isNewReply) {
          return;
        }
        countedReplyIdsRef.current.add(drop.id);
        applyOptimisticDropUpdate({
          waveId,
          dropId: parentDropId,
          update: (draft) =>
            draft.type === DropSize.FULL
              ? { ...draft, replies_count: (draft.replies_count ?? 0) + 1 }
              : draft,
        });
      },
      [applyOptimisticDropUpdate, enabled, mountedAt, waveId]
    )
  );
}

export const useExpandedReplyThreadsStore = (): ExpandedReplyThreadsStore =>
  useState(createExpandedReplyThreadsStore)[0];

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
