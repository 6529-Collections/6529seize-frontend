import type { MinimalWaveNewDropsCount } from "./useNewDropCounter";

/**
 * Per-wave unread state the client keeps on top of the server's counts:
 * live new-drop counts from the socket, plus local read and mark-unread
 * overrides.
 *
 * The server count stays authoritative. Wave lists carry it, and an entry
 * only adds what the client learned since the list loaded, as before. The
 * entries live outside React state, so a received message no longer rebuilds
 * every wave object or the stream context; the lists and rows that show a
 * wave subscribe to it.
 */
export interface WaveUnreadEntry {
  /** Live socket deltas since the list was last loaded. */
  readonly newDrops: MinimalWaveNewDropsCount | undefined;
  /** Read locally: hides the server unread count until new drops arrive. */
  readonly cleared: boolean;
  /** Marked unread locally: replaces the server unread count. */
  readonly forcedCount: number | undefined;
}

export type NewDropsCounts = Readonly<Record<string, MinimalWaveNewDropsCount>>;
export type WaveUnreadSnapshot = ReadonlyMap<string, WaveUnreadEntry>;

type Listener = () => void;

const EMPTY_COUNTS: NewDropsCounts = {};

export interface WaveUnreadStore {
  /** Immutable; replaced whenever any entry changes. */
  readonly getSnapshot: () => WaveUnreadSnapshot;
  readonly get: (waveId: string) => WaveUnreadEntry | undefined;
  readonly getNewDropsCounts: () => NewDropsCounts;
  /** Applies a state-style updater to the live new-drop counts. */
  readonly updateNewDropsCounts: (
    update: (previous: NewDropsCounts) => NewDropsCounts
  ) => void;
  /** Drops every live new-drop count. */
  readonly clearNewDropsCounts: () => void;
  readonly setCleared: (waveId: string, cleared: boolean) => void;
  readonly setForcedCount: (waveId: string, count: number | undefined) => void;
  /** Notified when this wave's entry changes. */
  readonly subscribe: (waveId: string, listener: Listener) => () => void;
  /** Notified when any entry changes. */
  readonly subscribeAll: (listener: Listener) => () => void;
}

export function createWaveUnreadStore(): WaveUnreadStore {
  let newDropsCounts: NewDropsCounts = EMPTY_COUNTS;
  const cleared = new Set<string>();
  const forced = new Map<string, number>();
  let snapshot: WaveUnreadSnapshot = new Map();
  const waveListeners = new Map<string, Set<Listener>>();
  const allListeners = new Set<Listener>();

  const buildEntry = (waveId: string): WaveUnreadEntry | undefined => {
    const newDrops = newDropsCounts[waveId];
    const isCleared = cleared.has(waveId);
    const forcedCount = forced.get(waveId);
    if (newDrops === undefined && !isCleared && forcedCount === undefined) {
      return undefined;
    }
    const previous = snapshot.get(waveId);
    if (
      previous !== undefined &&
      previous.newDrops === newDrops &&
      previous.cleared === isCleared &&
      previous.forcedCount === forcedCount
    ) {
      return previous;
    }
    return { newDrops, cleared: isCleared, forcedCount };
  };

  const refresh = (waveIds: Iterable<string>) => {
    let next: Map<string, WaveUnreadEntry> | null = null;
    const changed: string[] = [];
    for (const waveId of waveIds) {
      const previous = snapshot.get(waveId);
      const entry = buildEntry(waveId);
      if (entry === previous) continue;
      next ??= new Map(snapshot);
      if (entry === undefined) next.delete(waveId);
      else next.set(waveId, entry);
      changed.push(waveId);
    }
    if (next === null) return;
    snapshot = next;
    for (const waveId of changed) {
      waveListeners.get(waveId)?.forEach((listener) => listener());
    }
    allListeners.forEach((listener) => listener());
  };

  const updateNewDropsCounts = (
    update: (previous: NewDropsCounts) => NewDropsCounts
  ) => {
    const previous = newDropsCounts;
    const next = update(previous);
    if (next === previous) return;
    newDropsCounts = next;
    const touched = new Set<string>();
    for (const waveId of Object.keys(previous)) {
      if (previous[waveId] !== next[waveId]) touched.add(waveId);
    }
    for (const waveId of Object.keys(next)) {
      if (previous[waveId] !== next[waveId]) touched.add(waveId);
    }
    refresh(touched);
  };

  return {
    getSnapshot: () => snapshot,
    get: (waveId) => snapshot.get(waveId),
    getNewDropsCounts: () => newDropsCounts,
    updateNewDropsCounts,
    clearNewDropsCounts: () => updateNewDropsCounts(() => EMPTY_COUNTS),
    setCleared(waveId, isCleared) {
      if (cleared.has(waveId) === isCleared) return;
      if (isCleared) cleared.add(waveId);
      else cleared.delete(waveId);
      refresh([waveId]);
    },
    setForcedCount(waveId, count) {
      if (forced.get(waveId) === count) return;
      if (count === undefined) forced.delete(waveId);
      else forced.set(waveId, count);
      refresh([waveId]);
    },
    subscribe(waveId, listener) {
      let listeners = waveListeners.get(waveId);
      if (!listeners) {
        listeners = new Set();
        waveListeners.set(waveId, listeners);
      }
      const waveSet = listeners;
      waveSet.add(listener);
      return () => {
        waveSet.delete(listener);
        if (waveSet.size === 0 && waveListeners.get(waveId) === waveSet) {
          waveListeners.delete(waveId);
        }
      };
    },
    subscribeAll(listener) {
      allListeners.add(listener);
      return () => {
        allListeners.delete(listener);
      };
    },
  };
}
