import { bytesToHex } from "viem";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { SignAppGrant } from "@/components/auth/authAppSignedMessagesGrant";
import { setE2eeEnrollmentMarker } from "@/components/e2ee/e2eeLocalState";
import {
  base64ToBytes,
  bytesToBase64,
  hexToBytes,
  randomBytes,
  toArrayBuffer,
} from "@/lib/e2ee/bytes";
import { E2EE_CIPHERSUITE } from "@/lib/e2ee/grant";
import { createLoginE2eeDevice } from "@/lib/e2ee/login-device";
import { getDefaultE2eeStorage } from "@/lib/e2ee/storage";
import { MlsClient } from "@/lib/e2ee/mls-adapter";
import { loadDefaultWasm } from "@/lib/e2ee/wasm-loader";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  registerAppDeviceGrant,
  revokeDeviceGrant,
} from "@/services/api/device-grants-api";
import {
  appGrantTimes,
  buildAppGrantTypedData,
  computeAppGrantId,
} from "./app-grant";
import { appGrantToRequest } from "./app-grant-request";
import { installSharedDeviceKey } from "./device-key-store";
import { isEd25519Supported } from "./ed25519";
import { DEFAULT_DEVICE_SCOPES } from "./grant-message";
import {
  openConnectionSetup,
  sealConnectionSetup,
  type ConnectionSetupTarget,
} from "./connection-setup-envelope";

/** Creates new keys for the receiving device. Existing keys/history never leave this browser. */
export async function prepareConnectionDeviceSetup(input: {
  readonly wallet: string;
  readonly profileId: string;
  readonly target: ConnectionSetupTarget;
  readonly sign: SignAppGrant;
  readonly isCurrent: () => boolean;
  readonly onSignatureRequested?: (() => void) | undefined;
}) {
  const mls = MlsClient.create(await loadDefaultWasm());
  let privateBytes: Uint8Array | null = null;
  let state: Uint8Array | null = null;
  let registeredId: string | null = null;
  try {
    const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
      "sign",
      "verify",
    ]);
    privateBytes = new Uint8Array(
      await crypto.subtle.exportKey("pkcs8", pair.privateKey)
    );
    const fields = {
      wallet: input.wallet.toLowerCase(),
      deviceKeyHex: bytesToHex(
        new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))
      ),
      scopes: DEFAULT_DEVICE_SCOPES,
      mls: { deviceKeyHex: mls.deviceKey(), ciphersuite: E2EE_CIPHERSUITE },
      ...appGrantTimes(Date.now()),
      origin:
        input.target === "desktop" ? "6529 Desktop" : globalThis.location.host,
    };
    if (!input.isCurrent()) throw new Error("Device setup context changed");
    input.onSignatureRequested?.();
    const signed = await input.sign(buildAppGrantTypedData(fields));
    if ("userRejected" in signed) return null;
    if (!("signature" in signed))
      throw new Error("Device setup signature failed");
    if (!input.isCurrent()) throw new Error("Device setup context changed");
    const request = appGrantToRequest(
      fields,
      signed.signature,
      input.target === "desktop" ? "6529 Desktop" : "6529 Mobile"
    );
    const grant = await registerAppDeviceGrant(request);
    registeredId = grant.id;
    if (
      grant.id !== computeAppGrantId(buildAppGrantTypedData(fields).message) ||
      !input.isCurrent()
    )
      throw new Error("Device setup grant mismatch");
    state = mls.exportState();
    const sealed = await sealConnectionSetup(
      {
        version: 1,
        profileId: input.profileId,
        privateKey: bytesToBase64(privateBytes),
        mlsState: bytesToBase64(state),
        request: {
          ...request,
          device_label: request.device_label ?? "6529 App",
          grant: {
            ...request.grant,
            mls_device_key: fields.mls.deviceKeyHex,
            ciphersuite: E2EE_CIPHERSUITE,
          },
        },
      },
      input.target
    );
    return { ...sealed, grantId: registeredId };
  } catch (error) {
    if (registeredId)
      await revokeDeviceGrant(registeredId).catch(() => undefined);
    throw error;
  } finally {
    privateBytes?.fill(0);
    state?.fill(0);
    mls.dispose();
  }
}

