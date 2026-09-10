const WEB_SESSION_REFRESH_LOCK_PREFIX = "6529:auth-session-refresh:";
const SESSION_REFRESH_TIMEOUT_MS = 30_000;

export type AuthSessionClientType = "web" | "native" | "desktop";

export type SessionRefreshEntry<T> = {
  readonly controller: AbortController;
  readonly promise: Promise<T>;
  activeConsumers: number;
};

type NavigatorWithOptionalLocks = {
  readonly locks?: LockManager | undefined;
};

export function getSessionRefreshKey({
  address,
  clientType,
}: {
  readonly address: string;
  readonly clientType: AuthSessionClientType;
}): string {
  return `${clientType}:${address.trim().toLowerCase()}`;
}

export function createAbortError(): DOMException {
  return new DOMException("Session refresh aborted", "AbortError");
}

export const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "AbortError";

export async function withSessionRefreshAbort<T>({
  abortSignal,
  task,
}: {
  readonly abortSignal: AbortSignal;
  readonly task: () => Promise<T>;
}): Promise<T> {
  if (abortSignal.aborted) {
    throw createAbortError();
  }

  let rejectOnAbort: ((error: DOMException) => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectOnAbort = reject;
  });
  const onAbort = () => rejectOnAbort?.(createAbortError());
  abortSignal.addEventListener("abort", onAbort, { once: true });

  try {
    // Release callers and held Web Locks even if the transport ignores abort.
    return await Promise.race([task(), aborted]);
  } finally {
    abortSignal.removeEventListener("abort", onAbort);
  }
}

export function createSessionRefreshEntry<T>(
  task: (abortSignal: AbortSignal) => Promise<T>
): SessionRefreshEntry<T> {
  // Background consumers must not keep every later action on a stalled request.
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      const error = new Error("Session refresh timed out. Please try again.");
      error.name = "TimeoutError";
      // Reject first so cancellation cannot replace the timeout's retry semantics.
      reject(error);
      controller.abort();
    }, SESSION_REFRESH_TIMEOUT_MS);
  });
  const request = withSessionRefreshAbort({
    abortSignal: controller.signal,
    task: () => task(controller.signal),
  });

  return {
    controller,
    activeConsumers: 1,
    promise: Promise.race([request, timeout]).finally(() => {
      globalThis.clearTimeout(timeoutId);
    }),
  };
}

export async function waitForSessionRefreshRetryCooldown({
  cooldown,
  abortSignal,
}: {
  readonly cooldown: { readonly expiresAtMs: number };
  readonly abortSignal?: AbortSignal | undefined;
}): Promise<void> {
  const delayMs = Math.max(0, cooldown.expiresAtMs - Date.now());
  if (delayMs === 0) {
    return;
  }
  if (abortSignal?.aborted) {
    throw createAbortError();
  }

  await new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const cleanup = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      abortSignal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);
    abortSignal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function withCrossTabWebSessionRefreshLock<T>({
  refreshKey,
  abortSignal,
  task,
}: {
  readonly refreshKey: string;
  readonly abortSignal?: AbortSignal | undefined;
  readonly task: () => Promise<T>;
}): Promise<T> {
  const runtimeNavigator = Reflect.get(globalThis, "navigator") as
    | NavigatorWithOptionalLocks
    | undefined;
  const lockManager = runtimeNavigator?.locks;
  if (!lockManager) {
    return await task();
  }

  const options: LockOptions = abortSignal
    ? { mode: "exclusive", signal: abortSignal }
    : { mode: "exclusive" };
  const executionState = { didStartTask: false };

  try {
    return await lockManager.request(
      `${WEB_SESSION_REFRESH_LOCK_PREFIX}${refreshKey}`,
      options,
      async () => {
        executionState.didStartTask = true;
        return await task();
      }
    );
  } catch (error: unknown) {
    if (executionState.didStartTask || isAbortError(error)) {
      throw error;
    }
    return await task();
  }
}
