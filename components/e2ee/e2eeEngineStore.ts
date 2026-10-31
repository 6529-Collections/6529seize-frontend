import type {
  E2eeConversation,
  E2eeDeviceInfo,
  E2eeEngine,
  E2eeEngineStatus,
  E2eeMessage,
} from "@/lib/e2ee/types";

/** Engine state read synchronously; one object per engine change. */
export interface E2eeEngineSnapshot {
  readonly version: number;
  readonly status: E2eeEngineStatus;
  readonly error: string | null;
  readonly thisDevice: E2eeDeviceInfo | null;
  readonly devices: readonly E2eeDeviceInfo[];
  readonly conversations: readonly E2eeConversation[];
  readonly attachmentsEnabled: boolean;
}

export interface E2eeConversationSnapshot {
  readonly version: number;
  readonly conversation: E2eeConversation | null;
  readonly messages: readonly E2eeMessage[];
}

/**
 * Wraps an engine so React can read it with `useSyncExternalStore`. Each
 * engine change bumps a version; snapshots are cached per version so their
 * identity is stable between changes, whatever the engine returns.
 */
export interface E2eeEngineStore {
  readonly engine: E2eeEngine;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => E2eeEngineSnapshot;
  readonly getConversationSnapshot: (g: string) => E2eeConversationSnapshot;
  readonly dispose: () => void;
}

const readSnapshot = (
  engine: E2eeEngine,
  version: number
): E2eeEngineSnapshot => ({
  version,
  status: engine.getStatus(),
  error: engine.getError(),
  thisDevice: engine.getThisDevice(),
  devices: engine.getDevices(),
  conversations: engine.getConversations(),
  attachmentsEnabled: engine.getAttachmentsEnabled(),
});

export function createE2eeEngineStore(
  engine: E2eeEngine,
  onChange?: (snapshot: E2eeEngineSnapshot) => void
): E2eeEngineStore {
  let version = 0;
  let snapshot: E2eeEngineSnapshot | null = null;
  const conversationSnapshots = new Map<string, E2eeConversationSnapshot>();
  const listeners = new Set<() => void>();

  const getSnapshot = (): E2eeEngineSnapshot => {
    if (snapshot?.version !== version) {
      snapshot = readSnapshot(engine, version);
    }
    return snapshot;
  };

  const unsubscribeEngine = engine.subscribe(() => {
    version += 1;
    conversationSnapshots.clear();
    onChange?.(getSnapshot());
    for (const listener of [...listeners]) {
      listener();
    }
  });

  return {
    engine,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot,
    getConversationSnapshot: (g) => {
      const cached = conversationSnapshots.get(g);
      if (cached?.version === version) {
        return cached;
      }
      const next: E2eeConversationSnapshot = {
        version,
        conversation: engine.getConversation(g),
        messages: engine.getMessages(g),
      };
      conversationSnapshots.set(g, next);
      return next;
    },
    dispose: () => {
      unsubscribeEngine();
      listeners.clear();
      conversationSnapshots.clear();
    },
  };
}
