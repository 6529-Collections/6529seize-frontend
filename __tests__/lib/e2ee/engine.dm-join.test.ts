/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. A direct
 * conversation has exactly two participants: an invitation to one joins only
 * when its pair names this user, its sender is one of the two and every
 * device belongs to one of them, as commit validation already requires.
 * Group invitations join as before. Continuing a superseded DM follows its
 * stored successor only while that is a usable DM with the same person.
 */
import type { E2eeApiClient } from "@/lib/e2ee/api";
import { MlsClient } from "@/lib/e2ee/mls-adapter";
import type { GroupMetadata } from "@/lib/e2ee/wasm-types";
import { createFakeApiClient } from "@/tests/support/e2ee/fakeDeliveryService.cjs";
import {
  addDevice,
  addUser,
  createWorld,
  moveToCurrentSuite,
  settle,
  startDevice,
  stopDevice,
  texts,
  type TestDevice,
  type TestUser,
  type World,
} from "./support/harness";

jest.setTimeout(180_000);

const keyOf = (device: TestDevice): string =>
  device.engine.getThisDevice()!.deviceKey.toLowerCase();

/** Invitations the delivery service still holds for `device` (not acked). */
const pendingWelcomes = (world: World, device: TestDevice): string[] =>
  (world.ds.state["deliveries"] as Map<string, string[]>).get(keyOf(device)) ??
  [];

/** An API client whose device lookups answer `status` for chosen devices. */
function lookupFaults(world: World, profileId: string) {
  const base = createFakeApiClient(world.ds, profileId);
  const failing = new Map<string, number>();
  const api: E2eeApiClient = {
    ...base,
    getDevice: async (deviceKey, signal) => {
      const status = failing.get(deviceKey.toLowerCase());
      if (status !== undefined) {
        throw Object.assign(new Error(`HTTP ${status}`), {
          name: "E2eeApiError",
          status,
          code: status === 404 ? "E2EE_NOT_FOUND" : null,
        });
      }
      return base.getDevice(deviceKey, signal);
    },
  };
  return { api, failing };
}

/**
 * Starts a conversation whose group metadata differs from what this app
 * writes, as another client could create it: the change is applied before
 * the group exists, so every invitation carries it.
 */
async function createWithMetadata(
  device: TestDevice,
  input: { profileIds: string[]; kind: "dm" | "group" },
  change: Partial<GroupMetadata>
): Promise<string> {
  const original = MlsClient.prototype.createGroup;
  const spy = jest
    .spyOn(MlsClient.prototype, "createGroup")
    .mockImplementation(function (this: MlsClient, g, metadata, suite) {
      return original.call(this, g, { ...metadata, ...change }, suite);
    });
  try {
    return await device.engine.createConversation(input);
  } finally {
    spy.mockRestore();
  }
}

