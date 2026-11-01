import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiRegisterDeviceGrantRequest } from "@/generated/models/ApiRegisterDeviceGrantRequest";
import {
  type AppGrantFields,
  appGrantTimes,
  buildAppGrantTypedData,
  computeAppGrantId,
} from "./app-grant";
import { ensureDeviceKey, saveDeviceGrant } from "./device-key-store";
import { DEFAULT_DEVICE_SCOPES } from "./grant-message";
import type { LoginE2eeDevice } from "./login-e2ee";

/**
 * "Turn on signed messages" in 6529 Mobile and 6529 Desktop, whose sign-in
 * is not a SIWE web session: the wallet signs one EIP-712 app grant for this
 * device's signing key and, when `e2eeDevice` is given, its encrypted-messages
 * key too. The grant is registered with POST /device-grants and stored like a
 * sign-in grant; the encrypted-messages key is handed to the engine, which
 * registers it with that grant and no second prompt.
 */

export type AppGrantTypedData = ReturnType<typeof buildAppGrantTypedData>;

export type AppGrantSignature =
  | { readonly signature: string }
  | { readonly userRejected: true }
  | { readonly error: unknown };

export type AppGrantFailure =
  /** This device could not prepare its signing key. */
  | "device-key"
  | "rejected"
  /** The wallet returned no signature without the user declining. */
  | "signature-failed"
  /** The wallet signed but the server did not store the grant. */
  | "register-failed";

export type AppGrantResult =
  | {
      readonly success: true;
      readonly grant: ApiDeviceGrant;
      /** Whether the encrypted-messages key was handed to the engine. */
      readonly e2eeAdopted: boolean;
    }
  | { readonly success: false; readonly reason: AppGrantFailure };

export interface AppGrantRequest {
  /** The signed-in wallet. */
  readonly address: string;
  /** The wallet's own profile, or null without one. */
  readonly ownProfileId: string | null;
  /** The page host, or "6529 Desktop". */
  readonly origin: string;
  readonly platform: "desktop" | "phone";
  readonly deviceLabel: string;
  /** An encrypted-messages key to grant in the same signature, or null. */
  readonly e2eeDevice: LoginE2eeDevice | null;
  readonly signTypedData: (
    typedData: AppGrantTypedData
  ) => Promise<AppGrantSignature>;
  readonly registerGrant: (
    request: ApiRegisterDeviceGrantRequest
  ) => Promise<ApiDeviceGrant>;
  /** Called once the wallet has been asked for the signature. */
  readonly onSignatureRequested?: (() => void) | undefined;
  readonly now?: (() => number) | undefined;
}

const failed = (reason: AppGrantFailure): AppGrantResult => ({
  success: false,
  reason,
});

const toRequest = (
  fields: AppGrantFields,
  signature: string,
  deviceLabel: string
): ApiRegisterDeviceGrantRequest => ({
  grant: {
    wallet: fields.wallet,
    device_key: fields.deviceKeyHex,
    scopes: [...fields.scopes],
    mls_device_key: fields.mls?.deviceKeyHex ?? null,
    ciphersuite: fields.mls?.ciphersuite ?? null,
    issued_at: fields.issuedAtSeconds,
    expires_at: fields.expiresAtSeconds,
    origin: fields.origin,
  },
  wallet_signature: signature,
  device_label: deviceLabel,
});

async function prepareFields(
  request: AppGrantRequest
): Promise<AppGrantFields | null> {
  try {
    const key = await ensureDeviceKey(request.address);
    return {
      wallet: key.address,
      deviceKeyHex: key.publicKeyHex.toLowerCase(),
      scopes: DEFAULT_DEVICE_SCOPES,
      mls: request.e2eeDevice
        ? {
            deviceKeyHex: request.e2eeDevice.deviceKeyHex,
            ciphersuite: request.e2eeDevice.ciphersuite,
          }
        : null,
      ...appGrantTimes((request.now ?? Date.now)()),
      origin: request.origin,
    };
  } catch {
    return null;
  }
}

async function adoptE2eeDevice(
  request: AppGrantRequest,
  fields: AppGrantFields,
  grant: ApiDeviceGrant,
  signature: string
): Promise<boolean> {
  const device = request.e2eeDevice;
  if (!device || request.ownProfileId === null) {
    return false;
  }
  return await device.adopt({
    profileId: request.ownProfileId,
    wallet: fields.wallet,
    grantId: grant.id,
    walletSignature: signature,
    origin: fields.origin,
    issuedAtSeconds: fields.issuedAtSeconds,
    expiresAtSeconds: fields.expiresAtSeconds,
    platform: request.platform,
  });
}

/**
 * Never throws. The encrypted-messages key is always either adopted by the
 * engine or released.
 */
export async function requestAppDeviceGrant(
  request: AppGrantRequest
): Promise<AppGrantResult> {
  let handedOver = false;
  try {
    const fields = await prepareFields(request);
    if (!fields) {
      return failed("device-key");
    }
    const typedData = buildAppGrantTypedData(fields);
    request.onSignatureRequested?.();
    const signed = await request.signTypedData(typedData);
    if ("userRejected" in signed) {
      return failed("rejected");
    }
    if (!("signature" in signed) || !signed.signature) {
      return failed("signature-failed");
    }
    const signature = signed.signature.toLowerCase();
    let grant: ApiDeviceGrant;
    try {
      grant = await request.registerGrant(
        toRequest(fields, signature, request.deviceLabel)
      );
    } catch {
      return failed("register-failed");
    }
    // The server must have stored exactly what the wallet signed.
    if (
      grant.id.toLowerCase() !== computeAppGrantId(typedData.message) ||
      grant.revoked_at !== null ||
      !(await saveDeviceGrant(fields.wallet, grant, request.ownProfileId))
    ) {
      return failed("register-failed");
    }
    handedOver = true;
    const e2eeAdopted = await adoptE2eeDevice(
      request,
      fields,
      grant,
      signature
    );
    return { success: true, grant, e2eeAdopted };
  } finally {
    if (!handedOver) {
      request.e2eeDevice?.dispose();
    }
  }
}
