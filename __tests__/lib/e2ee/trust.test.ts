/**
 * @jest-environment node
 */
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import type { EngineContext } from "@/lib/e2ee/engine/context";
import type { ClaimedPackage } from "@/lib/e2ee/engine/claims";
import {
  approveDevice,
  classifyDevice,
  deviceTrust,
  hasPinnedWallets,
  ignoreUntrustedDevice,
  isIgnoredDevice,
  isPinnedWallet,
  isTrustedMemberDevice,
  isTrustedOwnRevoker,
  isTrustedWallet,
  ownDeviceNeedsApproval,
  pinFirstSighting,
  trustedPackages,
  withOwnWallet,
} from "@/lib/e2ee/engine/trust";
import type { GrantVerification } from "@/lib/e2ee/grant";
import type { StoredDevice } from "@/lib/e2ee/records";
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";

const OWN = "alice";
const OWN_WALLET = `0x${"a1".repeat(20)}`;
const WALLET_A = `0x${"aa".repeat(20)}`;
const WALLET_B = `0x${"bb".repeat(20)}`;
const SAFE = `0x${"5a".repeat(20)}`;

const VERIFIED: GrantVerification = {
  ok: true,
  verified: true,
  via: "eoa",
  reason: null,
};
const SERVER_ONLY: GrantVerification = {
  ok: true,
  verified: false,
  via: "server",
  reason: null,
};

const key = (n: number) => `0x${n.toString(16).padStart(64, "0")}`;

const device = (
  deviceKey: string,
  wallet: string,
  profileId = "bob"
): ApiE2eeDevice =>
  ({
    device_key: deviceKey,
    profile_id: profileId,
    grant: { wallet },
    grant_id: `0x${"00".repeat(32)}`,
    revoked_at: null,
  }) as unknown as ApiE2eeDevice;

const pkg = (record: ApiE2eeDevice): ClaimedPackage => ({
  keyPackage: "kp",
  device: record,
});

function fakeCtx(verifications: Map<string, GrantVerification>) {
  const storage = createMemoryE2eeStorage();
  const resetRevocations = jest.fn();
  const ownDevice = {
    profileId: OWN,
    deviceKey: key(999),
    wallet: OWN_WALLET,
  } as StoredDevice;
  const ctx = {
    profileId: OWN,
    device: ownDevice,
    mls: null,
    storage,
    // persist() serialises writes and versions them (single-tab engine).
    persistChain: Promise.resolve(),
    stateVersion: 0,
    disposed: false,
    options: {},
    store: { touch: jest.fn(), devices: [] },
    directory: {
      verify: async (record: ApiE2eeDevice) =>
        verifications.get(record.device_key) ?? VERIFIED,
      resetRevocations,
    },
  } as unknown as EngineContext;
  return { ctx, storage, resetRevocations };
}

