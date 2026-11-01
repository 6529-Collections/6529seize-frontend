import type { E2eeBackupManager } from "@/lib/e2ee/backup";
import {
  acquireE2eeEngineLock,
  type E2eeEngineLease,
} from "@/lib/e2ee/engine-lock";
import type {
  E2eeEngine,
  E2eeEngineDeps,
  E2eeEngineExt,
} from "@/lib/e2ee/types";
import type {
  E2eeEngineModules,
  LoadE2eeEngineModules,
} from "./e2eeEngineLoader";
import {
  createE2eeEngineStore,
  type E2eeEngineSnapshot,
  type E2eeEngineStore,
} from "./e2eeEngineStore";
import { getE2eeErrorCode } from "./e2eeErrors";

/** How long a stopping engine may finish in-flight writes before the lock goes. */
const SETTLE_MS = 2_000;

interface E2eeLoadedEngine {
  readonly engine: E2eeEngine;
  readonly store: E2eeEngineStore;
  readonly backup: E2eeBackupManager | null;
}

interface E2eeEngineRunInput {
  readonly profileId: string;
  readonly wallet: string;
  /** "Use here": take the engine from the tab that holds it. */
  readonly takeOver: boolean;
  /** A previous run in this tab that must finish stopping first. */
  readonly after: Promise<void>;
  readonly loadModules: LoadE2eeEngineModules;
  readonly buildDeps: (input: {
    profileId: string;
    wallet: string;
    api: E2eeEngineDeps["api"];
  }) => E2eeEngineDeps;
  readonly onSnapshot: (snapshot: E2eeEngineSnapshot) => void;
  /** The engine is open in another tab (busy, asked to hand over, or stale). */
  readonly onElsewhere: () => void;
  /** The lock was granted after waiting; loading starts. */
  readonly onAcquired: () => void;
  readonly onLoaded: (loaded: E2eeLoadedEngine) => void;
  readonly onFailed: (code: string) => void;
}

export interface E2eeEngineRun {
  /**
   * Stops the engine and releases the lock once in-flight writes settle.
   * Idempotent; callbacks stop firing.
   */
  readonly stop: () => Promise<void>;
  /** Stops and reports "open in another tab" (handing the engine over). */
  readonly yieldToOtherTab: () => Promise<void>;
}

// Duck-typed: an AbortError is a DOMException, not always an Error instance.
const isAbort = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: unknown }).name === "AbortError";

/** Waits for in-flight engine work after dispose, capped so a hung request cannot hold the lock. */
async function settle(engine: E2eeEngine): Promise<void> {
  const idle = (engine as Partial<Pick<E2eeEngineExt, "idle">>).idle;
  if (typeof idle !== "function") {
    return;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    idle.call(engine).catch(() => undefined),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, SETTLE_MS);
    }),
  ]);
  clearTimeout(timer);
}

/**
 * One engine lifetime for one profile in this tab: take the cross-tab engine
 * lock, create the engine, and tear both down together. A tab that cannot
 * get the lock never creates an engine; it reports `onElsewhere` and waits.
 */
export function startE2eeEngineRun(input: E2eeEngineRunInput): E2eeEngineRun {
  const controller = new AbortController();
  let lease: E2eeEngineLease | null = null;
  let creating: Promise<E2eeEngine | null> | null = null;
  let loaded: E2eeLoadedEngine | null = null;
  let stopping: Promise<void> | null = null;

  const live = () => stopping === null;

  const stop = (): Promise<void> => {
    stopping ??= (async () => {
      controller.abort();
      loaded?.backup?.dispose();
      loaded?.store.dispose();
      const engine =
        loaded?.engine ?? (await creating?.catch(() => null)) ?? null;
      if (engine) {
        engine.dispose();
        await settle(engine);
      }
      lease?.release();
    })();
    return stopping;
  };

  const yieldToOtherTab = (): Promise<void> => {
    if (live()) {
      input.onElsewhere();
    }
    return stop();
  };

  let startBackup: E2eeEngineModules["startE2eeBackup"];

  const create = async (): Promise<E2eeEngine | null> => {
    const modules = await input.loadModules();
    if (!live()) {
      return null;
    }
    startBackup = modules.startE2eeBackup;
    return modules.createE2eeEngine({
      ...input.buildDeps({
        profileId: input.profileId,
        wallet: input.wallet,
        api: modules.createE2eeApiClient(),
      }),
      // A refused stale write: another tab owns newer state.
      onStateConflict: () => {
        void yieldToOtherTab();
      },
    });
  };

  const run = async () => {
    try {
      await input.after;
      // Set by onBusy while the lock request is pending.
      let waited = false as boolean;
      lease = await acquireE2eeEngineLock({
        profileId: input.profileId,
        takeOver: input.takeOver,
        signal: controller.signal,
        onBusy: () => {
          waited = true;
          if (live()) {
            input.onElsewhere();
          }
        },
        onLost: () => {
          void yieldToOtherTab();
        },
      });
      if (!live()) {
        lease.release();
        return;
      }
      if (waited) {
        input.onAcquired();
      }
      creating = create();
      const engine = await creating;
      if (!engine || !live()) {
        return;
      }
      const store = createE2eeEngineStore(engine, input.onSnapshot);
      input.onSnapshot(store.getSnapshot());
      const backup = startBackup?.(engine, input.profileId) ?? null;
      loaded = { engine, store, backup };
      input.onLoaded(loaded);
    } catch (error) {
      if (live() && !isAbort(error)) {
        input.onFailed(getE2eeErrorCode(error) ?? "E2EE_LOAD_FAILED");
      }
    }
  };

  void run();
  return { stop, yieldToOtherTab };
}
