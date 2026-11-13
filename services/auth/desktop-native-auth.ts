import { getDesktopNativeAuth } from "@/helpers/desktop-shell";
import type {
  DesktopNativeAuth,
  DesktopNativeAuthFailure,
  DesktopNativeAuthResult,
} from "@/types/desktop-shell";
import { withSessionRefreshAbort } from "./session-refresh-coordination.utils";

/**
 * Returns one method of the desktop sign-in bridge, or throws when the page is
 * not inside 6529 Desktop or the shell does not provide that method.
 */
export function requireDesktopNativeAuthMethod<
  K extends keyof DesktopNativeAuth,
>(method: K): DesktopNativeAuth[K] {
  const nativeAuth = getDesktopNativeAuth();
  const bridgeMethod = nativeAuth?.[method];
  if (typeof bridgeMethod !== "function") {
    throw new Error(`Desktop sign-in bridge method ${method} is unavailable`);
  }
  // Keep the bridge object as the receiver; the shell may rely on it.
  return bridgeMethod.bind(nativeAuth) as DesktopNativeAuth[K];
}

/**
 * The shell returns API failures as plain data, because errors lose their
 * fields when they cross the bridge. Rebuild a status-aware error here so the
 * existing refresh error handling (401, 429 and Retry-After) still applies.
 */
function isDesktopNativeAuthFailure(
  result: unknown
): result is DesktopNativeAuthFailure {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as { readonly kind?: unknown }).kind === "native-auth-api-error"
  );
}

export function unwrapDesktopNativeAuthResult<T extends object>(
  result: DesktopNativeAuthResult<T>
): T {
  if (isDesktopNativeAuthFailure(result)) {
    throw Object.assign(new Error(result.message), {
      status: result.status,
      headers: new Headers(
        result.retryAfter ? { "Retry-After": result.retryAfter } : {}
      ),
    });
  }
  return result;
}

/** Runs a bridge request and stops waiting for it when the caller aborts. */
export async function runDesktopNativeAuthRequest<T>({
  signal,
  request,
}: {
  readonly signal?: AbortSignal | undefined;
  readonly request: () => Promise<T>;
}): Promise<T> {
  if (!signal) {
    return await request();
  }
  return await withSessionRefreshAbort({ abortSignal: signal, task: request });
}
