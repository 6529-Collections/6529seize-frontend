/**
 * @jest-environment node
 */
import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";
import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import type { EngineContext } from "@/lib/e2ee/engine/context";
import { DeviceDirectory } from "@/lib/e2ee/engine/directory";
import { isTrustedOwnRevoker } from "@/lib/e2ee/engine/trust";
import {
  buildGrant,
  buildGrantTypedData,
  computeGrantId,
} from "@/lib/e2ee/grant";

/** viem's overloads do not take the grant v1 | v2 typed-data union (D172). */
const signTyped = (signer: PrivateKeyAccount, typedData: unknown) =>
  signer.signTypedData(
    typedData as Parameters<PrivateKeyAccount["signTypedData"]>[0]
  );

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
  const signature = await signTyped(account, buildGrantTypedData(grant));
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
  pinnedWallet: (profileId: string, wallet: string) => boolean | null,
  signatureVerifies = true
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
    verifyEd25519: () => signatureVerifies,
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

describe("E2EE: this device's own revocation", () => {
  it("never takes the listed owner alone, even before anything is pinned", async () => {
    const { directory, revoked } = await revokedBy(() => null);
    expect(await directory.revocationState(revoked)).toBe("verified");
    expect(await directory.ownRevocationVerified(revoked, () => false)).toBe(
      false
    );
  });

  it("counts a revoker of the same profile it trusts, with a grant that verifies", async () => {
    const { directory, revoked, revoker } = await revokedBy(() => null);
    const isTrusted = jest.fn(
      (record: ApiE2eeDevice) => record.device_key === revoker.record.device_key
    );
    expect(await directory.ownRevocationVerified(revoked, isTrusted)).toBe(
      true
    );
    revoker.record.profile_id = "mallory";
    expect(await directory.ownRevocationVerified(revoked, isTrusted)).toBe(
      false
    );
  });

  it("refuses a revocation whose signature does not verify or that is not there", async () => {
    const target = await signedDevice(key(3), "bob");
    const directory = new DeviceDirectory({
      api: {} as E2eeApiClient,
      now: () => NOW_MS,
      verifyEd25519: () => false,
    });
    const selfRevoked: ApiE2eeDevice = {
      ...target.record,
      revoked_at: NOW_MS - 60_000,
      revocation: {
        revoker_device_key: key(3),
        revoked_at: NOW_SECONDS - 60,
        signature: "0xsig",
      },
    };
    expect(await directory.ownRevocationVerified(selfRevoked, () => true)).toBe(
      false
    );
    // The server's revoked_at alone (no signed revocation).
    expect(
      await directory.ownRevocationVerified(
        { ...target.record, revoked_at: NOW_MS - 60_000 },
        () => true
      )
    ).toBe(false);
  });

  it("counts the device's own signed revocation", async () => {
    const target = await signedDevice(key(4), "bob");
    const directory = new DeviceDirectory({
      api: {} as E2eeApiClient,
      now: () => NOW_MS,
      verifyEd25519: () => true,
    });
    const selfRevoked: ApiE2eeDevice = {
      ...target.record,
      revoked_at: NOW_MS - 60_000,
      revocation: {
        revoker_device_key: key(4),
        revoked_at: NOW_SECONDS - 60,
        signature: "0xsig",
      },
    };
    expect(
      await directory.ownRevocationVerified(selfRevoked, () => false)
    ).toBe(true);
  });
});

describe("E2EE: own revocation by a device of an own-profile pin from before", () => {
  /** This device's trust as an earlier build stored it (no ownWallets). */
  const legacyCtx = (pinned: string): EngineContext =>
    ({
      profileId: "bob",
      device: {
        profileId: "bob",
        deviceKey: key(1),
        wallet: `0x${"0f".repeat(20)}`,
        trust: { wallets: { bob: [pinned] }, approved: [], ignored: [] },
      },
    }) as unknown as EngineContext;

  it("counts it when the signature and the revoker's grant verify", async () => {
    const { directory, revoked, revoker } = await revokedBy(() => null);
    const ctx = legacyCtx(revoker.wallet);
    expect(
      await directory.ownRevocationVerified(revoked, (record) =>
        isTrustedOwnRevoker(ctx, record)
      )
    ).toBe(true);
  });

  it("refuses it from a device the user chose to ignore", async () => {
    const { directory, revoked, revoker } = await revokedBy(() => null);
    const ctx = legacyCtx(revoker.wallet);
    ctx.device!.trust!.ignored = [key(2)];
    expect(
      await directory.ownRevocationVerified(revoked, (record) =>
        isTrustedOwnRevoker(ctx, record)
      )
    ).toBe(false);
  });

  it("refuses it when the signature does not verify", async () => {
    const { directory, revoked, revoker } = await revokedBy(() => null, false);
    const ctx = legacyCtx(revoker.wallet);
    expect(
      await directory.ownRevocationVerified(revoked, (record) =>
        isTrustedOwnRevoker(ctx, record)
      )
    ).toBe(false);
  });
});
