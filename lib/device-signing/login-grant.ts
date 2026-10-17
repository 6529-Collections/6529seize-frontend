import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { getSessionClientType } from "@/services/auth/session-v2.utils";
import type { SessionNonceDeviceGrantParams } from "@/services/auth/session-v2.types";
import {
  ensureDeviceKey,
  getDeviceGrantStatus,
  readDeviceKey,
  saveDeviceGrant,
} from "./device-key-store";
import { getDeviceLabel } from "./device-label";
import { isEd25519Supported } from "./ed25519";
import { isSignedMessagesEnabled } from "./feature";
import {
  DEFAULT_DEVICE_SCOPES,
  isExpectedDeviceGrantMessage,
} from "./grant-message";
import { withinTimeBudget } from "./time-budget";

/**
 * "auto": an ordinary sign-in also grants this device when it has no grant
 * outside the renewal window. "required": sign in only to grant this device.
 */
export type DeviceGrantMode = "auto" | "required";

export interface LoginDeviceGrant {
  readonly address: string;
  readonly deviceKeyHex: string;
  readonly scopes: readonly string[];
  readonly label: string;
}

const PREPARE_BUDGET_MS = 1500;
const DEVICE_GRANT_URN_MARKER = "urn:6529:device-grant:";

/** Synchronous gate: flag on, web client and the wallet's own (non-proxy) session. */
export const isDeviceGrantPossible = (role: string | null): boolean =>
  role === null &&
  isSignedMessagesEnabled() &&
  getSessionClientType() === "web";

/** Whether this browser session can hold a device key at all. */
export async function canUseDeviceSigning(): Promise<boolean> {
  return isDeviceGrantPossible(null) && (await isEd25519Supported());
}

async function prepare(
  signerAddress: string,
  mode: DeviceGrantMode
): Promise<LoginDeviceGrant | null> {
  if (!(await isEd25519Supported())) {
    return null;
  }
  if (mode === "auto") {
    const existing = await readDeviceKey(signerAddress);
    const status = getDeviceGrantStatus(existing?.grant ?? null, Date.now());
    if (status === "active") {
      return null;
    }
  }
  const record = await ensureDeviceKey(signerAddress);
  return {
    address: record.address,
    deviceKeyHex: record.publicKeyHex,
    scopes: DEFAULT_DEVICE_SCOPES,
    label: getDeviceLabel(),
  };
}

/** Never throws: any device-key problem means an ordinary sign-in. */
export async function prepareLoginDeviceGrant({
  signerAddress,
  mode,
}: {
  readonly signerAddress: string;
  readonly mode: DeviceGrantMode;
}): Promise<LoginDeviceGrant | null> {
  try {
    return await withinTimeBudget(
      prepare(signerAddress, mode),
      PREPARE_BUDGET_MS
    );
  } catch {
    return null;
  }
}

export const toDeviceGrantNonceParams = (
  grant: LoginDeviceGrant
): SessionNonceDeviceGrantParams => ({
  device_key: grant.deviceKeyHex,
  device_key_type: "ed25519",
  device_scopes: grant.scopes.join(","),
});

/** Whether a sign-in challenge carries any device grant at all. */
export const carriesDeviceGrant = (message: string): boolean =>
  message.includes(DEVICE_GRANT_URN_MARKER);

/** The wallet is asked to sign only a challenge that grants exactly this key. */
export const isDeviceGrantChallenge = (
  message: string,
  grant: LoginDeviceGrant
): boolean =>
  isExpectedDeviceGrantMessage({
    message,
    signerAddress: grant.address,
    deviceKeyHex: grant.deviceKeyHex,
    scopes: grant.scopes,
    nowMs: Date.now(),
  });

/** Stores the grant returned by session-login. Never throws. */
export async function storeLoginDeviceGrant(
  grant: LoginDeviceGrant,
  deviceGrant: ApiDeviceGrant | undefined,
  /** The session role of this sign-in, which requested no proxy role. */
  ownProfileId: string | null = null
): Promise<boolean> {
  if (!deviceGrant) {
    return false;
  }
  try {
    return await saveDeviceGrant(grant.address, deviceGrant, ownProfileId);
  } catch {
    return false;
  }
}
