/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Read-state sync
 * between one user's own devices (D175, design P60).
 */
import type { E2eeApiClient } from "@/lib/e2ee/api";
import { base64ToBytes } from "@/lib/e2ee/bytes";
import type { EngineContext } from "@/lib/e2ee/engine/context";
import { createConversation } from "@/lib/e2ee/engine/membership";
import { MlsClient } from "@/lib/e2ee/mls-adapter";
import { createFakeApiClient } from "@/tests/support/e2ee/fakeDeliveryService.cjs";
import {
  addUser,
  createWorld,
  settle,
  startDevice,
  stopDevice,
  texts,
  type TestDevice,
  type TestUser,
  type World,
} from "./support/harness";

jest.setTimeout(240_000);

interface FakeGroup {
  g: string;
  roster: Map<string, { profile_id: string }>;
  items: { type: string; data: string }[];
}

const dsGroups = (world: World): FakeGroup[] => [
  ...(world.ds.state["groups"] as Map<string, FakeGroup>).values(),
];

/** The fake server's self groups of `profileId`: every member is theirs. */
const selfGroupsOf = (world: World, profileId: string): FakeGroup[] =>
  dsGroups(world).filter(
    (group) =>
      group.roster.size > 0 &&
      [...group.roster.values()].every(
        (entry) => entry.profile_id === profileId
      )
  );

async function syncUser(world: World, profileId: string): Promise<TestUser> {
  return addUser(world, profileId, { readSync: true });
}

async function addSyncDevice(
  world: World,
  user: TestUser,
  extra: { readSync?: boolean } = { readSync: true }
): Promise<TestDevice> {
  const device = await startDevice(world, user.profileId, user.account, {
    extra,
  });
  user.devices.push(device);
  return device;
}

async function waitUntil(check: () => boolean, ms = 10_000): Promise<void> {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) throw new Error("condition not met in time");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/** The engine's internal context, to stage a self-group creation race. */
const contextOf = (device: TestDevice): EngineContext =>
  (device.engine as unknown as { ctx: EngineContext }).ctx;

const unread = (device: TestDevice, g: string): number | undefined =>
  device.engine.getConversation(g)?.unread;

/** Alice with a laptop and a phone, both in a DM with Bob, all settled. */
async function aliceWithTwoDevices(world: World) {
  const alice = await syncUser(world, "alice");
  const bob = await addUser(world, "bob");
  const laptop = alice.primary;
  const phone = await addSyncDevice(world, alice);
  await settle(world);
  const g = await bob.primary.engine.createConversation({
    profileIds: ["alice"],
    kind: "dm",
  });
  await settle(world);
  return { alice, bob, laptop, phone, g };
}