describe("E2EE device trust (trust on first use)", () => {
  it("classifies approved, unverified, pinned and new-wallet devices", () => {
    expect(
      classifyDevice({ approved: true, verified: false, pinned: false })
    ).toBe("trusted");
    expect(
      classifyDevice({ approved: false, verified: false, pinned: true })
    ).toBe("unverified");
    expect(
      classifyDevice({ approved: false, verified: true, pinned: true })
    ).toBe("trusted");
    expect(
      classifyDevice({ approved: false, verified: true, pinned: false })
    ).toBe("new-wallet");
  });

  it("pins on first sighting, then keeps only devices signed by a pinned wallet", async () => {
    const { ctx, storage } = fakeCtx(new Map());
    const first = await trustedPackages(ctx, [pkg(device(key(1), WALLET_A))]);
    expect(first).toHaveLength(1);
    expect(isPinnedWallet(ctx, "bob", WALLET_A)).toBe(true);

    // A later device of bob signed by the pinned wallet is auto-added; one
    // signed by a new wallet (a ghost the server listed under bob) is not.
    const pinned = device(key(2), WALLET_A);
    const ghost = device(key(3), WALLET_B);
    const later = await trustedPackages(ctx, [pkg(pinned), pkg(ghost)]);
    expect(later.map((item) => item.device.device_key)).toEqual([key(2)]);
    expect(await deviceTrust(ctx, ghost)).toBe("new-wallet");
    expect(isPinnedWallet(ctx, "bob", WALLET_B)).toBe(false);

    const stored = await storage.getDevice(OWN);
    expect(stored?.trust?.wallets).toEqual({ bob: [WALLET_A] });
  });

  it("never auto-adds a contract-wallet device whose signature was not checked here", async () => {
    const safeDevice = device(key(4), SAFE, "carol");
    const { ctx } = fakeCtx(new Map([[key(4), SERVER_ONLY]]));
    // First sighting: the unverified device neither pins nor gets added.
    expect(await trustedPackages(ctx, [pkg(safeDevice)])).toEqual([]);
    expect(isPinnedWallet(ctx, "carol", SAFE)).toBe(false);
    // Even once the wallet is pinned, an unverified grant needs "Add device".
    await pinFirstSighting(ctx, [{ profileId: "carol", wallet: SAFE }]);
    expect(await deviceTrust(ctx, safeDevice)).toBe("unverified");
  });

  it("Add device pins the wallet and approves the device; Ignore records it", async () => {
    const { ctx, storage, resetRevocations } = fakeCtx(new Map());
    await pinFirstSighting(ctx, [{ profileId: "bob", wallet: WALLET_A }]);
    const ghost = device(key(5), WALLET_B);
    expect(await deviceTrust(ctx, ghost)).toBe("new-wallet");

    await approveDevice(ctx, {
      profileId: "bob",
      deviceKey: key(5),
      wallet: WALLET_B,
    });
    expect(await deviceTrust(ctx, ghost)).toBe("trusted");
    expect(isPinnedWallet(ctx, "bob", WALLET_B)).toBe(true);
    // Revocations are judged against pinned wallets, so they are re-checked.
    expect(resetRevocations).toHaveBeenCalled();

    await ignoreUntrustedDevice(ctx, key(6));
    expect(isIgnoredDevice(ctx, key(6))).toBe(true);
    const stored = await storage.getDevice(OWN);
    expect(stored?.trust).toEqual({
      wallets: { bob: [WALLET_A, WALLET_B] },
      approved: [key(5)],
      ignored: [key(6)],
      ownWallets: [],
    });
  });

  it("keeps at most 16 pinned wallets per person, dropping the oldest", async () => {
    const { ctx } = fakeCtx(new Map());
    const wallet = (n: number) => `0x${n.toString(16).padStart(40, "0")}`;
    await pinFirstSighting(ctx, [{ profileId: "bob", wallet: wallet(0) }]);
    for (let n = 1; n <= 16; n += 1) {
      await approveDevice(ctx, {
        profileId: "bob",
        deviceKey: key(100 + n),
        wallet: wallet(n),
      });
    }
    expect(isPinnedWallet(ctx, "bob", wallet(0))).toBe(false);
    expect(isPinnedWallet(ctx, "bob", wallet(1))).toBe(true);
    expect(isPinnedWallet(ctx, "bob", wallet(16))).toBe(true);
    expect(ctx.device?.trust?.wallets["bob"]).toHaveLength(16);
  });

  it("always counts this device's own wallet for its own profile", async () => {
    const { ctx } = fakeCtx(new Map());
    expect(isPinnedWallet(ctx, OWN, OWN_WALLET)).toBe(true);
    expect(isPinnedWallet(ctx, "bob", OWN_WALLET)).toBe(false);
    expect(await deviceTrust(ctx, device(key(7), WALLET_B, OWN))).toBe(
      "new-wallet"
    );
  });
});

