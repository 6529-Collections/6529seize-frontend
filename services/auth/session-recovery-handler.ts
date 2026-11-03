export interface SessionRecoveryOptions {
  readonly signal?: AbortSignal | undefined;
  readonly force?: boolean;
  readonly renewBeforeSeconds?: number;
}

type SessionRecoveryHandler = (
  options?: SessionRecoveryOptions
) => Promise<string | null>;
let recoveryHandler: SessionRecoveryHandler | undefined;

// The auth client boundary installs recovery before any component effects run.
// Transport depends on this interface, not the auth implementation that uses it.
export function installSessionRecoveryHandler(
  handler: SessionRecoveryHandler
): void {
  recoveryHandler = handler;
}

export function recoverActiveSession(
  options: SessionRecoveryOptions
): Promise<string | null> {
  if (!recoveryHandler) {
    return Promise.reject(
      new Error("Session recovery is not ready. Please try again.")
    );
  }
  return recoveryHandler(options);
}
