/**
 * @jest-environment node
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import { DeviceDirectory } from "@/lib/e2ee/engine/directory";
import {
  buildGrant,
  buildGrantTypedData,
  computeGrantId,
} from "@/lib/e2ee/grant";

const NOW_SECONDS = 1_790_000_000;
const NOW_MS = NOW_SECONDS * 1000;

const key = (n: number) => `0x${n.toString(16).padStart(64, "0")}`;

async function signedDevice(
  deviceKey: string,
  profileId: string
): Promise<{ record: ApiE2eeDevice; wallet: string }> {
  const account = privateKeyToAccount(generatePrivateKey());
  const grant = buildGrant({
    wallet: account.address,
    deviceKey,
    issuedAtSeconds: NOW_SECONDS - 3600,
    origin: "6529.io",
  });
  const signature = await account.signTypedData(buildGrantTypedData(grant));
  return {
    wallet: account.address.toLowerCase(),
    record: {
      device_key: deviceKey,
      profile_id: profileId,
      grant,
      grant_id: computeGrantId(grant),
      wallet_signature: signature,
      verified_via: "eoa",
      label: "Device",
      platform: "web",
      created_at: NOW_MS - 3_600_000,
      last_seen_at: null,
      revoked_at: null,
      revocation: null,
    },
  };
}

/** Bob's real device revoked by another device the server lists under bob. */
async function revokedBy(
  pinnedWallet: (profileId: string, wallet: string) => boolean | null
) {
  const target = await signedDevice(key(1), "bob");
  const revoker = await signedDevice(key(2), "bob");
  const revoked: ApiE2eeDevice = {
    ...target.record,
    revoked_at: NOW_MS - 60_000,
    revocation: {
      revoker_device_key: key(2),
      revoked_at: NOW_SECONDS - 60,
      signature: "0xsig",
    },
  };
  const api = {
    getDevice: jest.fn(async () => revoker.record),
  } as unknown as E2eeApiClient;
  const directory = new DeviceDirectory({
    api,
    now: () => NOW_MS,
    verifyEd25519: () => true,
    pinnedWallet,
  });
  return { directory, revoked, revoker };
}

describe("E2EE device revocations and pinned wallets", () => {
  it("does not count a revocation signed by a device of an unpinned wallet", async () => {
    const { directory, revoked } = await revokedBy(() => false);
    expect(await directory.revocationState(revoked)).toBe("unverified");
  });

  it("counts a revocation by a verified device whose wallet is pinned", async () => {
    let revokerWallet = "";
    const { directory, revoked, revoker } = await revokedBy(
      (_profileId, wallet) => wallet.toLowerCase() === revokerWallet
    );
    revokerWallet = revoker.wallet;
    expect(await directory.revocationState(revoked)).toBe("verified");
  });

  it("re-judges revocations once the pinned wallets change", async () => {
    let pinned = false;
    const { directory, revoked } = await revokedBy(() => pinned);
    expect(await directory.revocationState(revoked)).toBe("unverified");
    pinned = true;
    // Cached until the trust record changes.
    expect(await directory.revocationState(revoked)).toBe("unverified");
    directory.resetRevocations();
    expect(await directory.revocationState(revoked)).toBe("verified");
  });

  it("keeps the listed owner as the rule before anything is pinned", async () => {
    const { directory, revoked } = await revokedBy(() => null);
    expect(await directory.revocationState(revoked)).toBe("verified");
  });

  it("never counts a revoker listed under another profile", async () => {
    const { directory, revoked, revoker } = await revokedBy(() => true);
    revoker.record.profile_id = "mallory";
    expect(await directory.revocationState(revoked)).toBe("unverified");
  });
});
