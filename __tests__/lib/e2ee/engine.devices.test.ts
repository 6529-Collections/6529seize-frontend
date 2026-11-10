/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Multiple devices.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  addDevice,
  addUser,
  createWorld,
  notices,
  realSleep,
  settle,
  startDevice,
  stopDevice,
  texts,
} from "./support/harness";

jest.setTimeout(180_000);

const leafKeys = (
  engine: {
    getConversation(
      g: string
    ): { members: { devices: { deviceKey: string }[] }[] } | null;
  },
  g: string
) =>
  (engine.getConversation(g)?.members ?? [])
    .flatMap((m) => m.devices.map((d) => d.deviceKey))
    .sort();

describe("E2EE engine: devices", () => {
  it("adds a second device of the same profile automatically; it receives; one prompt per device", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);

    const bobPhone = await addDevice(world, bob);
    expect(bobPhone.engine.getStatus()).toBe("ready");
    await settle(world);
    // Bob's first device adds its sibling at once (8.4); everyone sees two bob leaves.
    const bobKeys = world.ds
      .devicesOf("bob")
      .map((d) => d.device_key)
      .sort();
    expect(
      leafKeys(alice.primary.engine, g).filter((k) => bobKeys.includes(k))
    ).toEqual(bobKeys);
    expect(bobPhone.engine.getConversation(g)).toMatchObject({
      status: "active",
    });
    expect(notices(alice.primary.engine.getMessages(g))).toContain(
      "device_added"
    );

    await alice.primary.engine.send(g, { text: "to both bob devices" });
    await settle(world);
    expect(texts(bob.primary.engine.getMessages(g))).toEqual([
      "to both bob devices",
    ]);
    expect(texts(bobPhone.engine.getMessages(g))).toEqual([
      "to both bob devices",
    ]);

    // A message from one bob device reaches the other bob device too.
    await bobPhone.engine.send(g, { text: "from the phone" });
    await settle(world);
    expect(texts(bob.primary.engine.getMessages(g))).toContain(
      "from the phone"
    );
    expect(texts(alice.primary.engine.getMessages(g))).toContain(
      "from the phone"
    );

    // Each device signed exactly once.
    expect([
      alice.primary.signCalls,
      bob.primary.signCalls,
      bobPhone.signCalls,
    ]).toEqual([1, 1, 1]);
    expect(bob.primary.engine.getDevices()).toHaveLength(2);
  });

  it("revoking one device from the other removes it from every group", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const bobLaptop = await addDevice(world, bob);
    await settle(world);
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob", "carol"],
      kind: "group",
      name: "Devices",
    });
    await settle(world);
    const laptopKey = bobLaptop.engine.getThisDevice()!.deviceKey;
    expect(leafKeys(carol.primary.engine, g)).toContain(laptopKey);

    await bob.primary.engine.revokeDevice(laptopKey);
    await settle(world);
    for (const engine of [
      alice.primary.engine,
      bob.primary.engine,
      carol.primary.engine,
    ]) {
      expect(leafKeys(engine, g)).not.toContain(laptopKey);
    }
    expect(
      bob.primary.engine.getDevices().find((d) => d.deviceKey === laptopKey)
        ?.revokedAt
    ).not.toBeNull();
    expect(bobLaptop.engine.getStatus()).toBe("needs-enrollment");
    // Revoked by a device of its own wallet: the revocation verifies, so the
    // laptop's local data is removed.
    expect(await bobLaptop.storage.getDevice("bob")).toBeNull();
    expect(await bobLaptop.storage.listGroups("bob")).toEqual([]);

    await carol.primary.engine.send(g, { text: "after revocation" });
    await settle(world);
    expect(texts(bob.primary.engine.getMessages(g))).toEqual([
      "after revocation",
    ]);
  });

  it("a revoked device that missed the WS hint handles it on its next sync", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const laptop = await startDevice(world, "bob", bob.account, {
      noWake: true,
    });
    bob.devices.push(laptop);
    await settle(world);
    await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    const laptopKey = laptop.engine.getThisDevice()!.deviceKey;

    await bob.primary.engine.revokeDevice(laptopKey);
    await expect(laptop.engine.sync()).resolves.toBeUndefined();
    expect(laptop.engine.getStatus()).toBe("needs-enrollment");
  });

  it("keeps a device's data when its revocation does not verify here, and stops it", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await alice.primary.engine.send(g, { text: "kept on this device" });
    await settle(world);
    const { storage } = alice.primary;
    const aliceKey = alice.primary.engine.getThisDevice()!.deviceKey;

    // The server lists a device of another wallet under alice, which revokes
    // her device. Alice's device never added that wallet.
    const other = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [alice.account.address, other.address]);
    const listed = await startDevice(world, "alice", other);
    await settle(world);
    await listed.engine.revokeDevice(aliceKey);
    await settle(world);

    expect(alice.primary.engine.getStatus()).toBe("needs-enrollment");
    expect(alice.primary.engine.getError()).toBe("E2EE_REVOCATION_UNVERIFIED");
    await expect(
      alice.primary.engine.send(g, { text: "not sent" })
    ).rejects.toThrow("E2EE_NOT_READY");
    // Nothing is deleted: key, state, chat and history stay.
    expect(await storage.getDevice("alice")).toMatchObject({
      deviceKey: aliceKey,
      registered: true,
    });
    expect(await storage.getWasmState("alice")).not.toBeNull();
    expect((await storage.listGroups("alice")).map((r) => r.g)).toEqual([g]);
    expect(
      (await storage.listMessages("alice", g)).map((m) => m.text)
    ).toContain("kept on this device");
    expect((await storage.getDevice("alice"))?.revocationUnverified).toBe(true);

    // Stopped means quiet: no sync, poll, enrolment or refresh by itself.
    stopDevice(world, listed);
    const aliceCalls = () =>
      world.ds.state.requests.filter((r) => r.profileId === "alice");
    const statuses: string[] = [];
    alice.primary.engine.subscribe(() => {
      statuses.push(alice.primary.engine.getStatus());
    });
    const before = aliceCalls().length;
    for (let step = 0; step < 4; step += 1) {
      world.clock.advance(11 * 60_000);
      await alice.primary.engine.sync();
      await alice.primary.engine.enrollWithLoginGrant();
      alice.primary.engine.setOpenConversation(g);
      await settle(world);
      await realSleep(50);
      await alice.primary.engine.idle();
    }
    expect(aliceCalls().length).toBe(before);
    expect(statuses.filter((s) => s !== "needs-enrollment")).toEqual([]);

    // Turning on again checks the listing once and stays stopped.
    await expect(alice.primary.engine.enroll()).rejects.toThrow(
      "E2EE_REVOCATION_UNVERIFIED"
    );
    expect(
      aliceCalls()
        .slice(before)
        .map((r) => r.path)
    ).toEqual(["e2ee/me"]);
    expect(alice.primary.engine.getStatus()).toBe("needs-enrollment");
    expect(statuses.filter((s) => s !== "needs-enrollment")).toEqual([]);
    expect(alice.primary.signCalls).toBe(1);

    // A reload stays stopped without contacting the server.
    stopDevice(world, alice.primary);
    const reloadAt = aliceCalls().length;
    const reloaded = await startDevice(world, "alice", alice.account, {
      storage,
      enroll: false,
    });
    world.clock.advance(31 * 60_000);
    await settle(world);
    await reloaded.engine.idle();
    expect(reloaded.engine.getStatus()).toBe("needs-enrollment");
    expect(reloaded.engine.getError()).toBe("E2EE_REVOCATION_UNVERIFIED");
    expect(aliceCalls().length).toBe(reloadAt);
    expect(await storage.getDevice("alice")).not.toBeNull();
    expect(await storage.listGroups("alice")).toHaveLength(1);
  });

  it("resumes a stopped device once the server no longer lists it as revoked", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const { storage } = alice.primary;
    await alice.primary.engine.idle();
    stopDevice(world, alice.primary);
    // As left by an earlier stop on a listing that has since been corrected.
    const stored = (await storage.getDevice("alice"))!;
    await storage.writeBatch("alice", {
      expectedVersion: await storage.getStateVersion("alice"),
      device: { ...stored, revocationUnverified: true },
    });
    const restarted = await startDevice(world, "alice", alice.account, {
      storage,
      enroll: false,
    });
    expect(restarted.engine.getStatus()).toBe("needs-enrollment");
    expect(restarted.engine.getError()).toBe("E2EE_REVOCATION_UNVERIFIED");

    await restarted.engine.enroll();
    expect(restarted.engine.getStatus()).toBe("ready");
    expect(restarted.signCalls).toBe(0);
    expect(
      (await storage.getDevice("alice"))?.revocationUnverified
    ).toBeUndefined();
  });

  it("removes a device's data once the device that revoked it was added here", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const other = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [alice.account.address, other.address]);
    const listed = await startDevice(world, "alice", other);
    await settle(world);
    const listedKey = listed.engine.getThisDevice()!.deviceKey;
    expect(
      alice.primary.engine
        .getDevices()
        .find((device) => device.deviceKey === listedKey)?.needsApproval
    ).toBe(true);
    await alice.primary.engine.trustDevice(listedKey);

    await listed.engine.revokeDevice(
      alice.primary.engine.getThisDevice()!.deviceKey
    );
    await settle(world);
    expect(alice.primary.engine.getStatus()).toBe("needs-enrollment");
    expect(alice.primary.engine.getError()).toBeNull();
    expect(await alice.primary.storage.getDevice("alice")).toBeNull();
  });

  it("does not remove a member device the server cannot find", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob", "carol"],
      kind: "group",
      name: "Lookups",
    });
    await settle(world);
    const carolKey = carol.primary.engine.getThisDevice()!.deviceKey;
    expect(leafKeys(alice.primary.engine, g)).toContain(carolKey);

    world.ds.addFault({
      method: "GET",
      path: new RegExp(`^e2ee/devices/${carolKey}$`, "u"),
      status: 404,
      code: "E2EE_NOT_FOUND",
      times: -1,
    });
    // Past the device cache and the 10-minute maintenance interval.
    world.clock.advance(11 * 60_000);
    await settle(world);
    const lookups = world.ds.state.requests.filter(
      (r) => r.path === `e2ee/devices/${carolKey}` && r.status === 404
    );
    expect(lookups.length).toBeGreaterThan(0);
    for (const engine of [alice.primary.engine, bob.primary.engine]) {
      expect(leafKeys(engine, g)).toContain(carolKey);
    }
    world.ds.clearFaults();
    await alice.primary.engine.send(g, { text: "still three of us" });
    await settle(world);
    expect(texts(carol.primary.engine.getMessages(g))).toEqual([
      "still three of us",
    ]);
  });

  it("lost device: a new enrollment is re-added and the old one is revoked", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    await addUser(world, "carol");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob", "carol"],
      kind: "group",
      name: "Lost",
    });
    const dm = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    const lostKey = bob.primary.engine.getThisDevice()!.deviceKey;
    stopDevice(world, bob.primary);

    // Bob enrolls a fresh browser (new storage, same wallet).
    const fresh = await startDevice(world, "bob", bob.account);
    bob.devices.push(fresh);
    expect(fresh.signCalls).toBe(1);
    await settle(world);
    for (const conversation of [g, dm]) {
      expect(fresh.engine.getConversation(conversation)).toMatchObject({
        status: "active",
      });
    }

    await fresh.engine.revokeDevice(lostKey);
    await settle(world);
    for (const conversation of [g, dm]) {
      expect(leafKeys(alice.primary.engine, conversation)).not.toContain(
        lostKey
      );
      expect(leafKeys(alice.primary.engine, conversation)).toContain(
        fresh.engine.getThisDevice()!.deviceKey
      );
    }
    await alice.primary.engine.send(g, { text: "welcome back" });
    await alice.primary.engine.send(dm, { text: "dm welcome back" });
    await settle(world);
    expect(texts(fresh.engine.getMessages(g))).toEqual(["welcome back"]);
    expect(texts(fresh.engine.getMessages(dm))).toEqual(["dm welcome back"]);
  });
});
