import { getDesktopNativeAuth } from "@/helpers/desktop-shell";
import type {
  DesktopNativeAuth,
  DesktopNativeAuthFailure,
  DesktopNativeAuthSessionResponse,
  DesktopNativeConnectionShareResponse,
  DesktopNativeLegacyConnectionShareResponse,
  DesktopSessionClientType,
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
    throw new TypeError(
      `Desktop sign-in bridge method ${method} is unavailable`
    );
  }
  // Keep the bridge object as the receiver; the shell may rely on it.
  return bridgeMethod.bind(nativeAuth) as DesktopNativeAuth[K];
}

function isDesktopNativeAuthFailure(
  result: unknown
): result is DesktopNativeAuthFailure {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as { readonly kind?: unknown }).kind === "native-auth-api-error"
  );
}

/**
 * Only `sessionRefresh` reports API failures as data (errors lose their
 * fields when they cross the bridge); the other methods reject. Every result
 * still goes through this check, so a failure-shaped payload can never pass
 * as success. The rebuilt error keeps `status` and `Retry-After`, so the
 * existing 401 and 429 handling applies.
 */
function throwIfDesktopNativeAuthFailure(
  result: unknown
): Record<string, unknown> {
  if (isDesktopNativeAuthFailure(result)) {
    throw Object.assign(new Error(result.message), {
      status: result.status,
      headers: new Headers(
        result.retryAfter ? { "Retry-After": result.retryAfter } : {}
      ),
    });
  }
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    throw new TypeError("Invalid desktop sign-in bridge response");
  }
  return result as Record<string, unknown>;
}

const isString = (value: unknown): value is string => typeof value === "string";

const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.length > 0;

const isRole = (value: unknown): value is string | null =>
  value === null || isString(value);

const isClientType = (value: unknown): value is DesktopSessionClientType =>
  value === "desktop" || value === "native";

function invalidResponse(method: keyof DesktopNativeAuth): TypeError {
  return new TypeError(`Invalid desktop ${method} response`);
}

/**
 * A desktop session: the access token for the page, never a refresh token.
 */
export function parseDesktopSessionResponse(
  method: "sessionLogin" | "sessionRefresh" | "redeemConnectionShare",
  result: unknown
): DesktopNativeAuthSessionResponse {
  const value = throwIfDesktopNativeAuthFailure(result);
  const setup = value["encrypted_device_setup"];
  if (
    !isClientType(value["client_type"]) ||
    !isNonEmptyString(value["address"]) ||
    !isRole(value["role"]) ||
    !isNonEmptyString(value["access_token"]) ||
    !isString(value["access_token_expires_at"]) ||
    !isString(value["refresh_token_expires_at"]) ||
    !(setup === undefined || setup === null || isString(setup))
  ) {
    throw invalidResponse(method);
  }
  // The shell keeps refresh tokens; one reaching the page is a contract break.
  if (value["native_refresh_token"] !== "") {
    throw invalidResponse(method);
  }
  return {
    client_type: value["client_type"],
    address: value["address"],
    role: value["role"],
    access_token: value["access_token"],
    access_token_expires_at: value["access_token_expires_at"],
    native_refresh_token: "",
    refresh_token_expires_at: value["refresh_token_expires_at"],
    ...(setup === undefined ? {} : { encrypted_device_setup: setup }),
  };
}

export function parseDesktopConnectionShareResponse(
  result: unknown
): DesktopNativeConnectionShareResponse {
  const value = throwIfDesktopNativeAuthFailure(result);
  if (
    !isNonEmptyString(value["connection_share_code"]) ||
    !isString(value["expires_at"]) ||
    !isNonEmptyString(value["address"]) ||
    !isRole(value["role"]) ||
    !isClientType(value["target_client_type"]) ||
    !isNonEmptyString(value["deep_link_path"])
  ) {
    throw invalidResponse("createConnectionShare");
  }
  return {
    connection_share_code: value["connection_share_code"],
    expires_at: value["expires_at"],
    address: value["address"],
    role: value["role"],
    target_client_type: value["target_client_type"],
    deep_link_path: value["deep_link_path"],
  };
}

/**
 * The legacy share hands a session to the older desktop app, so its
 * `refresh_token` is the credential being shared, as on the web.
 */
export function parseDesktopLegacyConnectionShareResponse(
  result: unknown
): DesktopNativeLegacyConnectionShareResponse {
  const value = throwIfDesktopNativeAuthFailure(result);
  if (
    !isNonEmptyString(value["refresh_token"]) ||
    !isNonEmptyString(value["address"]) ||
    !isRole(value["role"]) ||
    !isNonEmptyString(value["deep_link_path"])
  ) {
    throw invalidResponse("createLegacyDesktopConnectionShare");
  }
  return {
    refresh_token: value["refresh_token"],
    address: value["address"],
    role: value["role"],
    deep_link_path: value["deep_link_path"],
  };
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
