"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { MinimalWave } from "./hooks/useEnhancedWavesListCore";
import type {
  WaveUnreadEntry,
  WaveUnreadSnapshot,
  WaveUnreadStore,
} from "./hooks/waveUnreadStore";

/**
 * Live unread values for the main wave list.
 *
 * Wave objects from the stream context carry the server's unread values and
 * keep their identity while messages arrive. Components that show unread
 * counts, dividers or activity order read the live values here, so a received
 * message re-renders only the lists and rows that show its wave.
 */
export interface WaveUnreadSource {
  readonly store: WaveUnreadStore;
  /**
   * The wave with the live entry applied. Returns the same object for the
   * same wave and entry, and the wave itself when there is no entry.
   */
  readonly resolve: (
    wave: MinimalWave,
    unread: WaveUnreadEntry | undefined
  ) => MinimalWave;
}

const WaveUnreadContext = createContext<WaveUnreadSource | null>(null);

export const WaveUnreadProvider = WaveUnreadContext.Provider;

const EMPTY_SNAPSHOT: WaveUnreadSnapshot = new Map();
const subscribeNowhere = () => () => {};
const getEmptySnapshot = () => EMPTY_SNAPSHOT;

/**
 * The waves with live unread values, for lists that badge or sort them. Only
 * waves whose entry changed get a new object; the others keep theirs.
 */
export function useWavesWithUnread(waves: MinimalWave[]): MinimalWave[] {
  const source = useContext(WaveUnreadContext);
  const store = source?.store;
  const snapshot = useSyncExternalStore(
    store ? store.subscribeAll : subscribeNowhere,
    store ? store.getSnapshot : getEmptySnapshot,
    getEmptySnapshot
  );
  return useMemo(() => {
    if (!source || snapshot.size === 0) return waves;
    let changed = false;
    const resolved: MinimalWave[] = [];
    for (const wave of waves) {
      const next = source.resolve(wave, snapshot.get(wave.id));
      if (next !== wave) changed = true;
      resolved.push(next);
    }
    return changed ? resolved : waves;
  }, [snapshot, source, waves]);
}

/** One wave with its live unread values; re-renders only for that wave. */
export function useWaveUnread(
  wave: MinimalWave | undefined
): MinimalWave | undefined {
  const source = useContext(WaveUnreadContext);
  const store = source?.store;
  const waveId = wave?.id;
  const subscribe = useCallback(
    (onChange: () => void) =>
      store && waveId ? store.subscribe(waveId, onChange) : () => {},
    [store, waveId]
  );
  const getEntry = useCallback(
    () => (store && waveId ? store.get(waveId) : undefined),
    [store, waveId]
  );
  const unread = useSyncExternalStore(subscribe, getEntry, () => undefined);
  return useMemo(
    () => (wave && source ? source.resolve(wave, unread) : wave),
    [source, unread, wave]
  );
}
