import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { isWalletConnectSessionError } from "@/helpers/wallet-error.helpers";
import { t } from "@/i18n/messages";
import type { AuthLoadingState } from "./authTypes";
import type { AuthRequestGuard } from "./authRequestGuard";
import {
  createAuthRequestSignIn,
  type LoginE2eeGrantResult,
} from "./authRequestSignIn";
import { AUTH_MODAL_LOCALE } from "./authSessionUpgrade";

type SignInDependencies = Parameters<typeof createAuthRequestSignIn>[0];
type GetNonce = SignInDependencies["getNonce"];
type GetSignature = SignInDependencies["getSignature"];
type SignatureResult = Awaited<ReturnType<GetSignature>> & {
  /** The wallet's error, when it returned one. */
  readonly error?: unknown;
};
type GetSignatureWithError = (
  params: Parameters<GetSignature>[0]
) => Promise<SignatureResult>;
type ShowToast = (toast: AppToastInput) => void;

/** Why "Turn on signed messages" did not finish. Reason codes only. */
export type SignedMessagesGrantFailure =
  /** No wallet session that may authenticate here (proxy, dev auth). */
  | "unavailable"
  /** No live connection to the active wallet. */
  | "wallet-disconnected"
  | "wrong-network"
  /** This browser could not prepare its device key in time. */
  | "device-key"
  /** The sign-in challenge request failed. */
  | "challenge-failed"
  /** The challenge did not grant exactly this browser's key. */
  | "challenge-mismatch"
  | "rejected"
  /** The wallet returned no signature without the user declining. */
  | "signature-failed"
  /** The WalletConnect session or relay could not reach the wallet app. */
  | "walletconnect-session"
  /** The wallet signed but the sign-in did not complete. */
  | "sign-in-failed"
  /** The network changed while the sign-in was in flight. */
  | "context-changed";

export type SignedMessagesGrantResult =
  | {
      readonly success: true;
      /** Set when `encryptedMessages` was asked for. */
      readonly e2ee?: LoginE2eeGrantResult | undefined;
    }
  | { readonly success: false; readonly reason: SignedMessagesGrantFailure };

export interface SignedMessagesGrantOptions {
  /** Called once the wallet has been asked for the signature. */
  readonly onSignatureRequested?: (() => void) | undefined;
  /** The caller reports failures itself, so nothing is shown as a toast. */
  readonly silent?: boolean | undefined;
  /**
   * "Turn on encrypted messages" (NC8): the one signature must also grant
   * this browser's encrypted-messages key. Without a challenge that does,
   * nothing is signed and the result is a failure.
   */
  readonly encryptedMessages?: boolean | undefined;
}

export type RequestSignedMessagesGrant = (
  options?: SignedMessagesGrantOptions
) => Promise<SignedMessagesGrantResult>;

interface SignedMessagesGrantRequestParams {
  readonly address: string | undefined;
  /** False for proxy sessions, dev auth or disabled wallet authentication. */
  readonly canAuthenticate: boolean;
  readonly canSignActiveWallet: boolean;
  readonly createSigningAuthRequestGuard: () => AuthRequestGuard;
  /** The wallet signature step, reporting failures through `showToast`. */
  readonly createGetSignature: (showToast: ShowToast) => GetSignatureWithError;
  readonly getNonce: GetNonce;
  readonly isActiveChainSupported: () => boolean;
  readonly setAuthLoadingState: (state: AuthLoadingState) => void;
  readonly setToast: ShowToast;
}

const failed = (
  reason: SignedMessagesGrantFailure
): SignedMessagesGrantResult => ({ success: false, reason });

const ignoreToast: ShowToast = () => undefined;

/**
 * Follows the sign-in steps so a failure can be named without changing the
 * shared sign-in: the challenge request, then the wallet signature.
 */
function createGrantProgress() {
  let nonceRequested = false;
  let nonceFailed = false;
  let signature:
    | "pending"
    | "signed"
    | "rejected"
    | "session-error"
    | "failed"
    | null = null;

  const observeNonce =
    (getNonce: GetNonce): GetNonce =>
    async (params) => {
      nonceRequested = true;
      try {
        const response = await getNonce(params);
        nonceFailed = false;
        return response;
      } catch (error) {
        nonceFailed = true;
        throw error;
      }
    };

  const observeSignature =
    (
      getSignature: GetSignatureWithError,
      onSignatureRequested: (() => void) | undefined
    ): GetSignature =>
    async (params) => {
      signature = "pending";
      try {
        onSignatureRequested?.();
      } catch {
        // Progress reporting never affects the sign-in.
      }
      const result = await getSignature(params);
      if (result.userRejected) {
        signature = "rejected";
      } else if (result.signature) {
        signature = "signed";
      } else {
        signature = isWalletConnectSessionError(result.error)
          ? "session-error"
          : "failed";
      }
      return result;
    };

  const getFailure = (isCurrent: boolean): SignedMessagesGrantFailure => {
    if (signature === "rejected") {
      return "rejected";
    }
    if (!isCurrent) {
      return "context-changed";
    }
    if (signature === "signed") {
      return "sign-in-failed";
    }
    if (signature === "session-error") {
      return "walletconnect-session";
    }
    if (signature !== null) {
      return "signature-failed";
    }
    if (nonceFailed) {
      return "challenge-failed";
    }
    return nonceRequested ? "challenge-mismatch" : "device-key";
  };

  return { observeNonce, observeSignature, getFailure };
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
    createGetSignature,
    createSigningAuthRequestGuard,
    getNonce,
    isActiveChainSupported,
    setAuthLoadingState,
    setToast,
  }: SignedMessagesGrantRequestParams): RequestSignedMessagesGrant =>
  async ({
    onSignatureRequested,
    silent = false,
    encryptedMessages = false,
  } = {}) => {
    const showToast = silent ? ignoreToast : setToast;
    if (!address || !canAuthenticate) {
      return failed("unavailable");
    }
    // Checked before the network: without a live connection there is no
    // chain either, and that must not read as an unsupported network.
    if (!canSignActiveWallet) {
      showToast({
        message: t(AUTH_MODAL_LOCALE, "signedMessages.enable.reconnectWallet"),
        type: "error",
      });
      return failed("wallet-disconnected");
    }
    if (!isActiveChainSupported()) {
      // AppKit explains an unsupported network; callers may switch it.
      return failed("wrong-network");
    }

    const authRequestGuard = createSigningAuthRequestGuard();
    const progress = createGrantProgress();
    const requestSignIn = createAuthRequestSignIn({
      getNonce: progress.observeNonce(getNonce),
      getSignature: progress.observeSignature(
        createGetSignature(showToast),
        onSignatureRequested
      ),
      setToast: showToast,
    });
    setAuthLoadingState("signing");
    try {
      const { success, e2ee } = await requestSignIn({
        signerAddress: address,
        role: null,
        authRequestGuard,
        deviceGrantMode: "required",
        requireE2eeDevice: encryptedMessages,
      });
      if (!success) {
        return failed(progress.getFailure(authRequestGuard.isCurrent()));
      }
      return e2ee ? { success: true, e2ee } : { success: true };
    } finally {
      setAuthLoadingState("idle");
    }
  };
