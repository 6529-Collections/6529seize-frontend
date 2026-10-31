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
