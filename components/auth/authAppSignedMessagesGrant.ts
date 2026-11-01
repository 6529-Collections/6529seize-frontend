import {
  detectE2eePlatform,
  getE2eeGrantOrigin,
} from "@/components/e2ee/e2eePlatform";
import { getE2eeDeviceLabel } from "@/components/e2ee/e2eeDeviceLabel";
import { setE2eeEnrollmentMarker } from "@/components/e2ee/e2eeLocalState";
import { isWalletConnectSessionError } from "@/helpers/wallet-error.helpers";
import {
  type AppGrantFailure,
  type AppGrantSignature,
  type AppGrantTypedData,
  requestAppDeviceGrant,
} from "@/lib/device-signing/app-grant-request";
import { prepareLoginE2eeDevice } from "@/lib/device-signing/login-e2ee";
import { registerAppDeviceGrant } from "@/services/api/device-grants-api";
import type {
  SignedMessagesGrantFailure,
  SignedMessagesGrantResult,
} from "./authSignedMessagesGrant";

/** The wallet's EIP-712 signature for an app grant. */
export type SignAppGrant = (
  typedData: AppGrantTypedData
) => Promise<AppGrantSignature>;

interface AppSignedMessagesGrantParams {
  readonly address: string;
  /** The wallet's own profile (a grant never acts through a proxy). */
  readonly ownProfileId: string | null;
  readonly signAppGrant: SignAppGrant;
  readonly onSignatureRequested?: (() => void) | undefined;
}

const toFailure = (
  reason: AppGrantFailure,
  error: unknown
): SignedMessagesGrantFailure => {
  switch (reason) {
    case "device-key":
      return "device-key";
    case "rejected":
      return "rejected";
    case "register-failed":
      return "sign-in-failed";
    case "signature-failed":
      return isWalletConnectSessionError(error)
        ? "walletconnect-session"
        : "signature-failed";
  }
};

/**
 * The encrypted-messages provider re-reads its marker on any "storage" event
 * (same-tab writes fire none), so it loads the engine that registers the key.
 */
const announceEnrollmentMarker = (profileId: string): void => {
  setE2eeEnrollmentMarker(profileId, true);
  try {
    globalThis.dispatchEvent(new Event("storage"));
  } catch {
    // Markers are optional; the provider re-reads them on its next render.
  }
};

/**
 * "Turn on signed messages" in 6529 Mobile and Desktop: one EIP-712 app
 * grant for this device's signing key and, for a wallet with a profile while
 * encrypted messages are on, its encrypted-messages key too.
 */
export async function requestAppSignedMessagesGrant({
  address,
  ownProfileId,
  signAppGrant,
  onSignatureRequested,
}: AppSignedMessagesGrantParams): Promise<SignedMessagesGrantResult> {
  const platform = detectE2eePlatform() === "desktop" ? "desktop" : "phone";
  const e2eeDevice = ownProfileId ? await prepareLoginE2eeDevice() : null;
  let signatureError: unknown = null;
  const result = await requestAppDeviceGrant({
    address,
    ownProfileId,
    origin: getE2eeGrantOrigin(platform),
    platform,
    deviceLabel: getE2eeDeviceLabel(platform),
    e2eeDevice,
    onSignatureRequested,
    registerGrant: registerAppDeviceGrant,
    signTypedData: async (typedData) => {
      const signed = await signAppGrant(typedData);
      if ("error" in signed) {
        signatureError = signed.error;
      }
      return signed;
    },
  });
  if (!result.success) {
    return {
      success: false,
      reason: toFailure(result.reason, signatureError),
    };
  }
  if (result.e2eeAdopted && ownProfileId) {
    announceEnrollmentMarker(ownProfileId);
  }
  return { success: true };
}
