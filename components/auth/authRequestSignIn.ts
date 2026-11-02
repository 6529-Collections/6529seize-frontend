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
import {
  prepareLoginE2eeDevice,
  toE2eeNonceParams,
  type LoginE2eeDevice,
} from "@/lib/device-signing/login-e2ee";
import { adoptLoginE2eeDevice } from "./authLoginE2eeDevice";
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
  /**
   * "Turn on encrypted messages" (NC8, with deviceGrantMode "required"):
   * sign only a challenge that also grants this browser's MLS key, and wait
   * for the key handover before resolving.
   */
  readonly requireE2eeDevice?: boolean | undefined;
}

/** What a sign-in that required the encrypted-messages key left behind. */
export interface LoginE2eeGrantResult {
  /** The id of the grant the server stored (signing and MLS keys). */
  readonly grantId: string | null;
  /** The local copy of that grant replaced this browser's previous one. */
  readonly grantSaved: boolean;
  /** The MLS key is stored for the encrypted-messages engine to register. */
  readonly adopted: boolean;
}

/** The local follow-up of a grant sign-in, filled once the login is done. */
interface GrantHandover {
  grantId: string | null;
  grantSaved: Promise<boolean> | null;
  adoption: Promise<boolean> | null;
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

type AuthRequestSignIn = (params: AuthRequestSignInParams) => Promise<{
  readonly success: boolean;
  /** Set on success when `requireE2eeDevice` was given. */
  readonly e2ee?: LoginE2eeGrantResult | undefined;
}>;

type AuthSessionResponse = Awaited<ReturnType<typeof loginWithSessionV2>>;

interface SignInChallenge {
  readonly nonceResponse: ApiSessionNonceResponse;
  /** Set only when the challenge grants exactly this device's key. */
  readonly deviceGrant: LoginDeviceGrant | null;
  /**
   * Set only when the challenge is a combined grant (NC8) that also grants
   * exactly this browser's MLS key for encrypted messages.
   */
  readonly e2eeDevice: LoginE2eeDevice | null;
}

type GetNonce = AuthRequestSignInDependencies["getNonce"];

/** Classifies a grant challenge; null when it must not be signed. */
const toGrantChallenge = (
  nonceResponse: ApiSessionNonceResponse,
  deviceGrant: LoginDeviceGrant,
  e2eeDevice: LoginE2eeDevice | null
): SignInChallenge | null => {
  const message = nonceResponse.signable_message;
  if (e2eeDevice && isDeviceGrantChallenge(message, deviceGrant, e2eeDevice)) {
    return { nonceResponse, deviceGrant, e2eeDevice };
  }
  // A server with encrypted messages off (or on another ciphersuite) grants
  // the signing key alone; encrypted messages then keep their own prompt.
  if (isDeviceGrantChallenge(message, deviceGrant)) {
    return { nonceResponse, deviceGrant, e2eeDevice: null };
  }
  // A challenge without any device grant is the ordinary one; never sign a
  // grant for a key other than this device's.
  return carriesDeviceGrant(message)
    ? null
    : { nonceResponse, deviceGrant: null, e2eeDevice: null };
};

const getGrantChallenge = async ({
  deviceGrant,
  deviceGrantMode,
  getNonce,
  signerAddress,
}: {
  readonly deviceGrant: LoginDeviceGrant;
  readonly deviceGrantMode: DeviceGrantMode;
  readonly getNonce: GetNonce;
  readonly signerAddress: string;
}): Promise<SignInChallenge | null> => {
  try {
    const nonceResponse = await getNonce({
      signerAddress,
      deviceGrant: toDeviceGrantNonceParams(deviceGrant),
    });
    return toGrantChallenge(nonceResponse, deviceGrant, null);
  } catch (error) {
    if (deviceGrantMode === "required") {
      throw error;
    }
    return null;
  }
};

/**
 * NC8: asks for a challenge that grants the signing key and the MLS key in
 * one signature. Null whenever that cannot be had (a server without combined
 * grants rejects the parameters, or answers with something unexpected), so
 * the caller falls back to the signing-only grant challenge.
 */
const getCombinedGrantChallenge = async ({
  deviceGrant,
  e2eeDevice,
  getNonce,
  signerAddress,
}: {
  readonly deviceGrant: LoginDeviceGrant;
  readonly e2eeDevice: LoginE2eeDevice;
  readonly getNonce: GetNonce;
  readonly signerAddress: string;
}): Promise<SignInChallenge | null> => {
  try {
    const nonceResponse = await getNonce({
      signerAddress,
      deviceGrant: {
        ...toDeviceGrantNonceParams(deviceGrant),
        ...toE2eeNonceParams(e2eeDevice),
      },
    });
    const challenge = toGrantChallenge(nonceResponse, deviceGrant, e2eeDevice);
    return challenge?.deviceGrant ? challenge : null;
  } catch {
    return null;
  }
};

const getDeviceGrantChallenge = async ({
  deviceGrant,
  deviceGrantMode,
  getNonce,
  requireE2eeDevice,
  signerAddress,
}: {
  readonly deviceGrant: LoginDeviceGrant;
  readonly deviceGrantMode: DeviceGrantMode;
  readonly getNonce: GetNonce;
  readonly requireE2eeDevice: boolean;
  readonly signerAddress: string;
}): Promise<SignInChallenge | null> => {
  const e2eeDevice = await prepareLoginE2eeDevice({
    required: requireE2eeDevice,
  });
  const combined = e2eeDevice
    ? await getCombinedGrantChallenge({
        deviceGrant,
        e2eeDevice,
        getNonce,
        signerAddress,
      })
    : null;
  if (e2eeDevice && !combined?.e2eeDevice) {
    e2eeDevice.dispose();
  }
  if (requireE2eeDevice) {
    // A signing-only challenge would not turn on encrypted messages; they
    // keep their own grant prompt instead of a second signature.
    return combined?.e2eeDevice ? combined : null;
  }
  return (
    combined ??
    (await getGrantChallenge({
      deviceGrant,
      deviceGrantMode,
      getNonce,
      signerAddress,
    }))
  );
};

/**
 * Requests a challenge that also grants this device's key when possible and
 * falls back to the ordinary challenge whenever the grant cannot be obtained
 * or checked, so a device-key problem never breaks sign-in.
 */
const getSignInChallenge = async ({
  deviceGrantMode,
  getNonce,
  requireE2eeDevice,
  role,
  signerAddress,
}: {
  readonly deviceGrantMode: DeviceGrantMode;
  readonly getNonce: AuthRequestSignInDependencies["getNonce"];
  readonly requireE2eeDevice: boolean;
  readonly role: string | null;
  readonly signerAddress: string;
}): Promise<SignInChallenge> => {
  const deviceGrant = isDeviceGrantPossible(role)
    ? await prepareLoginDeviceGrant({ signerAddress, mode: deviceGrantMode })
    : null;
  const grantChallenge = deviceGrant
    ? await getDeviceGrantChallenge({
        deviceGrant,
        deviceGrantMode,
        getNonce,
        requireE2eeDevice,
        signerAddress,
      })
    : null;
  if (
    (deviceGrantMode === "required" && !grantChallenge?.deviceGrant) ||
    (requireE2eeDevice && !grantChallenge?.e2eeDevice)
  ) {
    grantChallenge?.e2eeDevice?.dispose();
    throw new DeviceGrantUnavailableError();
  }
  return (
    grantChallenge ?? (await getOrdinaryChallenge(getNonce, signerAddress))
  );
};

/**
 * The ordinary challenge must grant nothing: the wallet never signs a device
 * or encrypted-messages grant that this browser did not ask for and check,
 * so the server cannot have a key of its choosing granted.
 */
const getOrdinaryChallenge = async (
  getNonce: GetNonce,
  signerAddress: string
): Promise<SignInChallenge> => {
  const nonceResponse = await getNonce({ signerAddress });
  if (carriesDeviceGrant(nonceResponse.signable_message)) {
    throw new NonceResponseValidationError(
      "Unrequested device grant in the sign-in challenge"
    );
  }
  return { nonceResponse, deviceGrant: null, e2eeDevice: null };
};

const createSignInSession = async ({
  authRequestGuard,
  deviceGrantMode = "auto",
  getNonce,
  getSignature,
  handover,
  requireE2eeDevice = false,
  role,
  setToast,
  signerAddress,
}: AuthRequestSignInDependencies &
  AuthRequestSignInParams & {
    readonly handover: GrantHandover;
  }): Promise<AuthSessionResponse | null> => {
  const { nonceResponse, deviceGrant, e2eeDevice } = await getSignInChallenge({
    deviceGrantMode,
    getNonce,
    requireE2eeDevice,
    role,
    signerAddress,
  });
  try {
    return await signInWithChallenge({
      authRequestGuard,
      deviceGrant,
      deviceGrantMode,
      getSignature,
      nonceResponse,
      role,
      setToast,
      signerAddress,
      onSignedIn: (
        { storedGrantId, ownProfileId, grantSaved },
        clientSignature
      ) => {
        handover.grantId = storedGrantId;
        handover.grantSaved = grantSaved;
        if (e2eeDevice && storedGrantId) {
          handover.adoption = adoptLoginE2eeDevice({
            e2eeDevice,
            message: nonceResponse.signable_message,
            walletSignature: clientSignature,
            storedGrantId,
            ownProfileId,
            signerAddress,
          });
        }
      },
    });
  } finally {
    // The MLS key is used only by a combined sign-in that completes.
    if (!handover.adoption) {
      e2eeDevice?.dispose();
    }
  }
};

/** Waits for the local grant copy and the MLS key handover (never throws). */
const settleGrantHandover = async (
  handover: GrantHandover
): Promise<LoginE2eeGrantResult> => {
  const [grantSaved, adopted] = await Promise.all([
    handover.grantSaved ?? false,
    handover.adoption ?? false,
  ]);
  return { grantId: handover.grantId, grantSaved, adopted };
};

const signInWithChallenge = async ({
  authRequestGuard,
  deviceGrant,
  deviceGrantMode,
  getSignature,
  nonceResponse,
  onSignedIn,
  role,
  setToast,
  signerAddress,
}: {
  readonly authRequestGuard: AuthRequestGuard | undefined;
  readonly deviceGrant: LoginDeviceGrant | null;
  readonly deviceGrantMode: DeviceGrantMode;
  readonly getSignature: AuthRequestSignInDependencies["getSignature"];
  readonly nonceResponse: ApiSessionNonceResponse;
  /** A web grant sign-in finished: the grant the server stored, if any. */
  readonly onSignedIn: (
    signedIn: {
      readonly storedGrantId: string | null;
      readonly ownProfileId: string | null;
      /** Settles once the local copy of the grant is kept (or not). */
      readonly grantSaved: Promise<boolean>;
    },
    clientSignature: string
  ) => void;
  readonly role: string | null;
  readonly setToast: (toast: AppToastInput) => void;
  readonly signerAddress: string;
}): Promise<AuthSessionResponse | null> => {
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
    const grantSaved = storeLoginDeviceGrant(
      deviceGrant,
      sessionResponse.device_grant,
      sessionResponse.role ?? null
    );
    onSignedIn(
      {
        storedGrantId: sessionResponse.device_grant?.id ?? null,
        ownProfileId: sessionResponse.role ?? null,
        grantSaved,
      },
      clientSignature.signature
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
    requireE2eeDevice,
    role,
    signerAddress,
  }: AuthRequestSignInParams) => {
    const handover: GrantHandover = {
      grantId: null,
      grantSaved: null,
      adoption: null,
    };
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
        handover,
        requireE2eeDevice,
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

      return requireE2eeDevice === true
        ? { success: true, e2ee: await settleGrantHandover(handover) }
        : { success: true };
    } catch (error) {
      if (isAuthRequestStale(authRequestGuard)) {
        return { success: false };
      }
      showRequestSignInError({ error, setToast });
      return { success: false };
    }
  };
