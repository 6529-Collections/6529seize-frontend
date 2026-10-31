/**
 * One encrypted-messages engine per profile across the browser's tabs.
 *
 * Every tab that runs an engine holds an exclusive Web Lock named
 * `6529-e2ee-engine:<profileId>` for the engine's lifetime. A tab that cannot
 * get it starts no engine and waits; "Use here" asks the holder over a
 * BroadcastChannel to stop and release, then takes the lock. Two engines on
 * one profile would race on the same MLS state (reused ratchet generations,
 * groups invalidated by each other's commits, older state written over
 * newer), so this is a hard rule, backed by the storage compare-and-swap.
 */

const NAME_PREFIX = "6529-e2ee-engine:";
const HANDOVER_TIMEOUT_MS = 3_000;

type ChannelMessage =
  | { readonly type: "release-request" }
  | { readonly type: "released" };

export interface E2eeEngineLease {
  /** True when this browser has no Web Locks and the lease is advisory. */
  readonly unguarded: boolean;
  /** Gives the lock back and stops listening (idempotent). */
  readonly release: () => void;
}

export interface AcquireE2eeEngineLockInput {
  readonly profileId: string;
  /** "Use here": ask the holder to stop, then take the lock. */
  readonly takeOver: boolean;
  /** Aborts a pending acquisition (the provider unmounted or moved on). */
  readonly signal: AbortSignal;
  /** The lock is held by another tab; acquisition keeps waiting for it. */
  readonly onBusy: () => void;
  /**
   * Another tab asked for the engine or took the lock: stop the engine, then
   * release the lease.
   */
  readonly onLost: () => void;
  /** Test seams; default to the browser's. */
  readonly locks?: LockManager | null | undefined;
  readonly createChannel?:
    | ((name: string) => BroadcastChannel | null)
    | undefined;
  readonly handoverTimeoutMs?: number | undefined;
}

export const getE2eeEngineLockName = (profileId: string): string =>
  `${NAME_PREFIX}${profileId}`;

function defaultLocks(): LockManager | null {
  const nav = globalThis.navigator as Navigator | undefined;
  return nav?.locks ?? null;
}

function defaultChannel(name: string): BroadcastChannel | null {
  if (typeof globalThis.BroadcastChannel !== "function") {
    return null;
  }
  try {
    return new BroadcastChannel(name);
  } catch {
    return null;
  }
}

const abortError = (): Error =>
  new DOMException("The operation was aborted.", "AbortError");

// Duck-typed: an AbortError is a DOMException, not always an Error instance.
const isAbort = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: unknown }).name === "AbortError";

let warnedUnguarded = false;

function unguardedLease(): E2eeEngineLease {
  if (!warnedUnguarded) {
    warnedUnguarded = true;
    console.warn(
      "[e2ee] Web Locks are unavailable; encrypted messages cannot be limited to one tab."
    );
  }
  return { unguarded: true, release: () => undefined };
}

interface HeldLock {
  readonly release: () => void;
}

/**
 * Requests the lock. Resolves with a holder once granted, or null when
 * `ifAvailable` found it taken. `onStolen` runs if another tab steals it.
 */
function requestLock(
  locks: LockManager,
  name: string,
  options: LockOptions,
  onStolen: () => void
): Promise<HeldLock | null> {
  return new Promise<HeldLock | null>((resolve, reject) => {
    let granted = false;
    let releaseHold: () => void = () => undefined;
    const hold = new Promise<void>((done) => {
      releaseHold = done;
    });
    locks
      .request(name, options, (lock) => {
        if (!lock) {
          resolve(null);
          return undefined;
        }
        granted = true;
        resolve({ release: releaseHold });
        return hold;
      })
      .catch((error: unknown) => {
        if (granted) {
          // A steal rejects the holder's request with AbortError.
          onStolen();
          return;
        }
        reject(error as Error);
      });
  });
}

/** Resolves on the holder's "released" message or after the timeout. */
function waitForRelease(
  channel: BroadcastChannel | null,
  timeoutMs: number,
  signal: AbortSignal
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      clearTimeout(timer);
      channel?.removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
    };
    const onMessage = (event: MessageEvent<ChannelMessage>) => {
      if (event.data?.type === "released") {
        finish();
        resolve();
      }
    };
    const onAbort = () => {
      finish();
      reject(abortError());
    };
    const timer = setTimeout(() => {
      finish();
      resolve();
    }, timeoutMs);
    channel?.addEventListener("message", onMessage);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function takeLock(
  locks: LockManager,
  name: string,
  input: AcquireE2eeEngineLockInput,
  channel: BroadcastChannel | null,
  onStolen: () => void
): Promise<HeldLock> {
  const free = await requestLock(locks, name, { ifAvailable: true }, onStolen);
  if (free) {
    return free;
  }
  if (input.takeOver) {
    channel?.postMessage({ type: "release-request" } satisfies ChannelMessage);
    await waitForRelease(
      channel,
      input.handoverTimeoutMs ?? HANDOVER_TIMEOUT_MS,
      input.signal
    );
    // Steal: whoever pressed "Use here" wins, even over waiting tabs. A
    // holder that never answered loses the lock and stops when it notices.
    const stolen = await requestLock(locks, name, { steal: true }, onStolen);
    if (!stolen) {
      throw abortError();
    }
    return stolen;
  }
  input.onBusy();
  const waited = await requestLock(
    locks,
    name,
    { signal: input.signal },
    onStolen
  );
  if (!waited) {
    throw abortError();
  }
  return waited;
}

/**
 * Takes the engine lock for a profile. Resolves once this tab may run the
 * engine; rejects with AbortError when `signal` aborts first. Without Web
 * Locks it resolves at once with an advisory lease and a console warning.
 */
export async function acquireE2eeEngineLock(
  input: AcquireE2eeEngineLockInput
): Promise<E2eeEngineLease> {
  const locks = input.locks === undefined ? defaultLocks() : input.locks;
  if (!locks) {
    return unguardedLease();
  }
  if (input.signal.aborted) {
    throw abortError();
  }
  const name = getE2eeEngineLockName(input.profileId);
  const channel = (input.createChannel ?? defaultChannel)(name);
  let lost = false;
  const loseOnce = () => {
    if (!lost) {
      lost = true;
      input.onLost();
    }
  };

  let held: HeldLock;
  try {
    held = await takeLock(locks, name, input, channel, loseOnce);
  } catch (error) {
    channel?.close();
    if (isAbort(error)) {
      throw error;
    }
    // Locks exist but refuse requests here (e.g. an opaque origin).
    return unguardedLease();
  }

  const onMessage = (event: MessageEvent<ChannelMessage>) => {
    if (event.data?.type === "release-request") {
      loseOnce();
    }
  };
  channel?.addEventListener("message", onMessage);

  let released = false;
  const release = () => {
    if (released) {
      return;
    }
    released = true;
    held.release();
    if (channel) {
      channel.removeEventListener("message", onMessage);
      channel.postMessage({ type: "released" } satisfies ChannelMessage);
      channel.close();
    }
  };

  if (input.signal.aborted) {
    release();
    throw abortError();
  }
  return { unguarded: false, release };
}
