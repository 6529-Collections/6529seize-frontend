/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Read-state sync
 * between one user's own devices (D175, design P60).
 */
import { base64ToBytes } from "@/lib/e2ee/bytes";
import { DAY_MS, type EngineContext } from "@/lib/e2ee/engine/context";
import { createConversation } from "@/lib/e2ee/engine/membership";
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
    expect(selfGroupsOf(world, "alice").length).toBeGreaterThan(0);

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
    // The tablet made its own self group, which became the newest; a day
    // later every device has left the older ones.
    world.clock.advance(DAY_MS + 1_000);
    await settle(world);
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

  it("converges on the newest self group and leaves the older one a day later", async () => {
    const world = await createWorld();
    const { bob, laptop, phone, g } = await aliceWithTwoDevices(world);
    const [first] = selfGroupsOf(world, "alice");
    // A second self group, as when two devices each create one at once.
    world.clock.advance(1_000);
    const second = await createConversation(
      contextOf(phone),
      { profileIds: [], kind: "self" },
      () => {}
    );
    await settle(world);
    const newer = dsGroups(world).find((group) => group.g === second);
    expect(newer?.roster.size).toBe(2);

    await bob.primary.engine.send(g, { text: "race" });
    await settle(world);
    expect(unread(phone, g)).toBe(1);
    const before = newer?.items.length ?? 0;
    laptop.engine.markRead(g);
    await settle(world);
    expect(unread(phone, g)).toBe(0);
    // The position went to the newest self group.
    expect(newer?.items.length ?? 0).toBeGreaterThan(before);

    // A day after the newest was joined, both devices leave the older one.
    world.clock.advance(DAY_MS + 1_000);
    await settle(world);
    expect(first?.roster.size).toBe(0);
    expect(newer?.roster.size).toBe(2);
  });
});
