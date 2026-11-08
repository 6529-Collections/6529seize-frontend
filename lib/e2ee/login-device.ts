import type { ApiE2eeDeviceGrant } from "./api-types";
import { E2EE_GRANT_SUITES } from "./grant";
import { isOldSuiteDevice, retireOldSuiteDevice } from "./suite-retirement";
import { MlsClient } from "./mls-adapter";
import type { StoredDevice } from "./records";
import { type E2eeStorage, getDefaultE2eeStorage } from "./storage";
import { loadDefaultWasm } from "./wasm-loader";
import type { WasmModule } from "./wasm-types";

/**
 * NC8: the MLS device key a web sign-in grants together with the signing key,
 * so one wallet signature also enrolls encrypted messages. Loaded with a
 * dynamic import from the sign-in flow only when encrypted messages are on.
 */

export interface LoginE2eeAdoption {
  /** The wallet's own profile (a grant sign-in never requests a proxy role). */
  readonly profileId: string;
  readonly wallet: string;
  /**
   * The stored grant's id: the EIP-191 hash of the signed sign-in message, or
   * the EIP-712 digest of an app grant.
   */
  readonly grantId: string;
  readonly walletSignature: string;
  /** The SIWE domain the wallet signed for (the page host), or the app grant's origin. */
  readonly origin: string;
  readonly issuedAtSeconds: number;
  readonly expiresAtSeconds: number;
  /** The app's platform for an app grant (6529 Mobile or Desktop); "web" by default. */
  readonly platform?: StoredDevice["platform"] | undefined;
}

export interface PreparedLoginE2eeDevice {
  /** 0x-prefixed lowercase MLS signature key, granted in the challenge. */
  readonly deviceKeyHex: string;
  /** The suite set the combined grant (v2) names for this key. */
  readonly ciphersuites: readonly number[];
  /**
   * Hands the key to the engine's storage for the profile once the combined
   * grant is stored; the engine then registers it without a prompt. Keeps an
   * already enrolled device. Never throws; always releases the key handle.
   */
  adopt(input: LoginE2eeAdoption): Promise<boolean>;
  /** Releases the key when the sign-in did not grant it. */
  dispose(): void;
}

interface LoginE2eeDeviceDeps {
  readonly state?: Uint8Array | undefined;
  readonly loadWasm?: (() => Promise<WasmModule>) | undefined;
  readonly storage?: E2eeStorage | undefined;
  readonly now?: (() => number) | undefined;
}

/**
 * Loads (fetches, verifies and instantiates) the default MLS module ahead
 * of a sign-in; the loader keeps it, so createLoginE2eeDevice and the
 * engine then start without the download.
 */
export async function preloadLoginE2eeDevice(): Promise<void> {
  await loadDefaultWasm();
}

export async function createLoginE2eeDevice(
  deps: LoginE2eeDeviceDeps = {}
): Promise<PreparedLoginE2eeDevice> {
  const wasm = await (deps.loadWasm ?? loadDefaultWasm)();
  const mls = deps.state
    ? MlsClient.load(wasm, deps.state)
    : MlsClient.create(wasm);
  const deviceKeyHex = mls.deviceKey();
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      mls.dispose();
    }
  };

  const adopt = async (input: LoginE2eeAdoption): Promise<boolean> => {
    if (released) {
      return false;
    }
    try {
      const storage = deps.storage ?? getDefaultE2eeStorage();
      let existing = await storage.getDevice(input.profileId);
      if (existing && isOldSuiteDevice(existing) && !existing.retired) {
        // An earlier-suite device: retire it keeping its history (D172),
        // so this key can replace it without the engine running first.
        await retireOldSuiteDevice(
          storage,
          input.profileId,
          existing,
          await storage.getStateVersion(input.profileId),
          (deps.now ?? Date.now)()
        );
        existing = await storage.getDevice(input.profileId);
      }
      if (existing?.registered) {
        return false;
      }
      const ciphersuites = [...E2EE_GRANT_SUITES];
      const grant: ApiE2eeDeviceGrant = {
        version: 2,
        wallet: input.wallet.toLowerCase(),
        device_key: deviceKeyHex,
        ciphersuite: ciphersuites[0] ?? 0,
        ciphersuites,
        issued_at: input.issuedAtSeconds,
        expires_at: input.expiresAtSeconds,
        origin: input.origin,
      };
      const device: StoredDevice = {
        profileId: input.profileId,
        deviceKey: deviceKeyHex,
        wallet: grant.wallet,
        grant,
        grantId: input.grantId.toLowerCase(),
        walletSignature: input.walletSignature.toLowerCase(),
        registered: false,
        provisioned: false,
        label: "Device",
        platform: input.platform ?? "web",
        createdAt: (deps.now ?? Date.now)(),
        lastResortAt: null,
        loginGrantId: input.grantId.toLowerCase(),
        ...(existing?.retired && existing.trust
          ? { trust: existing.trust }
          : {}),
      };
      // The key's private half lands with the device record atomically.
      await storage.writeBatch(input.profileId, {
        device,
        wasmState: mls.exportState(),
      });
      return true;
    } catch {
      return false;
    } finally {
      release();
    }
  };

  return {
    deviceKeyHex,
    ciphersuites: [...E2EE_GRANT_SUITES],
    adopt,
    dispose: release,
  };
}
