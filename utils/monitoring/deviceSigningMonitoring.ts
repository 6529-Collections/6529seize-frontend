import * as Sentry from "@sentry/nextjs";

/**
 * Why a device-signed write was not signed on its first attempt. "unsupported"
 * is the backend-rollback case (the server does not know the field at all),
 * where the user is asked, as for any other rejection.
 */
export type SignedWriteFallbackReason =
  | "timeout"
  | "lock"
  | "storage-error"
  | "crypto-error"
  | "rejected"
  | "grant-unusable"
  | "unsupported";

/** Where signing was when it failed or timed out. */
export type SigningPhase = "lock" | "storage" | "sign" | "send";

interface SignedWriteFallbackReport {
  /** The drop write kind ("post", "edit", "delete", "react"). */
  readonly action: string;
  readonly reason: SignedWriteFallbackReason;
  readonly phase: SigningPhase;
  /** Time spent signing before the failure, in milliseconds. */
  readonly elapsedMs?: number | undefined;
  /** Time spent waiting for the cross-tab key lock, in milliseconds. */
  readonly lockWaitMs?: number | undefined;
}

const CATEGORY = "device-signing";

const roundMs = (value: number | undefined): number | undefined =>
  value === undefined || !Number.isFinite(value)
    ? undefined
    : Math.max(0, Math.round(value));

/**
 * Records why a write expected to be signed was not. Carries only reason
 * codes and timings: never content, keys, signatures, grant ids or wallet
 * addresses. Monitoring failures never affect the write.
 */
export function reportSignedWriteFallback(
  report: SignedWriteFallbackReport
): void {
  try {
    const elapsedMs = roundMs(report.elapsedMs);
    const lockWaitMs = roundMs(report.lockWaitMs);
    const tags = {
      feature: CATEGORY,
      signing_action: report.action,
      signing_fallback_reason: report.reason,
      signing_phase: report.phase,
    };
    Sentry.addBreadcrumb({
      category: CATEGORY,
      level: "warning",
      message: `Signed write fallback (${report.reason})`,
      data: { ...tags, elapsed_ms: elapsedMs, lock_wait_ms: lockWaitMs },
    });
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setFingerprint([CATEGORY, report.reason, report.phase]);
      // Drop inherited context so the event carries only these codes.
      scope.addEventProcessor((event) => {
        const bounded = {
          ...event,
          tags,
          extra: { elapsed_ms: elapsedMs, lock_wait_ms: lockWaitMs },
        };
        delete bounded.breadcrumbs;
        delete bounded.request;
        delete bounded.user;
        delete bounded.contexts;
        delete bounded.transaction;
        return bounded;
      });
      Sentry.captureMessage(`Signed write fallback (${report.reason})`);
    });
  } catch {
    // Monitoring must not change how the write is sent.
  }
}

/** A breadcrumb for the user's choice after a signing prompt, or a slow signature. */
export function recordDeviceSigningEvent(
  message: string,
  data: Readonly<Record<string, string | number>>
): void {
  try {
    Sentry.addBreadcrumb({ category: CATEGORY, level: "info", message, data });
  } catch {
    // Monitoring must not change how the write is sent.
  }
}

/** Whether this browser's encrypted-messages store emptied with the key store. */
export type EncryptedStoreState =
  | "present"
  | "empty"
  | "not-enrolled"
  | "unknown";

interface DeviceKeyStoreLossReport {
  /** A coarse browser and OS label, such as "Brave on Windows". */
  readonly browser: string;
  /** Whether this site's storage is persistent now. */
  readonly persisted: string;
  /** The last persistence result this browser recorded before the loss. */
  readonly persistedBefore: string;
  /** Bucketed `navigator.storage.estimate()` usage and quota. */
  readonly usage: string;
  readonly quota: string;
  readonly encryptedStore: EncryptedStoreState;
  /** Bucketed age of this browser's grant note at detection. */
  readonly hintAge: string;
}

/**
 * Records that the browser dropped this site's key store while keeping its
 * localStorage (the grant note survived). Carries only the coarse codes
 * above: never content, keys, signatures, grant ids, profile ids or wallet
 * addresses.
 */
export function reportDeviceKeyStoreLoss(
  report: DeviceKeyStoreLossReport
): void {
  try {
    const tags = {
      feature: CATEGORY,
      key_store_browser: report.browser,
      key_store_persisted: report.persisted,
      key_store_persisted_before: report.persistedBefore,
      key_store_encrypted_store: report.encryptedStore,
    };
    const extra = {
      storage_usage: report.usage,
      storage_quota: report.quota,
      grant_note_age: report.hintAge,
    };
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setFingerprint([CATEGORY, "key-store-lost", report.browser]);
      // Drop inherited context so the event carries only these codes.
      scope.addEventProcessor((event) => {
        const bounded = { ...event, tags, extra };
        delete bounded.breadcrumbs;
        delete bounded.request;
        delete bounded.user;
        delete bounded.contexts;
        delete bounded.transaction;
        return bounded;
      });
      Sentry.captureMessage("Device key store lost");
    });
  } catch {
    // Monitoring never changes what the user sees.
  }
}
