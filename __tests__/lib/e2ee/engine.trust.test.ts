/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. A compromised
 * server lists a device signed by another wallet under a member (a "ghost").
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { E2eeEngineExt } from "@/lib/e2ee/types";
import {
  addDevice,
  addUser,
  createWorld,
  settle,
  startDevice,
} from "./support/harness";

jest.setTimeout(180_000);

const leafKeys = (engine: E2eeEngineExt, g: string): string[] =>
  (engine.getConversation(g)?.members ?? []).flatMap((member) =>
    member.devices.map((device) => device.deviceKey)
  );

/** device_added notices in timeline order: wallets and the unverified mark. */
const deviceNotices = (engine: E2eeEngineExt, g: string) =>
  engine
    .getMessages(g)
    .filter((m) => m.notice?.type === "device_added")
    .map((m) => ({
      detail: m.notice?.detail,
      unverified: m.notice?.unverified === true,
    }));

/** device key -> walletPinned for one member, as the roster shows it. */
const pinnedFlags = (
  engine: E2eeEngineExt,
  g: string,
  profileId: string
): Record<string, boolean | undefined> =>
  Object.fromEntries(
    (
      engine.getConversation(g)?.members.find((m) => m.profileId === profileId)
        ?.devices ?? []
    ).map((device) => [device.deviceKey, device.walletPinned])
  );

