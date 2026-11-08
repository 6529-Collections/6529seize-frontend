/**
 * @jest-environment node
 *
 * Integration (D172): moving devices from 0x004F to 0x004E keeps history.
 * An earlier-suite device is retired once, its conversations become
 * read-only ("superseded"), one signature enrolls a fresh 0x004E key, and
 * "start again" continues each conversation exactly once. Real OpenMLS
 * WASM, fake delivery service, memory storage.
 */
import { E2EE_CIPHERSUITE } from "@/lib/e2ee/grant";
import { retireOldSuiteDevice } from "@/lib/e2ee/suite-retirement";
import {
  addUser,
  createWorld,
  seedLegacySuiteDevice,
  realSleep,
  settle,
  startDevice,
  stopDevice,
  texts,
  type TestDevice,
  type TestUser,
  type World,
} from "./support/harness";

jest.setTimeout(180_000);

const ids = (device: TestDevice): string[] =>
  device.engine
    .getConversations()
    .map((c) => c.g)
    .sort();

/** Alice and Bob share a DM with history, then both become 0x004F devices. */
async function legacyDm(world: World): Promise<{
  alice: TestUser;
  bob: TestUser;
  old: string;
}> {
  const alice = await addUser(world, "alice");
  const bob = await addUser(world, "bob");
  const old = await alice.primary.engine.createConversation({
    profileIds: ["bob"],
    kind: "dm",
  });
  await settle(world);
  await alice.primary.engine.send(old, { text: "before the upgrade" });
  await settle(world);
  await seedLegacySuiteDevice(world, alice, alice.primary);
  await seedLegacySuiteDevice(world, bob, bob.primary);
  return { alice, bob, old };
}

/**
 * Sends while every send fails, without waiting for the send (it keeps
 * retrying), until the message is in the stored outbox.
 */
async function queueWhileFailing(
  user: TestUser,
  g: string,
  text: string,
  queued = 1
): Promise<void> {
  const sending = user.primary.engine.send(g, { text });
  sending.catch(() => undefined);
  for (let tries = 0; tries < 2_000; tries += 1) {
    const outbox = await user.primary.storage.listOutbox(user.profileId);
    if (outbox.length >= queued) break;
    await realSleep(5);
  }
  expect(await user.primary.storage.listOutbox(user.profileId)).toHaveLength(
    queued
  );
}

async function upgrade(world: World, user: TestUser): Promise<void> {
  const before = user.primary.signCalls;
  await user.primary.engine.enroll();
  expect(user.primary.signCalls - before).toBe(1);
  await settle(world);
}