async function importSigningPair(
  privateKey: string,
  publicKey: string
): Promise<CryptoKeyPair> {
  const raw = base64ToBytes(privateKey);
  try {
    const pair = {
      privateKey: await crypto.subtle.importKey(
        "pkcs8",
        toArrayBuffer(raw),
        "Ed25519",
        false,
        ["sign"]
      ),
      publicKey: await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(hexToBytes(publicKey)),
        "Ed25519",
        true,
        ["verify"]
      ),
    };
    const challenge = toArrayBuffer(randomBytes(32));
    const signature = await crypto.subtle.sign(
      "Ed25519",
      pair.privateKey,
      challenge
    );
    if (
      !(await crypto.subtle.verify(
        "Ed25519",
        pair.publicKey,
        signature,
        challenge
      ))
    )
      throw new Error("Device setup key mismatch");
    return pair;
  } finally {
    raw.fill(0);
  }
}

/** Authenticates the wallet grant on the server, then imports target-bound fresh keys locally. */
export async function acceptConnectionDeviceSetup(input: {
  readonly envelope: string;
  readonly secret: string;
  readonly wallet: string;
  readonly accessToken: string;
  readonly target: ConnectionSetupTarget;
}): Promise<void> {
  const bundle = await openConnectionSetup(
    input.envelope,
    input.secret,
    input.wallet,
    input.target
  );
  const grant = await commonApiPost<typeof bundle.request, ApiDeviceGrant>({
    endpoint: "device-grants",
    body: bundle.request,
    includeWalletAuth: false,
    headers: { Authorization: `Bearer ${input.accessToken}` },
  });
  const identity = await commonApiFetch<ApiIdentity>({
    endpoint: `identities/${encodeURIComponent(input.wallet)}`,
    includeWalletAuth: false,
  });
  if (
    identity.id !== bundle.profileId ||
    grant.wallet.toLowerCase() !== input.wallet.toLowerCase() ||
    grant.device_key !== bundle.request.grant.device_key ||
    grant.revoked_at !== null ||
    grant.expires_at <= Date.now() + 60000
  )
    throw new Error("Device setup grant mismatch");
  const pair = (await isEd25519Supported())
    ? await importSigningPair(bundle.privateKey, grant.device_key)
    : null;
  const state = base64ToBytes(bundle.mlsState);
  const device = await createLoginE2eeDevice({ state });
  state.fill(0);
  try {
    if (device.deviceKeyHex !== bundle.request.grant.mls_device_key)
      throw new Error("Device setup encryption key mismatch");
    if (pair)
      await installSharedDeviceKey({
        address: input.wallet.toLowerCase(),
        publicKeyHex: grant.device_key,
        keyPair: pair,
        grant,
        ownProfileId: identity.id,
        lastSeq: 0,
      });
    const adopted = await device.adopt({
      profileId: identity.id,
      wallet: input.wallet,
      grantId: grant.id,
      walletSignature: bundle.request.wallet_signature,
      origin: bundle.request.grant.origin,
      issuedAtSeconds: bundle.request.grant.issued_at,
      expiresAtSeconds: bundle.request.grant.expires_at,
      platform: input.target === "desktop" ? "desktop" : "phone",
    });
    if (
      !adopted &&
      !(await getDefaultE2eeStorage().getDevice(identity.id))?.registered
    )
      throw new Error("Device setup could not be saved");
    // Keeping an already registered MLS device is intentional: never replace its history.
    if (adopted) {
      setE2eeEnrollmentMarker(identity.id, true);
      if (typeof globalThis.dispatchEvent === "function")
        globalThis.dispatchEvent(new Event("storage"));
    }
  } finally {
    device.dispose();
  }
}
