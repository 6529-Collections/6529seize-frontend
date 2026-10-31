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
  ignoreUntrustedDevice,
  isIgnoredDevice,
  isPinnedWallet,
  pinFirstSighting,
  trustedPackages,
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