describe("E2EE engine: moving to 0x004E (D172)", () => {
  let world: World;

  beforeEach(async () => {
    world = await createWorld();
  });

  afterEach(() => {
    for (const device of world.devices) device.engine.dispose();
  });

  it("retires an earlier-suite device keeping history read-only, then enrolls with one signature", async () => {
    const { alice, old } = await legacyDm(world);
    const a = alice.primary.engine;
    const retiredKey = world.ds.devicesOf("alice")[0].device_key;

    expect(a.getStatus()).toBe("needs-enrollment");
    expect(a.getUpgrade()).toEqual({ superseded: 1 });
    expect(a.getConversation(old)).toMatchObject({
      status: "superseded",
      ciphersuite: 0x004f,
      successor: null,
    });
    // Read-only history pages in from storage before the new signature.
    await a.loadHistory?.(old);
    expect(texts(a.getMessages(old))).toEqual(["before the upgrade"]);
    const stored = await alice.primary.storage.getDevice("alice");
    expect(stored).toMatchObject({ retired: true, registered: false });
    expect(await alice.primary.storage.getWasmState("alice")).toBeNull();

    await upgrade(world, alice);
    expect(a.getStatus()).toBe("ready");
    expect(a.getUpgrade()).toBeNull();
    const enrolled = await alice.primary.storage.getDevice("alice");
    expect(enrolled?.retired).toBeUndefined();
    expect(enrolled?.deviceKey).not.toBe(retiredKey);
    expect(enrolled?.grant).toMatchObject({
      version: 2,
      ciphersuite: E2EE_CIPHERSUITE,
      ciphersuites: [E2EE_CIPHERSUITE],
    });
    // History stays readable and read-only after the new key is in place.
    await a.loadHistory?.(old);
    expect(texts(a.getMessages(old))).toEqual(["before the upgrade"]);
    expect(a.getConversation(old)?.status).toBe("superseded");
    await expect(a.send(old, { text: "no" })).rejects.toMatchObject({
      code: "E2EE_SUPERSEDED",
    });
    // The earlier device stays registered until the window closes; groups on
    // 0x004E only ever see the new one.
    expect(world.ds.devicesOf("alice")).toHaveLength(2);
    const listed = await world.ds.handle("GET", "e2ee/profiles/alice/devices", {
      profileId: "bob",
      query: { ciphersuite: String(E2EE_CIPHERSUITE) },
    });
    expect(
      (listed.body as { device_key: string }[]).map((d) => d.device_key)
    ).toEqual([enrolled?.deviceKey]);

    // Starting again on the same storage keeps the new device as it is.
    stopDevice(world, alice.primary);
    const again = await startDevice(world, "alice", alice.account, {
      storage: alice.primary.storage,
      enroll: false,
    });
    expect(again.engine.getStatus()).toBe("ready");
    expect(again.engine.getUpgrade()).toBeNull();
    expect((await again.storage.getDevice("alice"))?.deviceKey).toBe(
      enrolled?.deviceKey
    );
    expect(again.engine.getConversation(old)?.status).toBe("superseded");
  });

  it("continues a superseded DM exactly once, also when called twice in a row", async () => {
    const { alice, bob, old } = await legacyDm(world);
    await upgrade(world, alice);
    await upgrade(world, bob);
    const a = alice.primary.engine;
    const b = bob.primary.engine;

    const fresh = await a.restart(old);
    expect(fresh).not.toBe(old);
    await expect(a.restart(old)).resolves.toBe(fresh);
    expect(ids(alice.primary)).toEqual([fresh, old].sort());
    expect(a.getConversation(old)).toMatchObject({
      status: "superseded",
      successor: fresh,
    });
    expect(a.getConversation(fresh)).toMatchObject({
      status: "active",
      ciphersuite: E2EE_CIPHERSUITE,
      predecessor: old,
    });
    // The link is stored with the new group: a restarted engine keeps it.
    const groups = await alice.primary.storage.listGroups("alice");
    expect(groups.find((g) => g.g === old)?.successor).toBe(fresh);
    expect(groups.find((g) => g.g === old)?.successorPending).toBeUndefined();
    expect(groups.find((g) => g.g === fresh)?.predecessor).toBe(old);

    await settle(world);
    await a.send(fresh, { text: "after the upgrade" });
    await settle(world);
    expect(texts(b.getMessages(fresh))).toEqual(["after the upgrade"]);
    await b.loadHistory?.(old);
    expect(texts(b.getMessages(old))).toEqual(["before the upgrade"]);
    // Bob's "start again" finds the DM Alice already made and links it.
    await expect(b.restart(old)).resolves.toBe(fresh);
    expect(b.getConversation(old)?.successor).toBe(fresh);
    expect(b.getConversation(fresh)?.predecessor).toBe(old);
    expect(ids(bob.primary)).toEqual([fresh, old].sort());
  });

  it("shares one creation between concurrent calls for a group chat", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const old = await alice.primary.engine.createConversation({
      profileIds: ["bob", "carol"],
      kind: "group",
      name: "Team",
    });
    await settle(world);
    for (const user of [alice, bob, carol]) {
      await seedLegacySuiteDevice(world, user, user.primary);
    }
    for (const user of [alice, bob, carol]) {
      await upgrade(world, user);
    }
    const a = alice.primary.engine;
    const created = () =>
      world.ds.state.requests.filter(
        (r) => r.method === "POST" && r.path === "e2ee/groups"
      ).length;
    const before = created();

    const results = await Promise.all([a.restart(old), a.restart(old)]);
    expect(results[0]).toBe(results[1]);
    await expect(a.restart(old)).resolves.toBe(results[0]);
    expect(created() - before).toBe(1);
    expect(ids(alice.primary)).toEqual([results[0], old].sort());
    expect(a.getConversation(results[0] ?? "")).toMatchObject({
      kind: "group",
      name: "Team",
      predecessor: old,
    });
    await settle(world);
    expect(carol.primary.engine.getConversation(results[0] ?? "")?.status).toBe(
      "active"
    );
  });

  it("creates exactly one conversation when a failed start is retried", async () => {
    const { alice, bob, old } = await legacyDm(world);
    await upgrade(world, alice);
    await upgrade(world, bob);
    const a = alice.primary.engine;

    // The server refuses the new group after it was made locally.
    world.ds.addFault({ method: "POST", path: /^e2ee\/groups$/, status: 503 });
    await expect(a.restart(old)).rejects.toBeDefined();
    expect(ids(alice.primary)).toEqual([old]);
    expect(a.getConversation(old)?.successor).toBeNull();
    const stored = await alice.primary.storage.listGroups("alice");
    expect(stored.map((g) => g.g)).toEqual([old]);
    expect(stored[0]?.successor ?? null).toBeNull();

    const fresh = await a.restart(old);
    await expect(a.restart(old)).resolves.toBe(fresh);
    expect(ids(alice.primary)).toEqual([fresh, old].sort());
    expect(a.getConversation(old)?.successor).toBe(fresh);
  });

  it("never hands a second caller a successor whose setup then fails", async () => {
    const { alice, bob, old } = await legacyDm(world);
    await upgrade(world, alice);
    await upgrade(world, bob);
    const a = alice.primary.engine;
    const entries = /^e2ee\/groups\/0x[0-9a-f]+\/entries$/;

    // Pause the commit that adds Bob: the successor is stored, not set up.
    const gate = world.ds.hold(entries);
    const first = a.restart(old);
    first.catch(() => undefined);
    for (let tries = 0; gate.waiting() === 0 && tries < 2_000; tries += 1) {
      await realSleep(5);
    }
    expect(gate.waiting()).toBe(1);
    expect(a.getConversations()).toHaveLength(2);
    expect(a.getConversation(old)?.successor).toBeNull();
    const second = a.restart(old);
    second.catch(() => undefined);

    // The paused addition is then refused: the successor is discarded.
    world.ds.addFault({
      method: "POST",
      path: entries,
      status: 403,
      code: "E2EE_POLICY",
    });
    gate.release();
    await expect(first).rejects.toMatchObject({ code: "E2EE_POLICY" });
    await expect(second).rejects.toMatchObject({ code: "E2EE_POLICY" });
    expect(ids(alice.primary)).toEqual([old]);
    expect(a.getConversation(old)?.successor).toBeNull();
    const stored = await alice.primary.storage.listGroups("alice");
    expect(stored.map((g) => g.g)).toEqual([old]);
    expect(stored[0]?.successor ?? null).toBeNull();
    expect(stored[0]?.successorPending).toBeUndefined();

    const fresh = await a.restart(old);
    await expect(a.restart(old)).resolves.toBe(fresh);
    expect(ids(alice.primary)).toEqual([fresh, old].sort());
    expect(a.getConversation(old)?.successor).toBe(fresh);
  });

  it("confirms a successor left unconfirmed by a stop, without a duplicate DM", async () => {
    const { alice, bob, old } = await legacyDm(world);
    await upgrade(world, alice);
    await upgrade(world, bob);
    const fresh = await alice.primary.engine.restart(old);
    const device = alice.primary;
    await device.engine.idle();
    stopDevice(world, device);
    // As if the engine stopped after storing the group, before confirming.
    const record = (await device.storage.listGroups("alice")).find(
      (g) => g.g === old
    )!;
    await device.storage.writeBatch("alice", {
      expectedVersion: await device.storage.getStateVersion("alice"),
      groups: [{ ...record, successorPending: true }],
    });
    const again = await startDevice(world, "alice", alice.account, {
      storage: device.storage,
      enroll: false,
    });
    expect(again.engine.getConversation(old)?.successor).toBeNull();
    // Not reused as is; the DM with Bob is found and the link confirmed.
    await expect(again.engine.restart(old)).resolves.toBe(fresh);
    expect(again.engine.getConversation(old)?.successor).toBe(fresh);
    expect(ids(again)).toEqual([fresh, old].sort());
  });

  it("keeps a message queued at the move as unsent, and resends it in the upgraded chat", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const old = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    // Every send fails, so the message stays queued; the tab then closes.
    world.ds.addFault({
      method: "POST",
      path: /^e2ee\/groups\/0x[0-9a-f]+\/messages$/,
      status: 503,
      times: -1,
    });
    await queueWhileFailing(alice, old, "typed while offline");
    await seedLegacySuiteDevice(world, alice, alice.primary, {
      waitIdle: false,
    });
    world.ds.clearFaults();
    await seedLegacySuiteDevice(world, bob, bob.primary);
    let a = alice.primary.engine;
    const storage = alice.primary.storage;

    // Retired: the outbox is empty and the message is kept, not pending.
    expect(await storage.listOutbox("alice")).toEqual([]);
    await a.loadHistory?.(old);
    const unsent = a
      .getMessages(old)
      .find((m) => m.text === "typed while offline");
    expect(unsent).toMatchObject({
      pending: false,
      unsent: "suite_upgrade",
      senderProfileId: "alice",
    });
    const stored = await storage.getMessage("alice", old, unsent!.id);
    expect(stored?.unsent).toEqual({
      reason: "suite_upgrade",
      at: expect.any(Number),
    });

    // Retiring again (another tab, a second start) changes nothing. The
    // write moves the state version, so this tab stops and starts again.
    stopDevice(world, alice.primary);
    const before = await storage.listMessages("alice", old);
    const retired = (await storage.getDevice("alice"))!;
    await retireOldSuiteDevice(
      storage,
      "alice",
      retired,
      await storage.getStateVersion("alice"),
      world.clock.now() + 1
    );
    expect(await storage.listMessages("alice", old)).toEqual(before);
    expect(await storage.listOutbox("alice")).toEqual([]);
    const again = await startDevice(world, "alice", alice.account, {
      storage,
      enroll: false,
    });
    alice.devices.push(again);
    alice.primary = again;
    a = again.engine;
    expect(a.getUpgrade()).toEqual({ superseded: 1 });

    await upgrade(world, alice);
    await upgrade(world, bob);
    const [first, second] = await Promise.all([
      a.resendUnsent(old, unsent!.id),
      a.resendUnsent(old, unsent!.id),
    ]);
    expect(second).toEqual(first);
    await expect(a.restart(old)).resolves.toBe(first.g);
    // The resend flushes by itself: delivered once its background work is
    // done, without a sync, a settle or a timer.
    await a.idle();
    expect(
      world.ds.state.requests.some(
        (r) =>
          r.method === "POST" &&
          r.path === `e2ee/groups/${first.g}/messages` &&
          r.status === 200
      )
    ).toBe(true);
    await settle(world);
    const b = bob.primary.engine;
    expect(texts(b.getMessages(first.g))).toEqual(["typed while offline"]);
    // Sent once, and gone from the old chat; it cannot be sent again.
    expect(
      texts(a.getMessages(first.g)).filter((t) => t === "typed while offline")
    ).toHaveLength(1);
    expect(await storage.getMessage("alice", old, unsent!.id)).toBeNull();
    await expect(a.resendUnsent(old, unsent!.id)).rejects.toMatchObject({
      code: "E2EE_NO_MESSAGE",
    });
  });

  it("lets exactly one of a discard and a resend of the same message happen", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const old = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    world.ds.addFault({
      method: "POST",
      path: /^e2ee\/groups\/0x[0-9a-f]+\/messages$/,
      status: 503,
      times: -1,
    });
    await queueWhileFailing(alice, old, "discard wins");
    await queueWhileFailing(alice, old, "resend wins", 2);
    await seedLegacySuiteDevice(world, alice, alice.primary, {
      waitIdle: false,
    });
    world.ds.clearFaults();
    await seedLegacySuiteDevice(world, bob, bob.primary);
    await upgrade(world, alice);
    await upgrade(world, bob);
    const a = alice.primary.engine;
    await a.loadHistory?.(old);
    const unsent = (text: string) =>
      a.getMessages(old).find((m) => m.text === text)!;
    const first = unsent("discard wins");
    const second = unsent("resend wins");
    expect([first.unsent, second.unsent]).toEqual([
      "suite_upgrade",
      "suite_upgrade",
    ]);

    // A discard that starts first: the resend is refused.
    const [discarded, refused] = await Promise.allSettled([
      a.discardUnsent(old, first.id),
      a.resendUnsent(old, first.id),
    ]);
    expect(discarded.status).toBe("fulfilled");
    expect(refused).toMatchObject({
      status: "rejected",
      reason: { code: "E2EE_NO_MESSAGE" },
    });
    // A resend that starts first: the discard waits and has nothing left.
    const [resent, joined] = await Promise.allSettled([
      a.resendUnsent(old, second.id),
      a.discardUnsent(old, second.id),
    ]);
    expect(resent.status).toBe("fulfilled");
    expect(joined.status).toBe("fulfilled");

    await settle(world);
    const target = await a.restart(old);
    expect(texts(bob.primary.engine.getMessages(target))).toEqual([
      "resend wins",
    ]);
    const storage = alice.primary.storage;
    expect(await storage.getMessage("alice", old, first.id)).toBeNull();
    expect(await storage.getMessage("alice", old, second.id)).toBeNull();
  });

  it("deletes an unsent message on request, and never sends it", async () => {
    const alice = await addUser(world, "alice");
    await addUser(world, "bob");
    const old = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    world.ds.addFault({
      method: "POST",
      path: /^e2ee\/groups\/0x[0-9a-f]+\/messages$/,
      status: 503,
      times: -1,
    });
    await queueWhileFailing(alice, old, "never mind");
    await seedLegacySuiteDevice(world, alice, alice.primary, {
      waitIdle: false,
    });
    world.ds.clearFaults();
    const a = alice.primary.engine;
    await a.loadHistory?.(old);
    const unsent = a.getMessages(old).find((m) => m.text === "never mind")!;
    expect(unsent.unsent).toBe("suite_upgrade");
    const sends = () =>
      world.ds.state.requests.filter(
        (r) => r.method === "POST" && r.path.endsWith("/messages")
      ).length;
    const sentBefore = sends();

    await a.discardUnsent(old, unsent.id);
    expect(a.getMessages(old).some((m) => m.id === unsent.id)).toBe(false);
    expect(
      await alice.primary.storage.getMessage("alice", old, unsent.id)
    ).toBeNull();
    // Deleting again is a no-op; nothing was sent meanwhile.
    await a.discardUnsent(old, unsent.id);
    expect(sends()).toBe(sentBefore);
  });

  it("refuses to start again until the other person has moved too", async () => {
    const { alice, bob, old } = await legacyDm(world);
    await upgrade(world, alice);
    const a = alice.primary.engine;

    // Bob only has his 0x004F device: nothing to add on 0x004E.
    await expect(a.restart(old)).rejects.toBeDefined();
    expect(ids(alice.primary)).toEqual([old]);

    await upgrade(world, bob);
    const fresh = await a.restart(old);
    expect(ids(alice.primary)).toEqual([fresh, old].sort());
    await settle(world);
    expect(bob.primary.engine.findDm("alice")).toBe(fresh);
  });

  it("keeps the earlier device's trust pins on the new device", async () => {
    const { alice } = await legacyDm(world);
    const before = await alice.primary.storage.getDevice("alice");
    // Creating the DM pinned Bob's wallet on first sighting.
    expect(before?.trust?.wallets["bob"]).toHaveLength(1);
    await upgrade(world, alice);
    const after = await alice.primary.storage.getDevice("alice");
    expect(after?.trust).toEqual(before?.trust);
  });
});
