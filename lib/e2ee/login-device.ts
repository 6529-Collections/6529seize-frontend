import type { ApiE2eeDeviceGrant } from "./api-types";
import { E2EE_CIPHERSUITE } from "./grant";
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
  /** EIP-191 hash of the signed sign-in message; the stored grant's id. */
  readonly grantId: string;
  readonly walletSignature: string;
  /** The SIWE domain the wallet signed for (the page host). */
  readonly origin: string;
  readonly issuedAtSeconds: number;
  readonly expiresAtSeconds: number;
}

export interface PreparedLoginE2eeDevice {
  /** 0x-prefixed lowercase MLS signature key, granted in the challenge. */
  readonly deviceKeyHex: string;
  readonly ciphersuite: number;
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
  const mls = MlsClient.create(wasm);
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
      const existing = await storage.getDevice(input.profileId);
      if (existing?.registered) {
        return false;
      }
      const grant: ApiE2eeDeviceGrant = {
        wallet: input.wallet.toLowerCase(),
        device_key: deviceKeyHex,
        ciphersuite: E2EE_CIPHERSUITE,
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
        platform: "web",
        createdAt: (deps.now ?? Date.now)(),
        lastResortAt: null,
        loginGrantId: input.grantId.toLowerCase(),
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
    ciphersuite: E2EE_CIPHERSUITE,
    adopt,
    dispose: release,
  };
}