describe("E2EE engine: joining direct conversations", () => {
  let world: World;

  beforeEach(async () => {
    world = await createWorld();
  });

  afterEach(() => {
    for (const device of world.devices) device.engine.dispose();
  });

  it("joins a group invitation with three people as before", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob", "carol"],
      kind: "group",
      name: "Three",
    });
    await settle(world);
    for (const user of [bob, carol]) {
      expect(user.primary.engine.getConversation(g)).toMatchObject({
        status: "active",
        kind: "group",
      });
      expect(pendingWelcomes(world, user.primary)).toEqual([]);
    }
  });

  it("joins a DM between two people with several devices each, also from this user's other device", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const alicePhone = await addDevice(world, alice);
    const bobPhone = await addDevice(world, bob);
    await settle(world);
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    // Alice's phone is invited by her own laptop, Bob's devices by Alice.
    for (const [device, peer] of [
      [alicePhone, "bob"],
      [bob.primary, "alice"],
      [bobPhone, "alice"],
    ] as const) {
      expect(device.engine.getConversation(g)).toMatchObject({
        status: "active",
        dmPeer: { profileId: peer },
      });
      expect(device.engine.findDm(peer)).toBe(g);
      expect(pendingWelcomes(world, device)).toEqual([]);
    }
    await bobPhone.engine.send(g, { text: "from the phone" });
    await settle(world);
    expect(texts(alicePhone.engine.getMessages(g))).toEqual(["from the phone"]);
  });

  it("joins a DM whose other participant has no device in it right now", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    await bob.primary.engine.leave(g);
    await settle(world);
    expect(
      alice.primary.engine.getConversation(g)?.members.map((m) => m.profileId)
    ).toEqual(["alice"]);

    const alicePhone = await addDevice(world, alice);
    await settle(world);
    expect(alicePhone.engine.getConversation(g)).toMatchObject({
      status: "active",
      dmPeer: { profileId: "bob" },
    });
    expect(pendingWelcomes(world, alicePhone)).toEqual([]);
  });

  it("refuses a DM invitation from someone outside the pair and keeps the real DM", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const real = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    const other = await createWithMetadata(
      carol.primary,
      { profileIds: ["alice", "bob"], kind: "group" },
      { kind: "dm", name: null, admins: ["alice", "bob"] }
    );
    await settle(world);
    for (const [device, peer] of [
      [alice.primary, "bob"],
      [bob.primary, "alice"],
    ] as const) {
      expect(device.engine.getConversation(other)).toBeNull();
      expect(device.engine.findDm(peer)).toBe(real);
      // Refused for good: acknowledged, not retried.
      expect(pendingWelcomes(world, device)).toEqual([]);
    }
  });

  it("refuses a DM invitation whose devices include a third person, even from one of the pair", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const g = await createWithMetadata(
      alice.primary,
      { profileIds: ["bob", "carol"], kind: "group" },
      { kind: "dm", name: null, admins: ["alice", "bob"] }
    );
    await settle(world);
    for (const device of [bob.primary, carol.primary]) {
      expect(device.engine.getConversation(g)).toBeNull();
      expect(pendingWelcomes(world, device)).toEqual([]);
    }
    // The creator's own copy is no DM with Bob either.
    expect(alice.primary.engine.getConversation(g)?.dmPeer).toBeNull();
    expect(alice.primary.engine.findDm("bob")).toBeNull();
  });

  it("refuses a DM invitation whose pair leaves this user out", async () => {
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await createWithMetadata(
      alice.primary,
      { profileIds: ["bob"], kind: "group" },
      { kind: "dm", name: null, admins: ["alice", "carol"] }
    );
    await settle(world);
    expect(bob.primary.engine.getConversation(g)).toBeNull();
    expect(pendingWelcomes(world, bob.primary)).toEqual([]);
  });

  it("refuses a DM invitation holding a device whose owner is unknown, while a group one still joins", async () => {
    const alice = await addUser(world, "alice");
    const alicePhone = await addDevice(world, alice);
    const lookups = lookupFaults(world, "bob");
    const bob = await addUser(world, "bob", { api: lookups.api });
    await settle(world);
    // The server does not know Alice's phone (not the sender) to Bob.
    lookups.failing.set(keyOf(alicePhone), 404);
    const dm = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    expect(bob.primary.engine.getConversation(dm)).toBeNull();
    expect(pendingWelcomes(world, bob.primary)).toEqual([]);

    const group = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "group",
      name: "Unknown phone",
    });
    await settle(world);
    expect(bob.primary.engine.getConversation(group)).toMatchObject({
      status: "active",
      kind: "group",
    });
  });

  it("retries a DM invitation whose device lookups fail for now, then joins", async () => {
    const alice = await addUser(world, "alice");
    const lookups = lookupFaults(world, "bob");
    const bob = await addUser(world, "bob", { api: lookups.api });
    lookups.failing.set(keyOf(alice.primary), 503);
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    expect(bob.primary.engine.getConversation(g)).toBeNull();
    expect(pendingWelcomes(world, bob.primary)).toHaveLength(1);

    lookups.failing.clear();
    await settle(world);
    expect(bob.primary.engine.getConversation(g)).toMatchObject({
      status: "active",
      dmPeer: { profileId: "alice" },
    });
    expect(bob.primary.engine.findDm("alice")).toBe(g);
    expect(pendingWelcomes(world, bob.primary)).toEqual([]);
  });
});

