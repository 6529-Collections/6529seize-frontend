import type {
  StreamListsSnapshot,
  StreamListsStore,
} from "./MyStreamContext.types";

type WritableStreamListsStore = StreamListsStore & {
  readonly set: (snapshot: StreamListsSnapshot) => void;
};

/**
 * Holds the wave lists the stream provider last committed, so handlers can
 * read them on click and selectors can subscribe to a narrow part of them
 * without re-rendering on every list refresh.
 */
export const createStreamListsStore = (): WritableStreamListsStore => {
  let snapshot: StreamListsSnapshot | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => snapshot,
    set: (next) => {
      if (next === snapshot) return;
      snapshot = next;
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
