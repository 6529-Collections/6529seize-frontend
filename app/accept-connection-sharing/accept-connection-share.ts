import type { useAuth } from "@/components/auth/Auth";
import { areEqualAddresses } from "@/helpers/Helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
import {
  persistSessionResponse,
  redeemConnectionShare,
} from "@/services/auth/session-v2.utils";
import {
  reportConnectionShareSetup,
  type ConnectionShareSetupStage,
} from "@/utils/monitoring/connectionShareSetupMonitoring";

const ACCEPT_CONNECTION_LOCALE = DEFAULT_LOCALE;

type SetToast = ReturnType<typeof useAuth>["setToast"];

export const CONNECTION_SETUP_FAILED = "setup-failed";

export type SetupKeyRef = { current: { key: string } | null };

type ConnectionShareAcceptance =
  | "rejected"
  | "connected"
  | typeof CONNECTION_SETUP_FAILED
  | "pending-enrollment";

/** Completes the secure part of a connection after its sign-in was saved. */
async function finishSharedDeviceSetup({
  response,
  secret,
  target,
}: {
  readonly response: Awaited<ReturnType<typeof redeemConnectionShare>>;
  readonly secret: string;
  readonly target: "native" | "desktop";
}): Promise<Exclude<ConnectionShareAcceptance, "rejected">> {
  let stage: ConnectionShareSetupStage = "missing-envelope";
  try {
    if (!response.encrypted_device_setup)
      throw new Error("Missing device setup");
    stage = "missing-unlock-key";
    if (!secret) throw new Error("Missing device setup key");
    stage = "unsupported-role";
    if (response.role) throw new Error("Proxy device setup is unavailable");
    stage = "load-setup";
    const { acceptConnectionDeviceSetup } =
      await import("@/lib/device-signing/connection-setup");
    const outcome = await acceptConnectionDeviceSetup({
      envelope: response.encrypted_device_setup,
      secret,
      wallet: response.address,
      accessToken: response.access_token,
      target,
      onStage: (nextStage) => {
        stage = nextStage;
      },
    });
    reportConnectionShareSetup(outcome, stage, target);
    if (outcome === "legacy-device") return CONNECTION_SETUP_FAILED;
    return outcome === "pending-enrollment" ? outcome : "connected";
  } catch {
    reportConnectionShareSetup("failed", stage, target);
    return CONNECTION_SETUP_FAILED;
  }
}

/** Redeems a native or desktop share and keeps sign-in active if its device setup fails. */
export async function acceptConnectionShare({
  address,
  connectionShareCode,
  setupSecret,
  includesDeviceSetup,
  target,
  setToast,
  seizeAcceptConnection,
}: {
  readonly address: string;
  readonly connectionShareCode: string;
  readonly setupSecret: SetupKeyRef;
  readonly includesDeviceSetup: boolean;
  readonly target: "native" | "desktop";
  readonly setToast: SetToast;
  readonly seizeAcceptConnection: (address: string) => void;
}): Promise<ConnectionShareAcceptance> {
  if (address && canStoreAnotherWalletAccount(address) === false) {
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.maxProfiles"
      ),
      type: "error",
    });
    return "rejected";
  }

  // Keep the setup key and the user's choice with this redemption across awaits.
  const acceptedKey = setupSecret.current;
  const expectsDeviceSetup = includesDeviceSetup || Boolean(acceptedKey);
  const reportFailure = (stage: ConnectionShareSetupStage) => {
    if (expectsDeviceSetup) reportConnectionShareSetup("failed", stage, target);
  };
  const redeemResponse = await redeemConnectionShare(
    connectionShareCode,
    target
  ).catch((error: unknown) => {
    reportFailure("redeem");
    throw error;
  });
  const hasValidRedeemResponse =
    !!redeemResponse.address &&
    !!redeemResponse.access_token &&
    (!address || areEqualAddresses(redeemResponse.address, address));
  if (hasValidRedeemResponse === false) {
    reportFailure("invalid-response");
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.invalidResponse"
      ),
      type: "error",
    });
    return "rejected";
  }

  if (canStoreAnotherWalletAccount(redeemResponse.address) === false) {
    reportFailure("profile-limit");
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.maxProfiles"
      ),
      type: "error",
    });
    return "rejected";
  }

  // An envelope without its unlock key still needs a visible setup failure.
  const hasDeviceSetup =
    expectsDeviceSetup || Boolean(redeemResponse.encrypted_device_setup);
  const didPersistJwt = await persistSessionResponse(redeemResponse).catch(
    () => false
  );
  if (didPersistJwt === false) {
    if (hasDeviceSetup)
      reportConnectionShareSetup("failed", "persist-session", target);
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.persistFailed"
      ),
      type: "error",
    });
    return "rejected";
  }

  const outcome = hasDeviceSetup
    ? await finishSharedDeviceSetup({
        response: redeemResponse,
        secret: acceptedKey?.key ?? "",
        target,
      })
    : "connected";
  if (setupSecret.current === acceptedKey) setupSecret.current = null;
  seizeAcceptConnection(redeemResponse.address);
  return outcome;
}