describe("E2EE device trust for the own profile", () => {
  const sibling = (n: number, wallet: string) => device(key(n), wallet, OWN);

  it("never trusts an own device on first sighting; a device signed by this device's wallet is trusted", async () => {
    const { ctx } = fakeCtx(new Map());
    const sameWallet = sibling(10, OWN_WALLET);
    const listed = sibling(11, WALLET_A);
    // A fresh device: nothing pinned for the own profile yet.
    expect(hasPinnedWallets(ctx, OWN)).toBe(false);
    const kept = await trustedPackages(ctx, [pkg(sameWallet), pkg(listed)]);
    expect(kept.map((item) => item.device.device_key)).toEqual([key(10)]);
    expect(isTrustedWallet(ctx, OWN, WALLET_A)).toBe(false);
    // The wallets seen are still pinned, but only to judge revocations.
    expect(isPinnedWallet(ctx, OWN, WALLET_A)).toBe(true);
    expect(await deviceTrust(ctx, listed)).toBe("new-wallet");
    // Records written now carry an (empty) own-wallet list from the start.
    expect(ctx.device?.trust?.ownWallets).toEqual([]);
    // Later sightings change nothing either.
    expect(await trustedPackages(ctx, [pkg(sibling(12, WALLET_A))])).toEqual(
      []
    );
  });

  it("keeps first-sighting trust for other people", async () => {
    const { ctx } = fakeCtx(new Map());
    const kept = await trustedPackages(ctx, [
      pkg(sibling(13, WALLET_A)),
      pkg(device(key(14), WALLET_B, "bob")),
    ]);
    expect(kept.map((item) => item.device.device_key)).toEqual([key(14)]);
    expect(isTrustedWallet(ctx, "bob", WALLET_B)).toBe(true);
  });

  it("Add device trusts the wallet for the own profile, so its other devices are added too", async () => {
    const { ctx, storage } = fakeCtx(new Map());
    const laptop = sibling(15, WALLET_A);
    const phone = sibling(16, WALLET_A);
    expect(await deviceTrust(ctx, laptop)).toBe("new-wallet");
    await approveDevice(ctx, {
      profileId: OWN,
      deviceKey: key(15),
      wallet: WALLET_A,
    });
    expect(await deviceTrust(ctx, laptop)).toBe("trusted");
    expect(await deviceTrust(ctx, phone)).toBe("trusted");
    expect(await deviceTrust(ctx, sibling(17, WALLET_B))).toBe("new-wallet");
    expect((await storage.getDevice(OWN))?.trust?.ownWallets).toEqual([
      WALLET_A,
    ]);
    expect(ctx.store.touch).toHaveBeenCalled();
  });

  it("says which own devices need approval and which member devices are trusted", async () => {
    const { ctx } = fakeCtx(new Map());
    const listed = sibling(18, WALLET_A);
    expect(ownDeviceNeedsApproval(ctx, listed, true)).toBe(true);
    expect(ownDeviceNeedsApproval(ctx, sibling(19, OWN_WALLET), true)).toBe(
      false
    );
    // A pinned wallet whose signature was not checked here still asks.
    expect(ownDeviceNeedsApproval(ctx, sibling(20, OWN_WALLET), false)).toBe(
      true
    );
    expect(
      ownDeviceNeedsApproval(ctx, device(key(999), WALLET_A, OWN), true)
    ).toBe(false);

    const member = (profileId: string, n: number, wallet: string | null) => ({
      profileId,
      deviceKey: key(n),
      wallet,
    });
    expect(isTrustedMemberDevice(ctx, member(OWN, 21, OWN_WALLET))).toBe(true);
    expect(isTrustedMemberDevice(ctx, member(OWN, 22, WALLET_A))).toBe(false);
    // Nobody pinned for carol yet: her first sighting is still to come.
    expect(isTrustedMemberDevice(ctx, member("carol", 23, WALLET_B))).toBe(
      true
    );
    expect(
      isTrustedMemberDevice(
        ctx,
        member("carol", 23, WALLET_B),
        new Set([WALLET_A])
      )
    ).toBe(false);
    await pinFirstSighting(ctx, [{ profileId: "carol", wallet: WALLET_A }]);
    expect(isTrustedMemberDevice(ctx, member("carol", 24, WALLET_B))).toBe(
      false
    );
    expect(isTrustedMemberDevice(ctx, member("carol", 25, null))).toBe(false);
  });

  it("accepts only own revokers signed by an own wallet or added explicitly", async () => {
    const { ctx } = fakeCtx(new Map());
    expect(isTrustedOwnRevoker(ctx, sibling(26, OWN_WALLET))).toBe(true);
    expect(isTrustedOwnRevoker(ctx, sibling(27, WALLET_A))).toBe(false);
    expect(isTrustedOwnRevoker(ctx, device(key(28), OWN_WALLET, "bob"))).toBe(
      false
    );
    await approveDevice(ctx, {
      profileId: OWN,
      deviceKey: key(27),
      wallet: WALLET_A,
    });
    expect(isTrustedOwnRevoker(ctx, sibling(27, WALLET_A))).toBe(true);
  });

  it("keeps a wallet this device was signed by as an own wallet", () => {
    expect(withOwnWallet(undefined, WALLET_A, OWN)).toEqual({
      wallets: {},
      approved: [],
      ignored: [],
      ownWallets: [WALLET_A],
    });
    expect(
      withOwnWallet(
        { wallets: {}, approved: [], ignored: [], ownWallets: [WALLET_A] },
        WALLET_B.toUpperCase(),
        OWN
      ).ownWallets
    ).toEqual([WALLET_A, WALLET_B]);
    // A record from before own wallets existed keeps its own-profile pins.
    expect(
      withOwnWallet(
        { wallets: { [OWN]: [WALLET_B] }, approved: [], ignored: [] },
        WALLET_A,
        OWN
      )
    ).toMatchObject({ ownWallets: [WALLET_A], legacyOwnWallets: [WALLET_B] });
  });

  it("accepts a revoker of a wallet pinned for this profile before own wallets existed, and never adds it", async () => {
    const { ctx } = fakeCtx(new Map());
    // As stored by an earlier build: own pins, no ownWallets.
    ctx.device!.trust = {
      wallets: { [OWN]: [OWN_WALLET, WALLET_B] },
      approved: [],
      ignored: [],
    };
    const phone = sibling(29, WALLET_B);
    expect(isTrustedOwnRevoker(ctx, phone)).toBe(true);
    expect(await deviceTrust(ctx, phone)).toBe("new-wallet");
    expect(ownDeviceNeedsApproval(ctx, phone, true)).toBe(true);
    // Written again, the record keeps that snapshot.
    await ignoreUntrustedDevice(ctx, key(30));
    expect(ctx.device?.trust).toMatchObject({
      ownWallets: [],
      legacyOwnWallets: [OWN_WALLET, WALLET_B],
    });
    expect(isTrustedOwnRevoker(ctx, phone)).toBe(true);
  });

  it("never trusts an ignored own device as revoker, whatever its wallet", async () => {
    const { ctx } = fakeCtx(new Map());
    ctx.device!.trust = {
      wallets: { [OWN]: [OWN_WALLET, WALLET_B] },
      approved: [],
      ignored: [],
    };
    const legacy = sibling(32, WALLET_B);
    const sameWallet = sibling(33, OWN_WALLET);
    expect(isTrustedOwnRevoker(ctx, legacy)).toBe(true);
    expect(isTrustedOwnRevoker(ctx, sameWallet)).toBe(true);
    await ignoreUntrustedDevice(ctx, key(32));
    await ignoreUntrustedDevice(ctx, key(33));
    expect(isTrustedOwnRevoker(ctx, legacy)).toBe(false);
    expect(isTrustedOwnRevoker(ctx, sameWallet)).toBe(false);
  });

  it("never treats own-profile pins first-sighted since then as revokers", async () => {
    const { ctx } = fakeCtx(new Map());
    await pinFirstSighting(ctx, [{ profileId: OWN, wallet: WALLET_B }]);
    expect(isPinnedWallet(ctx, OWN, WALLET_B)).toBe(true);
    expect(isTrustedOwnRevoker(ctx, sibling(31, WALLET_B))).toBe(false);
  });
});