describe("E2EE engine: read-state sync (D175, P60)", () => {
  it("clears a chat on the phone after it is read on the laptop", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    // The phone joined the laptop's self group rather than make its own.
    expect(selfGroupsOf(world, "alice")).toHaveLength(1);

    await bob.primary.engine.send(g, { text: "one" });
    await bob.primary.engine.send(g, { text: "two" });
    await settle(world);
    expect(unread(laptop, g)).toBe(2);
    expect(unread(phone, g)).toBe(2);

    const before = world.ds.state.requests.length;
    laptop.engine.markRead(g);
    // Reading itself sends nothing; the batch goes out later.
    expect(world.ds.state.requests.length).toBe(before);
    expect(unread(laptop, g)).toBe(0);
    await settle(world);
    expect(unread(phone, g)).toBe(0);

    // Messages newer than the position stay unread.
    await bob.primary.engine.send(g, { text: "three" });
    await settle(world);
    expect(unread(phone, g)).toBe(1);
    expect(unread(laptop, g)).toBe(1);
  });

  it("shows the server only fixed-size ciphertext with no notify hints", async () => {
    const world = await createWorld();
    const { bob, laptop, g } = await aliceWithTwoDevices(world);
    await bob.primary.engine.send(g, { text: "hello" });
    await settle(world);
    laptop.engine.markRead(g);
    await settle(world);

    const selfGroups = selfGroupsOf(world, "alice");
    const handles = new Set(selfGroups.map((group) => group.g));
    const messages = selfGroups.flatMap((group) =>
      group.items.filter((item) => item.type === "message")
    );
    expect(messages.length).toBeGreaterThan(0);
    for (const item of messages) {
      expect(base64ToBytes(item.data).length).toBe(4096);
    }
    const hints = (
      world.ds.state["notifyLog"] as { group: string; hints: unknown[] }[]
    ).filter((entry) => handles.has(entry.group));
    expect(hints.length).toBe(messages.length);
    expect(hints.every((entry) => entry.hints.length === 0)).toBe(true);
    // No request ever names the chat together with a read position.
    expect(world.ds.state.requests.some((r) => /read/.test(r.path))).toBe(
      false
    );
  });

  it("keeps the self group out of chats and backups", async () => {
    const world = await createWorld();
    const { laptop, phone, g } = await aliceWithTwoDevices(world);
    const [self] = selfGroupsOf(world, "alice");
    expect(self).toBeDefined();
    for (const device of [laptop, phone]) {
      expect(device.engine.getConversations().map((c) => c.g)).toEqual([g]);
      expect(device.engine.getConversation(self?.g ?? "")).toBeNull();
      const backup = await device.engine.backupHistory();
      expect(backup.groups.map((group) => group.g)).toEqual([g]);
      expect(device.engine.getMessages(self?.g ?? "")).toEqual([]);
    }
  });

  it("brings a new device up to date with a snapshot", async () => {
    const world = await createWorld();
    const { alice, bob, laptop, g } = await aliceWithTwoDevices(world);
    const tablet = await addSyncDevice(world, alice);
    await settle(world);
    expect(tablet.engine.getConversation(g)?.status).toBe("active");

    await bob.primary.engine.send(g, { text: "after the tablet" });
    await settle(world);
    expect(unread(tablet, g)).toBe(1);
    laptop.engine.markRead(g);
    await settle(world);
    expect(unread(tablet, g)).toBe(0);
    // Its siblings added it to their self group; it made none of its own.
    const [kept, ...others] = selfGroupsOf(world, "alice");
    expect(others).toEqual([]);
    expect(kept?.roster.size).toBe(3);
  });

  it("catches up after being offline, and a revoked device stops receiving", async () => {
    const world = await createWorld();
    const { alice, bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    await bob.primary.engine.send(g, { text: "while away" });
    await settle(world);
    expect(unread(phone, g)).toBe(1);
    stopDevice(world, phone);
    laptop.engine.markRead(g);
    await settle(world);

    const back = await startDevice(world, alice.profileId, alice.account, {
      storage: phone.storage,
      enroll: false,
      extra: { readSync: true },
    });
    alice.devices.push(back);
    await settle(world);
    // The position sent while the phone was off applies when it syncs.
    expect(unread(back, g)).toBe(0);

    const backKey = back.engine.getThisDevice()?.deviceKey ?? "";
    await laptop.engine.revokeDevice(backKey);
    await bob.primary.engine.send(g, { text: "after revoke" });
    await settle(world);
    laptop.engine.markRead(g);
    await settle(world);
    const [self] = selfGroupsOf(world, "alice");
    expect(self?.roster.has(backKey)).toBe(false);
  });

  it("merges positions: highest wins, never backwards, capped at the server's last_seq", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    await bob.primary.engine.send(g, { text: "a" });
    await bob.primary.engine.send(g, { text: "b" });
    await settle(world);
    expect(unread(phone, g)).toBe(2);
    const dm = dsGroups(world).find((group) => group.g === g);
    const lastSeq = dm?.items.length ?? 0;
    const [self] = selfGroupsOf(world, "alice");
    const selfRuntime = contextOf(laptop).store.groups.get(self?.g ?? "");
    if (!selfRuntime) throw new Error("no self group on the laptop");
    const sync = contextOf(laptop).readSync as unknown as {
      send(
        runtime: unknown,
        t: string,
        r: readonly (readonly [string, number])[]
      ): Promise<void>;
    };
    const elsewhere = `0x${"ab".repeat(32)}`;
    // Out of order and duplicated, one far beyond the log, one for a chat
    // the phone is not in: the highest legitimate position wins.
    await sync.send(selfRuntime, "read", [
      [g, lastSeq - 1],
      [g, lastSeq + 1_000],
      [elsewhere, 7],
    ]);
    await sync.send(selfRuntime, "read", [[g, 1]]);
    await settle(world);
    const phoneRecord = contextOf(phone).store.groups.get(g)?.record;
    expect(phoneRecord?.readSeq).toBe(lastSeq);
    expect(unread(phone, g)).toBe(0);
    const phoneSelf = contextOf(phone).store.groups.get(self?.g ?? "");
    expect(phoneSelf?.record.readSync?.received[elsewhere]).toBe(7);
    // Capped at last_seq, so a later message is still unread.
    await bob.primary.engine.send(g, { text: "c" });
    await settle(world);
    expect(unread(phone, g)).toBe(1);
  });

  it("marks a chat read on your other devices when you reply", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    await bob.primary.engine.send(g, { text: "question" });
    await settle(world);
    expect(unread(laptop, g)).toBe(1);
    await phone.engine.send(g, { text: "answer" });
    await settle(world);
    expect(texts(laptop.engine.getMessages(g))).toContain("answer");
    expect(unread(laptop, g)).toBe(0);
  });

  it("with sending off, a device still joins and applies, but never creates or sends", async () => {
    const world = await createWorld();
    const alice = await syncUser(world, "alice");
    const bob = await addUser(world, "bob");
    const off = await addSyncDevice(world, alice, { readSync: false });
    await settle(world);
    const g = await bob.primary.engine.createConversation({
      profileIds: ["alice"],
      kind: "dm",
    });
    await settle(world);
    const [self] = selfGroupsOf(world, "alice");
    const offKey = off.engine.getThisDevice()?.deviceKey ?? "";
    expect(self?.roster.has(offKey)).toBe(true);

    await bob.primary.engine.send(g, { text: "ping" });
    await settle(world);
    alice.primary.engine.markRead(g);
    await settle(world);
    expect(unread(off, g)).toBe(0);

    // Reading on the device with sending off changes nothing elsewhere.
    await bob.primary.engine.send(g, { text: "pong" });
    await settle(world);
    const sent = (self?.items ?? []).length;
    off.engine.markRead(g);
    await settle(world);
    expect((self?.items ?? []).length).toBe(sent);
    expect(unread(alice.primary, g)).toBe(1);
  });

  it("breaks creation races by group ID and leaves the other group, each device for itself", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    const [first] = selfGroupsOf(world, "alice");
    if (!first) throw new Error("no self group");
    // A second self group, as when two devices each create one at once.
    const second = await createConversation(
      contextOf(phone),
      { profileIds: [], kind: "self" },
      () => {}
    );
    await settle(world);
    // Both devices were in both, so the handoff was verified at once: each
    // left the group with the higher handle, for itself.
    const [kept, ...others] = selfGroupsOf(world, "alice");
    expect(others).toEqual([]);
    expect(kept?.g).toBe([first.g, second].sort()[0]);
    expect(kept?.roster.size).toBe(2);

    await bob.primary.engine.send(g, { text: "race" });
    await settle(world);
    laptop.engine.markRead(g);
    await settle(world);
    expect(unread(phone, g)).toBe(0);
  });

  it("never cuts off a device that is not in the canonical self group yet", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    const [old] = selfGroupsOf(world, "alice");
    if (!old) throw new Error("no self group");
    const phoneKey = phone.engine.getThisDevice()?.deviceKey ?? "";
    const laptopKey = laptop.engine.getThisDevice()?.deviceKey ?? "";
    // The phone's KeyPackages read as from a client without self groups,
    // so a self group the laptop makes now holds only the laptop. Make one
    // until its handle sorts first and it becomes the canonical group.
    const capable = jest
      .spyOn(MlsClient.prototype, "supportsSelfGroups")
      .mockReturnValue(false);
    let canonical = "";
    for (
      let tries = 0;
      tries < 20 && !(canonical && canonical < old.g);
      tries += 1
    ) {
      canonical = await createConversation(
        contextOf(laptop),
        { profileIds: [], kind: "self" },
        () => {}
      );
      await settle(world);
    }
    expect(canonical < old.g).toBe(true);
    // The phone is not in the canonical group, so the laptop stays in the
    // old one, and its read still reaches the phone.
    expect(old.roster.has(laptopKey)).toBe(true);
    await bob.primary.engine.send(g, { text: "still heard" });
    await settle(world);
    expect(unread(phone, g)).toBe(1);
    laptop.engine.markRead(g);
    await settle(world);
    expect(unread(phone, g)).toBe(0);

    // Once the phone can be added, it is; then both leave the old group.
    capable.mockRestore();
    world.clock.advance(11 * 60_000);
    await settle(world);
    const kept = dsGroups(world).find((group) => group.g === canonical);
    expect(kept?.roster.has(phoneKey)).toBe(true);
    expect(old.roster.size).toBe(0);
  });

  it("does not add a client without self groups, and adds it once it updates", async () => {
    const world = await createWorld();
    const alice = await syncUser(world, "alice");
    const bob = await addUser(world, "bob");
    await settle(world);
    const [self] = selfGroupsOf(world, "alice");
    if (!self) throw new Error("no self group");
    // A phone whose client predates self groups: its KeyPackages lack the
    // capability, so the laptop never adds it.
    const capable = jest
      .spyOn(MlsClient.prototype, "supportsSelfGroups")
      .mockReturnValue(false);
    const phone = await addSyncDevice(world, alice, { readSync: false });
    const g = await bob.primary.engine.createConversation({
      profileIds: ["alice"],
      kind: "dm",
    });
    await settle(world);
    const phoneKey = phone.engine.getThisDevice()?.deviceKey ?? "";
    expect(self.roster.has(phoneKey)).toBe(false);
    await bob.primary.engine.send(g, { text: "read me" });
    await settle(world);
    alice.primary.engine.markRead(g);
    await settle(world);
    expect(unread(phone, g)).toBe(1);

    // The phone updates: the next maintenance adds it, and the laptop's
    // snapshot catches it up.
    capable.mockRestore();
    world.clock.advance(11 * 60_000);
    await settle(world);
    expect(self.roster.has(phoneKey)).toBe(true);
    expect(unread(phone, g)).toBe(0);
  });

  it("creates its own self group only when joining stalls, then settles on one", async () => {
    const world = await createWorld();
    const alice = await syncUser(world, "alice");
    const bob = await addUser(world, "bob");
    await settle(world);
    // The laptop is offline: nobody adds the tablet to its self group.
    const laptopStorage = alice.primary.storage;
    stopDevice(world, alice.primary);
    const tablet = await addSyncDevice(world, alice);
    await settle(world);
    expect(selfGroupsOf(world, "alice")).toHaveLength(1);
    world.clock.advance(3 * 60_000);
    await settle(world);
    expect(selfGroupsOf(world, "alice")).toHaveLength(2);

    const laptop = await startDevice(world, "alice", alice.account, {
      storage: laptopStorage,
      enroll: false,
      extra: { readSync: true },
    });
    alice.devices.push(laptop);
    world.clock.advance(11 * 60_000);
    await settle(world);
    const [kept, ...others] = selfGroupsOf(world, "alice");
    expect(others).toEqual([]);
    expect(kept?.roster.size).toBe(2);
    const g = await bob.primary.engine.createConversation({
      profileIds: ["alice"],
      kind: "dm",
    });
    await settle(world);
    await bob.primary.engine.send(g, { text: "settled" });
    await settle(world);
    laptop.engine.markRead(g);
    await settle(world);
    expect(unread(tablet, g)).toBe(0);
  });

  it("keeps chats read while a batch is sending queued for the next one", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    const second = await bob.primary.engine.createConversation({
      profileIds: ["alice"],
      kind: "group",
      name: "Second",
    });
    await settle(world);
    await bob.primary.engine.send(g, { text: "first chat" });
    await bob.primary.engine.send(second, { text: "second chat" });
    await settle(world);
    expect(unread(phone, second)).toBe(1);

    laptop.engine.markRead(g);
    const gate = world.ds.hold(/\/messages$/);
    const sending = laptop.engine.flushReadSync();
    await waitUntil(() => gate.waiting() === 1);
    // Read while the first batch is on its way.
    laptop.engine.markRead(second);
    gate.release();
    await sending;
    await settle(world);
    expect(unread(phone, g)).toBe(0);
    expect(unread(phone, second)).toBe(0);
  });

  it("sends nothing at all with sending off, not even when it joins", async () => {
    const world = await createWorld();
    const alice = await syncUser(world, "alice");
    const bob = await addUser(world, "bob");
    await settle(world);
    const g = await bob.primary.engine.createConversation({
      profileIds: ["alice"],
      kind: "dm",
    });
    await settle(world);
    await bob.primary.engine.send(g, { text: "known" });
    await settle(world);
    const api = createFakeApiClient(world.ds, "alice") as E2eeApiClient;
    const sentTo: string[] = [];
    const spied: E2eeApiClient = {
      ...api,
      sendMessage: (group, body) => {
        sentTo.push(group);
        return api.sendMessage(group, body);
      },
    };
    const off = await startDevice(world, "alice", alice.account, {
      extra: { readSync: false, api: spied },
    });
    alice.devices.push(off);
    await settle(world);
    const [self] = selfGroupsOf(world, "alice");
    const offKey = off.engine.getThisDevice()?.deviceKey ?? "";
    expect(self?.roster.has(offKey)).toBe(true);
    // It joined, holds a read position and is asked for state: still silent.
    off.engine.markRead(g);
    await settle(world);
    await off.engine.flushReadSync();
    await settle(world);
    expect(sentTo).toEqual([]);
  });
});
