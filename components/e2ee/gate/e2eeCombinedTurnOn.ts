import type { LoginE2eeGrantResult } from "@/components/auth/authRequestSignIn";
import type { RequestSignedMessagesGrant } from "@/components/auth/authSignedMessagesGrant";
import { readDeviceKey } from "@/lib/device-signing/device-key-store";
import { isAnyDeviceGrantPossible } from "@/lib/device-signing/login-grant";
import type { E2eeEngine, E2eeEngineStatus } from "@/lib/e2ee/types";
import { revokeDeviceGrant } from "@/services/api/device-grants-api";

/**
 * - done: this device is on, or at the device limit (the gate shows it)
 * - declined: the user cancelled the signature; nothing changed
 * - stopped: the wallet or network changed mid-way; nothing more is asked
 * - pending: the signing grant was saved and encryption is still registering
 *   in the background; it was neither confirmed nor refused in time
 * - partial: the signing grant was saved, but encryption did not complete
 * - fallback: no combined grant was saved; offer separate setup
 */
type CombinedTurnOnOutcome =
  | "done"
  | "declined"
  | "stopped"
  | "pending"
  | "partial"
  | "fallback";

interface CombinedTurnOnInput {
  readonly engine: E2eeEngine;
  /** The signed-in wallet the engine belongs to. */
  readonly address: string | undefined;
  /** "Turn on signed messages", undefined outside the auth provider. */
  readonly requestGrant: RequestSignedMessagesGrant | undefined;
  /**
   * The wallet has signed and the signing grant is stored; only the
   * encryption key's registration remains, with no wallet involved.
   */
  readonly onRegistering?: (() => void) | undefined;
}

const SETTLED_STATUSES: readonly E2eeEngineStatus[] = ["ready", "device-limit"];

/**
 * How long the turn-on waits for a registration that another caller already
 * started. Registration is a few requests (device, then KeyPackages), so this
 * only bounds a slow network; past it the outcome is "pending", not a failure.
 */
const ENROLLMENT_SETTLE_TIMEOUT_MS = 20_000;

/**
 * Resolves with the engine's status once it has left "enrolling", or with
 * "enrolling" when it is still registering after `timeoutMs`.
 */
function waitWhileEnrolling(
  engine: E2eeEngine,
  timeoutMs: number
): Promise<E2eeEngineStatus> {
  return new Promise((resolve) => {
    let unsubscribe: (() => void) | null = null;
    const finish = (status: E2eeEngineStatus) => {
      clearTimeout(timer);
      unsubscribe?.();
      unsubscribe = null;
      resolve(status);
    };
    const timer = setTimeout(() => finish("enrolling"), timeoutMs);
    const current = engine.getStatus();
    if (current !== "enrolling") {
      finish(current);
      return;
    }
    unsubscribe = engine.subscribe(() => {
      const status = engine.getStatus();
      if (status !== "enrolling") finish(status);
    });
  });
}

/**
 * Registers the key the sign-in granted and returns where that left the
 * engine. Adopting the key also wakes the encrypted-messages provider, which
 * starts the same registration; the engine then answers this second call
 * with "enrolling" while the first one is still running. That is not a
 * failure, so wait for the registration already in flight to settle.
 */
async function enrollGrantedDevice(
  engine: E2eeEngine
): Promise<E2eeEngineStatus> {
  const status = await engine.enrollWithLoginGrant();
  return status === "enrolling"
    ? await waitWhileEnrolling(engine, ENROLLMENT_SETTLE_TIMEOUT_MS)
    : status;
}

/** This browser's usable signing grant, which the combined grant replaces. */
async function readReplacedGrantId(address: string): Promise<string | null> {
  try {
    const grant = (await readDeviceKey(address))?.grant ?? null;
    const usable =
      grant !== null &&
      typeof grant.revoked_at !== "number" &&
      grant.expires_at > Date.now();
    return usable ? grant.id : null;
  } catch {
    return null;
  }
}

/**
 * The browser keeps one grant: once the combined grant is the local one,
 * the signing-only grant it replaced is revoked. This does not wait for the
 * encrypted-messages registration: signed messages already use the new
 * grant, so the old one is unused even if registration falls back to the
 * grant prompt. Best effort; if this fails, the old grant stays listed in
 * Devices until it expires.
 */
async function revokeReplacedGrant(
  replacedGrantId: string | null,
  result: LoginE2eeGrantResult
): Promise<void> {
  if (
    replacedGrantId === null ||
    !result.grantSaved ||
    replacedGrantId === result.grantId
  ) {
    return;
  }
  try {
    await revokeDeviceGrant(replacedGrantId);
  } catch {
    // Kept until it expires; the user can still revoke it in Devices.
  }
}

async function needsNewDevice(engine: E2eeEngine): Promise<boolean> {
  try {
    return await engine.needsNewDevice();
  } catch {
    return false;
  }
}

/**
 * Combined setup grants this device's signing key and its
 * encrypted-messages key with one signature, with one expiry and one thing
 * to revoke: a combined sign-in (personal_sign) on the website, an app grant
 * (EIP-712) in 6529 Mobile and Desktop. The engine then registers the key
 * with no second prompt. Proxies, a resumable device, apps with app grants
 * off and any problem before the signature can be handled by separate
 * setup, with fresh approval.
 */
export async function turnOnWithCombinedSignIn({
  engine,
  address,
  requestGrant,
  onRegistering,
}: CombinedTurnOnInput): Promise<CombinedTurnOnOutcome> {
  if (
    !address ||
    !requestGrant ||
    !isAnyDeviceGrantPossible(null) ||
    !(await needsNewDevice(engine))
  ) {
    return "fallback";
  }
  const replacedGrantId = await readReplacedGrantId(address);
  const result = await requestGrant({ silent: true, encryptedMessages: true });
  if (!result.success) {
    if (result.reason === "rejected") {
      return "declined";
    }
    // Any other failure (no MLS key in time, a signing-only
    // or failed challenge, a wallet that could not sign the sign-in message,
    // a failed login) lets the user choose separate setup explicitly.
    return result.reason === "context-changed" ? "stopped" : "fallback";
  }
  const e2ee = result.e2ee;
  if (!e2ee) {
    return "fallback";
  }
  const revoked = revokeReplacedGrant(replacedGrantId, e2ee);
  if (e2ee.adopted && e2ee.grantSaved) onRegistering?.();
  const status = e2ee.adopted ? await enrollGrantedDevice(engine) : null;
  await revoked;
  if (status !== null && SETTLED_STATUSES.includes(status)) return "done";
  if (!e2ee.grantSaved) return "fallback";
  return status === "enrolling" ? "pending" : "partial";
}