describe("E2EE engine: continuing a superseded DM (D172)", () => {
  let world: World;

  beforeEach(async () => {
    world = await createWorld();
  });

  afterEach(() => {
    for (const device of world.devices) device.engine.dispose();
  });

  /** Alice and Bob share a DM made on 0x004F, then both move to 0x004E. */
  async function supersededDm() {
    const alice = await addUser(world, "alice", undefined, {
      earlierSuite: true,
    });
    const bob = await addUser(world, "bob", undefined, { earlierSuite: true });
    const old = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    await moveToCurrentSuite(world, alice, alice.primary);
    await moveToCurrentSuite(world, bob, bob.primary);
    await alice.primary.engine.enroll();
    await bob.primary.engine.enroll();
    await addUser(world, "carol");
    await settle(world);
    return { alice, bob, old };
  }

  /** Stores `successor` as the link of `g` and starts the device again. */
  async function relink(
    user: TestUser,
    g: string,
    successor: string
  ): Promise<TestDevice> {
    const device = user.primary;
    await device.engine.idle();
    stopDevice(world, device);
    const groups = (await device.storage.listGroups(user.profileId))
      .filter((group) => group.g === g)
      .map(({ successorPending: _pending, ...group }) => ({
        ...group,
        successor,
      }));
    await device.storage.writeBatch(user.profileId, {
      expectedVersion: await device.storage.getStateVersion(user.profileId),
      groups,
    });
    const restarted = await startDevice(world, user.profileId, user.account, {
      storage: device.storage,
      enroll: false,
    });
    user.devices.push(restarted);
    user.primary = restarted;
    return restarted;
  }

  it("continues in the stored successor when it is the DM with the same person", async () => {
    const { alice, old } = await supersededDm();
    const fresh = await alice.primary.engine.restart(old);
    await settle(world);
    const device = await relink(alice, old, fresh);
    const count = device.engine.getConversations().length;
    await expect(device.engine.restart(old)).resolves.toBe(fresh);
    expect(device.engine.getConversations()).toHaveLength(count);
  });

  it("does not continue in a stored successor that is a DM with someone else", async () => {
    const { alice, old } = await supersededDm();
    const withCarol = await alice.primary.engine.createConversation({
      profileIds: ["carol"],
      kind: "dm",
    });
    await settle(world);
    const device = await relink(alice, old, withCarol);
    const next = await device.engine.restart(old);
    expect(next).not.toBe(withCarol);
    expect(device.engine.getConversation(next)).toMatchObject({
      status: "active",
      dmPeer: { profileId: "bob" },
    });
    expect(device.engine.getConversation(old)?.successor).toBe(next);
  });

  it("does not continue in a stored successor that holds a third person", async () => {
    const { alice, old } = await supersededDm();
    const crowded = await createWithMetadata(
      alice.primary,
      { profileIds: ["bob", "carol"], kind: "group" },
      { kind: "dm", name: null, admins: ["alice", "bob"] }
    );
    await settle(world);
    const device = await relink(alice, old, crowded);
    const next = await device.engine.restart(old);
    expect(next).not.toBe(crowded);
    expect(device.engine.getConversation(next)).toMatchObject({
      status: "active",
      dmPeer: { profileId: "bob" },
    });
  });

  it("keeps a continued DM working for the other person and their later device", async () => {
    const { alice, bob, old } = await supersededDm();
    // Bob continues it; Alice joins through his invitation.
    const fresh = await bob.primary.engine.restart(old);
    await settle(world);
    expect(alice.primary.engine.findDm("bob")).toBe(fresh);
    await expect(alice.primary.engine.restart(old)).resolves.toBe(fresh);

    const alicePhone = await addDevice(world, alice);
    await settle(world);
    expect(alicePhone.engine.getConversation(fresh)).toMatchObject({
      status: "active",
      dmPeer: { profileId: "bob" },
    });
    expect(alicePhone.engine.findDm("bob")).toBe(fresh);
    await bob.primary.engine.send(fresh, { text: "to every device" });
    await settle(world);
    expect(texts(alicePhone.engine.getMessages(fresh))).toEqual([
      "to every device",
    ]);
  });
});