describe("E2EE engine: device trust on first use", () => {
  it("auto-adds pinned-wallet devices; a new-wallet device waits for Add device", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);

    // Same wallet as bob's first device: pinned, so it is added automatically.
    const bobPhone = await addDevice(world, bob);
    await settle(world);
    const phoneKey = bobPhone.engine.getThisDevice()?.deviceKey ?? "";
    expect(leafKeys(alice.primary.engine, g)).toContain(phoneKey);

    // The server lets another wallet enroll a device under bob.
    const ghostWallet = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("bob", [bob.account.address, ghostWallet.address]);
    const ghost = await startDevice(world, "bob", ghostWallet);
    await settle(world);
    const ghostKey = ghost.engine.getThisDevice()?.deviceKey ?? "";
    expect(ghostKey).not.toBe("");

    // Nobody adds it: not alice, not bob's own devices.
    for (const device of [alice.primary, bob.primary, bobPhone]) {
      expect(leafKeys(device.engine, g)).not.toContain(ghostKey);
    }
    expect(ghost.engine.getConversation(g)).toBeNull();
    expect(alice.primary.engine.getConversation(g)?.untrustedDevices).toEqual([
      {
        profileId: "bob",
        deviceKey: ghostKey,
        wallet: ghostWallet.address.toLowerCase(),
        reason: "new-wallet",
      },
    ]);

    // "Add device" pins the wallet for bob and adds the device.
    await alice.primary.engine.trustDevice(ghostKey);
    await settle(world);
    expect(leafKeys(alice.primary.engine, g)).toContain(ghostKey);
    expect(alice.primary.engine.getConversation(g)?.untrustedDevices).toEqual(
      []
    );
    const walletNotices = alice.primary.engine
      .getMessages(g)
      .filter((m) => m.notice?.type === "device_added")
      .map((m) => m.notice?.detail);
    expect(walletNotices).toContain(ghostWallet.address.toLowerCase());
    expect(walletNotices).toContain(bob.account.address.toLowerCase());
    // Alice verified both of bob's added devices for him.
    const ghostNotice = {
      detail: ghostWallet.address.toLowerCase(),
      unverified: true,
    };
    const phoneNotice = {
      detail: bob.account.address.toLowerCase(),
      unverified: false,
    };
    expect(
      deviceNotices(alice.primary.engine, g).filter((n) => n.unverified)
    ).toEqual([]);
    expect(pinnedFlags(alice.primary.engine, g, "bob")).toEqual({
      [phoneKey]: true,
      [ghostKey]: true,
      [bob.primary.engine.getThisDevice()?.deviceKey ?? ""]: true,
    });

    // Bob's devices never added that wallet for bob: alice's commit is
    // accepted as before, and they say plainly it is not verified for him.
    expect(deviceNotices(bob.primary.engine, g)).toEqual(
      expect.arrayContaining([phoneNotice, ghostNotice])
    );
    expect(deviceNotices(bobPhone.engine, g)).toContainEqual(ghostNotice);
    for (const device of [bob.primary, bobPhone]) {
      expect(pinnedFlags(device.engine, g, "bob")).toEqual({
        [phoneKey]: true,
        [ghostKey]: false,
        [bob.primary.engine.getThisDevice()?.deviceKey ?? ""]: true,
      });
      expect(Object.values(pinnedFlags(device.engine, g, "alice"))).toEqual([
        true,
      ]);
    }
    // Not added on bob's devices is no reason to remove a member device.
    world.clock.advance(11 * 60_000);
    await settle(world);
    for (const device of [alice.primary, bob.primary, bobPhone]) {
      expect(leafKeys(device.engine, g)).toContain(ghostKey);
    }
  });

  it("a fresh device adds own devices of its wallet; one of another wallet waits for Add device", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "bob");
    const primaryKey = alice.primary.engine.getThisDevice()?.deviceKey ?? "";
    // Alice also signs with a second wallet of her profile on a new browser.
    const second = privateKeyToAccount(generatePrivateKey());
    const primaryWallet = alice.account.address.toLowerCase();
    world.ds.setWallets("alice", [alice.account.address, second.address]);
    const fresh = await startDevice(world, "alice", second);
    const twin = await startDevice(world, "alice", second);
    await settle(world);
    const twinKey = twin.engine.getThisDevice()?.deviceKey ?? "";

    // The listing alone trusts nothing: the other wallet's device needs approval.
    expect(
      fresh.engine.getDevices().find((d) => d.deviceKey === primaryKey)
    ).toMatchObject({ needsApproval: true, wallet: primaryWallet });
    expect(
      fresh.engine.getDevices().find((d) => d.deviceKey === twinKey)
    ).toMatchObject({ needsApproval: false });

    const g = await fresh.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    expect(leafKeys(fresh.engine, g)).toContain(twinKey);
    expect(leafKeys(fresh.engine, g)).not.toContain(primaryKey);
    expect(alice.primary.engine.getConversation(g)).toBeNull();
    expect(fresh.engine.getConversation(g)?.untrustedDevices).toEqual([
      {
        profileId: "alice",
        deviceKey: primaryKey,
        wallet: primaryWallet,
        reason: "new-wallet",
      },
    ]);

    // "Add device" trusts that wallet for alice and adds the device.
    await fresh.engine.trustDevice(primaryKey);
    await settle(world);
    expect(leafKeys(fresh.engine, g)).toContain(primaryKey);
    expect(fresh.engine.getConversation(g)?.untrustedDevices).toEqual([]);
    expect(
      fresh.engine.getDevices().find((d) => d.deviceKey === primaryKey)
    ).toMatchObject({ needsApproval: false });
    expect(alice.primary.engine.getConversation(g)?.status).toBe("active");
  });

  it("the device list approves an own device before any chat exists", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "bob");
    const primaryKey = alice.primary.engine.getThisDevice()?.deviceKey ?? "";
    const second = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [alice.account.address, second.address]);
    const fresh = await startDevice(world, "alice", second);
    await settle(world);
    expect(
      fresh.engine.getDevices().find((d) => d.deviceKey === primaryKey)
        ?.needsApproval
    ).toBe(true);

    await fresh.engine.trustDevice(primaryKey);
    expect(
      fresh.engine.getDevices().find((d) => d.deviceKey === primaryKey)
        ?.needsApproval
    ).toBe(false);
    const g = await fresh.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    expect(leafKeys(fresh.engine, g)).toContain(primaryKey);
    expect(fresh.engine.getConversation(g)?.untrustedDevices).toEqual([]);
  });

  it("Ignore keeps a new-wallet device out and clears its notice", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);

    const ghostWallet = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("bob", [bob.account.address, ghostWallet.address]);
    const ghost = await startDevice(world, "bob", ghostWallet);
    await settle(world);
    const ghostKey = ghost.engine.getThisDevice()?.deviceKey ?? "";
    expect(
      alice.primary.engine.getConversation(g)?.untrustedDevices
    ).toHaveLength(1);

    await alice.primary.engine.ignoreDevice(ghostKey);
    await alice.primary.engine.sync();
    await settle(world);
    expect(alice.primary.engine.getConversation(g)?.untrustedDevices).toEqual(
      []
    );
    expect(leafKeys(alice.primary.engine, g)).not.toContain(ghostKey);
  });
});
