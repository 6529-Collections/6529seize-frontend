import { hashMessage } from "viem";
import { setE2eeEnrollmentMarker } from "@/components/e2ee/e2eeLocalState";
import {
  parseDeviceGrantMessage,
  parseSiweIssuedAtSeconds,
} from "@/lib/device-signing/grant-message";
import type { LoginE2eeDevice } from "@/lib/device-signing/login-e2ee";

interface AdoptLoginE2eeDeviceParams {
  readonly e2eeDevice: LoginE2eeDevice;
  /** The combined sign-in message the wallet signed. */
  readonly message: string;
  readonly walletSignature: string;
  /** device_grant.id from session-login: the grant the server stored. */
  readonly storedGrantId: string;
  /** The session role of this sign-in, which requested no proxy role. */
  readonly ownProfileId: string | null;
  readonly signerAddress: string;
}

/**
 * The encrypted-messages provider re-reads its marker on any "storage" event
 * (same-tab writes fire none). A plain Event carries no key, so listeners
 * that filter by key, or treat a null key as "storage cleared", ignore it.
 */
const announceEnrollmentMarker = (): void => {
  try {
    globalThis.dispatchEvent(new Event("storage"));
  } catch {
    // Markers are optional; the provider re-reads them on its next render.
  }
};

/**
 * NC8: after a combined sign-in stored its grant, hands the MLS key to the
 * encrypted-messages engine, which then registers it with that grant and no
 * second wallet prompt. Best effort and never throws: on any mismatch the key
 * is dropped and encrypted messages keep their own grant prompt.
 */
export async function adoptLoginE2eeDevice({
  e2eeDevice,
  message,
  walletSignature,
  storedGrantId,
  ownProfileId,
  signerAddress,
}: AdoptLoginE2eeDeviceParams): Promise<boolean> {
  try {
    const parsed = parseDeviceGrantMessage(message);
    const issuedAtSeconds = parseSiweIssuedAtSeconds(message);
    const grantId = hashMessage(message);
    if (
      ownProfileId === null ||
      grantId !== storedGrantId.toLowerCase() ||
      parsed?.mls?.deviceKeyHex !== e2eeDevice.deviceKeyHex ||
      issuedAtSeconds === null
    ) {
      e2eeDevice.dispose();
      return false;
    }
    const adopted = await e2eeDevice.adopt({
      profileId: ownProfileId,
      wallet: signerAddress,
      grantId,
      walletSignature,
      origin: parsed.domain,
      issuedAtSeconds,
      expiresAtSeconds: parsed.mls.expiresAtSeconds,
    });
    if (adopted) {
      setE2eeEnrollmentMarker(ownProfileId, true);
      announceEnrollmentMarker();
    }
    return adopted;
  } catch {
    e2eeDevice.dispose();
    return false;
  }
}
