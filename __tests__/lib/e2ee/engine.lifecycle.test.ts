/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Device limit and
 * grant renewal (8.8).
 */
import {
  addDevice,
  addUser,
  createWorld,
  settle,
  startDevice,
  texts,
} from "./support/harness";

jest.setTimeout(240_000);

const DAY = 86_400_000;

describe("E2EE engine: lifecycle", () => {
  it("keeps a pool of 30 one-time KeyPackages and rotates the last-resort one", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const key = alice.primary.engine.getThisDevice()!.deviceKey;
    const pool = () => world.ds.state["keyPackages"].get(key);
    expect(pool().oneTime).toHaveLength(30);
    const firstLastResort = pool().lastResort.data;

    // Claims drain the pool below 10; the next refresh refills it to 30.
    for (let index = 0; index < 25; index += 1) {
      pool().oneTime.shift();
    }
    world.clock.advance(11 * 60_000);
    await settle(world);
    expect(pool().oneTime.length).toBe(30);

    // After 30 days the last-resort package rotates and the expired
    // one-time packages are replaced. (OpenMLS stamps lifetimes from the real
    // clock, so expiry is not compared against the virtual clock here.)
    const uploads = () =>
      world.ds.state.requests.filter(
        (r) => r.path.endsWith("/key-packages") && r.status === 200
      ).length;
    const before = uploads();
    world.clock.advance(31 * DAY);
    await settle(world);
    expect(uploads()).toBeGreaterThanOrEqual(before + 2);
    expect(pool().lastResort.data).not.toBe(firstLastResort);
  });

  it("stops at the device limit and resumes without a second prompt", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    for (let index = 1; index < 10; index += 1) {
      await addDevice(world, alice);
    }
    const eleventh = await startDevice(world, "alice", alice.account);
    expect(eleventh.engine.getStatus()).toBe("device-limit");
    expect(eleventh.signCalls).toBe(1);

    const victim = alice.devices[9]!;
    await alice.primary.engine.revokeDevice(
      victim.engine.getThisDevice()!.deviceKey
    );
    await eleventh.engine.enroll();
    expect(eleventh.engine.getStatus()).toBe("ready");
    expect(eleventh.signCalls).toBe(1);
  });

  it("drops a device stored under another ciphersuite and enrolls again", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "bob");
    await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    const { storage } = alice.primary;
    const stored = (await storage.getDevice("alice"))!;
    expect(await storage.listGroups("alice")).toHaveLength(1);
    alice.primary.engine.dispose();
    // As left behind by the classical 0x0001 build.
    await storage.writeBatch("alice", {
      device: { ...stored, grant: { ...stored.grant, ciphersuite: 1 } },
    });

    const restarted = await startDevice(world, "alice", alice.account, {
      storage,
      enroll: false,
    });
    expect(restarted.engine.getStatus()).toBe("needs-enrollment");
    expect(await storage.getDevice("alice")).toBeNull();
    expect(await storage.listGroups("alice")).toEqual([]);
    expect(await storage.getWasmState("alice")).toBeNull();

    await restarted.engine.enroll();
    expect(restarted.engine.getStatus()).toBe("ready");
    expect(restarted.signCalls).toBe(1);
    const fresh = (await storage.getDevice("alice"))!;
    expect(fresh.grant.ciphersuite).toBe(0x004f);
    expect(fresh.deviceKey).not.toBe(stored.deviceKey);
    restarted.engine.dispose();
  });

  it("renews grants in their last 14 days and keeps every group working", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "group",
      name: "Renew",
    });
    await settle(world);
    const before = alice.primary.engine.getThisDevice()!.expiresAt;

    // Stay online (self-updates every 14 days) until the renewal window opens.
    for (let day = 0; day < 168; day += 12) {
      world.clock.advance(12 * DAY);
      await settle(world);
    }
    for (const user of [alice, bob]) {
      await user.primary.engine.enroll();
      expect(user.primary.signCalls).toBe(2);
    }
    await settle(world);
    expect(alice.primary.engine.getThisDevice()!.expiresAt).toBeGreaterThan(
      before
    );

    // Past the original expiry: nobody is removed and messages flow.
    for (let step = 0; step < 3; step += 1) {
      world.clock.advance(7 * DAY);
      await settle(world);
    }
    expect(alice.primary.engine.getConversation(g)!.members).toHaveLength(2);
    await bob.primary.engine.send(g, { text: "still here" });
    await settle(world);
    expect(texts(alice.primary.engine.getMessages(g))).toEqual(["still here"]);
  });
});
