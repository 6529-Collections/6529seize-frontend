const WEB_SESSION_REFRESH_LOCK_PREFIX = "6529:auth-session-refresh:";

export type AuthSessionClientType = "web" | "native" | "desktop";

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

export async function withCrossTabWebSessionRefreshLock<T>({
  refreshKey,
  abortSignal,
  task,
}: {
  readonly refreshKey: string;
  readonly abortSignal?: AbortSignal | undefined;
  readonly task: () => Promise<T>;
}): Promise<T> {
  const runtimeNavigator = Reflect.get(
    globalThis,
    "navigator"
  ) as NavigatorWithOptionalLocks | undefined;
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
