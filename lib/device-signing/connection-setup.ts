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
import { E2EE_CIPHERSUITE, E2EE_GRANT_SUITES } from "@/lib/e2ee/grant";
import { createLoginE2eeDevice } from "@/lib/e2ee/login-device";
import type { StoredDevice } from "@/lib/e2ee/records";
import { getDefaultE2eeStorage } from "@/lib/e2ee/storage";
import { isOldSuiteDevice } from "@/lib/e2ee/suite-retirement";
import { MlsClient } from "@/lib/e2ee/mls-adapter";
import { loadDefaultWasm } from "@/lib/e2ee/wasm-loader";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  appGrantTimes,
  buildAppGrantTypedData,
  computeAppGrantId,
} from "./app-grant";
import { appGrantToRequest } from "./app-grant-request";
import {
  installSharedDeviceKey,
  readUsableDeviceGrant,
} from "./device-key-store";
import { isEd25519Supported } from "./ed25519";
import { DEFAULT_DEVICE_SCOPES } from "./grant-message";
import {
  openConnectionSetup,
  sealConnectionSetup,
  type ConnectionSetupBundle,
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
      mls: { deviceKeyHex: mls.deviceKey(), ciphersuites: E2EE_GRANT_SUITES },
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
    state = mls.exportState();
    return await sealConnectionSetup(
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
            version: 2,
            ciphersuite: E2EE_GRANT_SUITES[0] ?? 0,
            ciphersuites: [...E2EE_GRANT_SUITES],
          },
        },
      },
      input.target
    );
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

/** The app grant id of the setup's terms (v1 or v2, D172). */
function setupGrantId(
  terms: ConnectionSetupBundle["request"]["grant"]
): string {
  const v2 = terms.version === 2;
  return computeAppGrantId(
    buildAppGrantTypedData({
      wallet: terms.wallet,
      deviceKeyHex: terms.device_key,
      scopes: terms.scopes,
      ...(v2 ? {} : { version: 1 as const }),
      mls: {
        deviceKeyHex: terms.mls_device_key,
        ciphersuites: v2 ? (terms.ciphersuites ?? []) : [terms.ciphersuite],
      },
      issuedAtSeconds: terms.issued_at,
      expiresAtSeconds: terms.expires_at,
      origin: terms.origin,
    }).message
  );
}

export type ConnectionDeviceSetupStage =
  | "open-envelope"
  | "resolve-profile"
  | "load-keys"
  | "read-local-device"
  | "register-grant"
  | "adopt-encryption"
  | "save-signing-key";

export type ConnectionDeviceSetupOutcome =
  | "reused"
  | "legacy-device"
  | "pending-enrollment";

function reusedDeviceOutcome(stored: StoredDevice | null) {
  return isOldSuiteDevice(stored) ? "legacy-device" : "reused";
}

/** Imports target-bound keys and registers the grant from the receiving app. */
export async function acceptConnectionDeviceSetup(input: {
  readonly envelope: string;
  readonly secret: string;
  readonly wallet: string;
  readonly accessToken: string;
  readonly target: ConnectionSetupTarget;
  readonly onStage?: (stage: ConnectionDeviceSetupStage) => void;
}): Promise<ConnectionDeviceSetupOutcome> {
  input.onStage?.("open-envelope");
  const bundle = await openConnectionSetup(
    input.envelope,
    input.secret,
    input.wallet,
    input.target
  );
  input.onStage?.("resolve-profile");
  const identity = await commonApiFetch<ApiIdentity>({
    endpoint: `identities/${encodeURIComponent(input.wallet)}`,
    includeWalletAuth: false,
  });
  const terms = bundle.request.grant;
  if (
    identity.id !== bundle.profileId ||
    terms.wallet !== input.wallet.toLowerCase() ||
    terms.expires_at * 1000 <= Date.now() + 60000
  )
    throw new Error("Device setup grant mismatch");
  input.onStage?.("load-keys");
  const pair = (await isEd25519Supported())
    ? await importSigningPair(bundle.privateKey, terms.device_key)
    : null;
  const grantId = setupGrantId(terms);
  const state = base64ToBytes(bundle.mlsState);
  const device = await createLoginE2eeDevice({ state });
  state.fill(0);
  try {
    if (device.deviceKeyHex !== terms.mls_device_key)
      throw new Error("Device setup encryption key mismatch");
    // A share for the current suite can upgrade the receiver even if signing is already enabled.
    const canUpgradeSuite =
      terms.version === 2 && terms.ciphersuites?.includes(E2EE_CIPHERSUITE);
    /** Keeps a registered device unless this share can upgrade its legacy suite. */
    const canReuseDevice = (stored: StoredDevice | null) =>
      stored?.registered === true &&
      (!canUpgradeSuite || !isOldSuiteDevice(stored));
    input.onStage?.("read-local-device");
    const storage = getDefaultE2eeStorage();
    const existing = await storage.getDevice(identity.id);
    if (
      canReuseDevice(existing) &&
      (!pair || (await readUsableDeviceGrant(input.wallet, Date.now())))
    )
      return reusedDeviceOutcome(existing);

    input.onStage?.("register-grant");
    const grant = await commonApiPost<typeof bundle.request, ApiDeviceGrant>({
      endpoint: "device-grants",
      body: bundle.request,
      includeWalletAuth: false,
      headers: { Authorization: `Bearer ${input.accessToken}` },
    });
    if (
      grant.id !== grantId ||
      grant.wallet.toLowerCase() !== terms.wallet ||
      grant.device_key !== terms.device_key ||
      grant.revoked_at !== null ||
      grant.expires_at <= Date.now() + 60000
    )
      throw new Error("Device setup grant mismatch");
    let outcome: ConnectionDeviceSetupOutcome = "pending-enrollment";
    try {
      input.onStage?.("adopt-encryption");
      const adopted = await device.adopt({
        profileId: identity.id,
        wallet: input.wallet,
        grantId,
        walletSignature: bundle.request.wallet_signature,
        origin: bundle.request.grant.origin,
        issuedAtSeconds: bundle.request.grant.issued_at,
        expiresAtSeconds: bundle.request.grant.expires_at,
        platform: input.target === "desktop" ? "desktop" : "phone",
      });
      if (!adopted) {
        const current = await storage.getDevice(identity.id);
        if (!canReuseDevice(current))
          throw new Error("Device setup could not be saved");
        outcome = reusedDeviceOutcome(current);
      }
      if (pair) {
        input.onStage?.("save-signing-key");
        await installSharedDeviceKey({
          address: input.wallet.toLowerCase(),
          publicKeyHex: grant.device_key,
          keyPair: pair,
          grant,
          ownProfileId: identity.id,
          lastSeq: 0,
        });
      }
    } catch (error) {
      await commonApiPost({
        endpoint: `device-grants/${grant.id}/revoke`,
        body: {},
        includeWalletAuth: false,
        headers: { Authorization: `Bearer ${input.accessToken}` },
      }).catch(() => undefined);
      throw error;
    }
    if (outcome !== "pending-enrollment") return outcome;
    setE2eeEnrollmentMarker(identity.id, true);
    if (typeof globalThis.dispatchEvent === "function")
      globalThis.dispatchEvent(new Event("storage"));
    return outcome;
  } finally {
    device.dispose();
  }
}
