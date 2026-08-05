import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { AUTH_SIGNATURE_FAILED_MESSAGE } from "@/services/auth/auth.messages";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
import {
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  AuthenticationNonceError,
  InvalidSignerAddressError,
  NonceResponseValidationError,
} from "./authErrors";
import { isAuthRequestStale, type AuthRequestGuard } from "./authRequestGuard";

interface AuthRequestSignInParams {
  readonly signerAddress: string;
  readonly role: string | null;
  readonly authRequestGuard?: AuthRequestGuard | undefined;
}

interface AuthRequestSignInDependencies {
  readonly getNonce: (params: {
    readonly signerAddress: string;
  }) => Promise<ApiSessionNonceResponse>;
  readonly getSignature: (params: { readonly message: string }) => Promise<{
    readonly signature: string | null;
    readonly userRejected: boolean;
    readonly failureToastShown: boolean;
  }>;
  readonly setToast: (toast: AppToastInput) => void;
}

type AuthRequestSignIn = (
  params: AuthRequestSignInParams
) => Promise<{ success: boolean }>;

type AuthSessionResponse = Awaited<ReturnType<typeof loginWithSessionV2>>;

const createSignInSession = async ({
  authRequestGuard,
  getNonce,
  getSignature,
  role,
  setToast,
  signerAddress,
}: AuthRequestSignInDependencies &
  AuthRequestSignInParams): Promise<AuthSessionResponse | null> => {
  const nonceResponse = await getNonce({ signerAddress });
  if (isAuthRequestStale(authRequestGuard)) {
    return null;
  }
  const { signable_message, server_signature } = nonceResponse;

  const clientSignature = await getSignature({ message: signable_message });
  if (isAuthRequestStale(authRequestGuard)) {
    return null;
  }
  if (clientSignature.userRejected) {
    setToast({
      message: "Authentication was canceled in your wallet.",
      type: "error",
    });
    return null;
  }

  if (!clientSignature.signature) {
    if (!clientSignature.failureToastShown) {
      setToast({
        message: AUTH_SIGNATURE_FAILED_MESSAGE,
        type: "error",
      });
    }
    return null;
  }

  const sessionResponse = await loginWithSessionV2({
    serverSignature: server_signature,
    clientSignature: clientSignature.signature,
    signerAddress,
    role,
  });
  return isAuthRequestStale(authRequestGuard) ? null : sessionResponse;
};

const showRequestSignInError = ({
  error,
  setToast,
}: {
  readonly error: unknown;
  readonly setToast: (toast: AppToastInput) => void;
}): void => {
  if (error instanceof InvalidSignerAddressError) {
    setToast({
      message: "Enter a valid wallet address.",
      type: "error",
    });
  } else if (error instanceof NonceResponseValidationError) {
    setToast({
      message: "Couldn't verify the authentication response. Please try again.",
      type: "error",
    });
  } else if (error instanceof AuthenticationNonceError) {
    setToast({
      message: "Couldn't reach the authentication service. Please try again.",
      type: "error",
    });
  } else {
    logErrorSecurely("requestSignIn", error);
    setToast({
      type: "error",
      title: "Couldn't authenticate.",
      description: "Reconnect your wallet and try again.",
      details: getToastErrorDetails(error),
    });
  }
};

export const createAuthRequestSignIn =
  ({
    getNonce,
    getSignature,
    setToast,
  }: AuthRequestSignInDependencies): AuthRequestSignIn =>
  async ({
    authRequestGuard,
    role,
    signerAddress,
  }: AuthRequestSignInParams): Promise<{ success: boolean }> => {
    try {
      if (isAuthRequestStale(authRequestGuard)) {
        return { success: false };
      }
      if (!canStoreAnotherWalletAccount(signerAddress)) {
        setToast({
          message: "You've reached the connected profile limit.",
          type: "error",
        });
        return { success: false };
      }

      const sessionResponse = await createSignInSession({
        authRequestGuard,
        getNonce,
        getSignature,
        role,
        setToast,
        signerAddress,
      });
      if (!sessionResponse) {
        return { success: false };
      }

      const isPersisted = await persistSessionResponse(sessionResponse);
      if (!isPersisted) {
        setToast({
          message: "Couldn't save this connected profile. Please try again.",
          type: "error",
        });
        return { success: false };
      }
      if (authRequestGuard?.acceptCurrentState(signerAddress) === false) {
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      if (isAuthRequestStale(authRequestGuard)) {
        return { success: false };
      }
      showRequestSignInError({ error, setToast });
      return { success: false };
    }
  };
