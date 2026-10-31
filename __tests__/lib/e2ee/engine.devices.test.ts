/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Multiple devices.
 */
import {
  addDevice,
  addUser,
  createWorld,
  notices,
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
