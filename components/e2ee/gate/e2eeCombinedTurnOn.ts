import type { LoginE2eeGrantResult } from "@/components/auth/authRequestSignIn";
import type { RequestSignedMessagesGrant } from "@/components/auth/authSignedMessagesGrant";
import { readDeviceKey } from "@/lib/device-signing/device-key-store";
import { isDeviceGrantPossible } from "@/lib/device-signing/login-grant";
import type { E2eeEngine, E2eeEngineStatus } from "@/lib/e2ee/types";
import { revokeDeviceGrant } from "@/services/api/device-grants-api";

/**
 * - done: this device is on, or at the device limit (the gate shows it)
 * - declined: the user cancelled the signature; nothing changed
 * - stopped: the wallet or network changed mid-way; nothing more is asked
 * - fallback: no combined grant was possible; use the separate grant prompt
 */
type CombinedTurnOnOutcome = "done" | "declined" | "stopped" | "fallback";

interface CombinedTurnOnInput {
  readonly engine: E2eeEngine;
  /** The signed-in wallet the engine belongs to. */
  readonly address: string | undefined;
  /** "Turn on signed messages", undefined outside the auth provider. */
  readonly requestGrant: RequestSignedMessagesGrant | undefined;
}

const SETTLED_STATUSES: readonly E2eeEngineStatus[] = ["ready", "device-limit"];

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
 * NC8 on the website: "Turn on encrypted messages" signs in once more with
 * the combined grant, so one personal_sign grants this browser's signing
 * key and its encrypted-messages key, with one expiry and one thing to
 * revoke. The engine then registers the key with no second prompt. The
 * apps, proxies, a resumable device and any problem before the signature
 * keep the separate EIP-712 grant prompt ("fallback").
 */
export async function turnOnWithCombinedSignIn({
  engine,
  address,
  requestGrant,
}: CombinedTurnOnInput): Promise<CombinedTurnOnOutcome> {
  if (
    !address ||
    !requestGrant ||
    !isDeviceGrantPossible(null) ||
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
    // a failed login) still turns encrypted messages on, through their own
    // EIP-712 prompt; its errors and a decline show on the card as before.
    return result.reason === "context-changed" ? "stopped" : "fallback";
  }
  const e2ee = result.e2ee;
  if (!e2ee) {
    return "fallback";
  }
  const revoked = revokeReplacedGrant(replacedGrantId, e2ee);
  const status = e2ee.adopted ? await engine.enrollWithLoginGrant() : null;
  await revoked;
  return status !== null && SETTLED_STATUSES.includes(status)
    ? "done"
    : "fallback";
}
