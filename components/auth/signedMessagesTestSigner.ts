import { getE2eeTestSigner } from "@/components/e2ee/e2eeTestSigner";
import { getLocalTestSeamFunction } from "@/services/auth/devAuthTestOverride";

type SignedMessagesTestSigner = (message: string) => Promise<string>;

/** Name of the page global a local browser test may install. */
export const SIGNED_MESSAGES_TEST_SIGNER_GLOBAL =
  "__signedMessagesTestSignMessage";

/**
 * Local browser-test seam for the one wallet signature (personal_sign) of
 * "Turn on signed messages", including the combined sign-in that also turns
 * on encrypted DMs. Dev-auth sessions have no connected wallet, so the local
 * E2EE sandbox installs a per-browser signer backed by a throwaway test key;
 * with it, the grant sign-in treats that signer as the live wallet on a
 * supported network. Same gate as the E2EE test signer (USE_DEV_AUTH, a
 * development-like build, localhost); everywhere else this returns null and
 * the real wallet signs.
 */
export function getSignedMessagesTestSigner(): SignedMessagesTestSigner | null {
  // Compiled out of production bundles, global name included.
  // eslint-disable-next-line no-restricted-syntax -- inlined by the bundler
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  const signer = getLocalTestSeamFunction(SIGNED_MESSAGES_TEST_SIGNER_GLOBAL);
  if (!signer) {
    return null;
  }
  return async (message) => {
    const signature = await signer(message);
    if (typeof signature !== "string") {
      throw new TypeError("Signed messages test signer returned no signature");
    }
    return signature;
  };
}

/**
 * Whether a local test signer (this one, or the E2EE typed-data signer)
 * stands in for the wallet, so the one-click setup flow treats it as a live
 * wallet on a supported network. False wherever the seam is off.
 */
export const hasLocalTestSigner = (): boolean =>
  getSignedMessagesTestSigner() !== null || getE2eeTestSigner() !== null;
