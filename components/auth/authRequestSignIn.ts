import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { t } from "@/i18n/messages";
import {
  carriesDeviceGrant,
  isDeviceGrantChallenge,
  isDeviceGrantPossible,
  prepareLoginDeviceGrant,
  skipAutoDeviceGrant,
  storeLoginDeviceGrant,
  toDeviceGrantNonceParams,
  type DeviceGrantMode,
  type LoginDeviceGrant,
} from "@/lib/device-signing/login-grant";
import { AUTH_SIGNATURE_FAILED_MESSAGE } from "@/services/auth/auth.messages";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
import {
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";
import type { SessionNonceDeviceGrantParams } from "@/services/auth/session-v2.types";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  AuthenticationNonceError,
  DeviceGrantUnavailableError,
  InvalidSignerAddressError,
  NonceResponseValidationError,
} from "./authErrors";
import { isAuthRequestStale, type AuthRequestGuard } from "./authRequestGuard";
import { AUTH_MODAL_LOCALE } from "./authSessionUpgrade";

interface AuthRequestSignInParams {
  readonly signerAddress: string;
  readonly role: string | null;
  readonly authRequestGuard?: AuthRequestGuard | undefined;
  /** Defaults to "auto"; "required" is the "Turn on signed messages" action. */
  readonly deviceGrantMode?: DeviceGrantMode | undefined;
}

interface AuthRequestSignInDependencies {
  readonly getNonce: (params: {
    readonly signerAddress: string;
    readonly deviceGrant?: SessionNonceDeviceGrantParams | undefined;
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

interface SignInChallenge {
  readonly nonceResponse: ApiSessionNonceResponse;
  /** Set only when the challenge grants exactly this device's key. */
  readonly deviceGrant: LoginDeviceGrant | null;
}

const getGrantChallenge = async ({
  deviceGrant,
  deviceGrantMode,
  getNonce,
  signerAddress,
}: {
  readonly deviceGrant: LoginDeviceGrant;
  readonly deviceGrantMode: DeviceGrantMode;
  readonly getNonce: AuthRequestSignInDependencies["getNonce"];
  readonly signerAddress: string;
}): Promise<SignInChallenge | null> => {
  try {
    const nonceResponse = await getNonce({
      signerAddress,
      deviceGrant: toDeviceGrantNonceParams(deviceGrant),
    });
    const message = nonceResponse.signable_message;
    if (isDeviceGrantChallenge(message, deviceGrant)) {
      return { nonceResponse, deviceGrant };
    }
    // A challenge without any device grant is the ordinary one; never sign a
    // grant for a key other than this device's.
    return carriesDeviceGrant(message)
      ? null
      : { nonceResponse, deviceGrant: null };
  } catch (error) {
    if (deviceGrantMode === "required") {
      throw error;
    }
    return null;
  }
};

/**
 * Requests a challenge that also grants this device's key when possible and
 * falls back to the ordinary challenge whenever the grant cannot be obtained
 * or checked, so a device-key problem never breaks sign-in.
 */
const getSignInChallenge = async ({
  deviceGrantMode,
  getNonce,
  role,
  signerAddress,
}: {
  readonly deviceGrantMode: DeviceGrantMode;
  readonly getNonce: AuthRequestSignInDependencies["getNonce"];
  readonly role: string | null;
  readonly signerAddress: string;
}): Promise<SignInChallenge> => {
  const deviceGrant = isDeviceGrantPossible(role)
    ? await prepareLoginDeviceGrant({ signerAddress, mode: deviceGrantMode })
    : null;
  const grantChallenge = deviceGrant
    ? await getGrantChallenge({
        deviceGrant,
        deviceGrantMode,
        getNonce,
        signerAddress,
      })
    : null;
  if (deviceGrantMode === "required" && !grantChallenge?.deviceGrant) {
    throw new DeviceGrantUnavailableError();
  }
  return (
    grantChallenge ?? {
      nonceResponse: await getNonce({ signerAddress }),
      deviceGrant: null,
    }
  );
};

const createSignInSession = async ({
  authRequestGuard,
  deviceGrantMode = "auto",
  getNonce,
  getSignature,
  role,
  setToast,
  signerAddress,
}: AuthRequestSignInDependencies &
  AuthRequestSignInParams): Promise<AuthSessionResponse | null> => {
  const { nonceResponse, deviceGrant } = await getSignInChallenge({
    deviceGrantMode,
    getNonce,
    role,
    signerAddress,
  });
  if (isAuthRequestStale(authRequestGuard)) {
    return null;
  }
  const { signable_message, server_signature } = nonceResponse;
  // A grant sign-in that does not finish must never lock the wallet out:
  // its next automatic sign-in uses the ordinary challenge.
  const skipGrantNextTime = () => {
    if (deviceGrant && deviceGrantMode === "auto") {
      skipAutoDeviceGrant(signerAddress);
    }
  };

  const clientSignature = await getSignature({ message: signable_message });
  if (isAuthRequestStale(authRequestGuard)) {
    return null;
  }
  if (clientSignature.userRejected || !clientSignature.signature) {
    skipGrantNextTime();
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
    ...(deviceGrant ? { deviceLabel: deviceGrant.label } : {}),
  }).catch((error: unknown) => {
    skipGrantNextTime();
    throw error;
  });
  if (deviceGrant && sessionResponse.client_type === "web") {
    // The server stored the grant once the login signature verified; keeping
    // the local copy is best effort and never delays sign-in.
    // A grant sign-in never requests a proxy role, so the session role the
    // server returns is the wallet's own profile id.
    void storeLoginDeviceGrant(
      deviceGrant,
      sessionResponse.device_grant,
      sessionResponse.role ?? null
    );
  }
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
  } else if (error instanceof DeviceGrantUnavailableError) {
    setToast({
      message: t(AUTH_MODAL_LOCALE, "signedMessages.enable.unavailable"),
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
    deviceGrantMode,
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
        deviceGrantMode,
        getNonce,
        getSignature,
        role,
        setToast,
        signerAddress,
      });
      if (!sessionResponse) {
        return { success: false };
      }

      const isPersisted = await persistSessionResponse(sessionResponse, {
        shouldPersist: authRequestGuard?.isCurrent,
      });
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
