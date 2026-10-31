import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { AuthLoadingState } from "./authTypes";
import type { AuthRequestGuard } from "./authRequestGuard";
import type { createAuthRequestSignIn } from "./authRequestSignIn";

interface SignedMessagesGrantRequestParams {
  readonly address: string | undefined;
  /** False for proxy sessions, dev auth or disabled wallet authentication. */
  readonly canAuthenticate: boolean;
  readonly canSignActiveWallet: boolean;
  readonly createSigningAuthRequestGuard: () => AuthRequestGuard;
  readonly isActiveChainSupported: () => boolean;
  readonly requestSignIn: ReturnType<typeof createAuthRequestSignIn>;
  readonly setAuthLoadingState: (state: AuthLoadingState) => void;
  readonly setToast: (toast: AppToastInput) => void;
}

/**
 * "Turn on signed messages": an ordinary web sign-in for the active wallet
 * whose challenge also grants this device's key. One wallet signature.
 */
export const createSignedMessagesGrantRequest =
  ({
    address,
    canAuthenticate,
    canSignActiveWallet,
    createSigningAuthRequestGuard,
    isActiveChainSupported,
    requestSignIn,
    setAuthLoadingState,
    setToast,
  }: SignedMessagesGrantRequestParams) =>
  async (): Promise<{ success: boolean }> => {
    if (!address || !canAuthenticate || !isActiveChainSupported()) {
      return { success: false };
    }
    if (!canSignActiveWallet) {
      setToast({
        message: "Reconnect the wallet for this profile and try again.",
        type: "error",
      });
      return { success: false };
    }

    const authRequestGuard = createSigningAuthRequestGuard();
    setAuthLoadingState("signing");
    try {
      return await requestSignIn({
        signerAddress: address,
        role: null,
        authRequestGuard,
        deviceGrantMode: "required",
      });
    } finally {
      setAuthLoadingState("idle");
    }
  };
