/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. A device updates
 * to a client with self groups while the KeyPackages its older client made,
 * without the self-group capability, are still on the server, handed out
 * oldest first (D175, P60 §2 rule 6).
 */
import type { EngineContext } from "@/lib/e2ee/engine/context";
import { MlsClient } from "@/lib/e2ee/mls-adapter";
import type { StoredDevice } from "@/lib/e2ee/records";
import {
  addUser,
  createWorld,
  realSleep,
  settle,
  startDevice,
  stopDevice,
  type TestDevice,
  type TestUser,
  type World,
} from "./support/harness";

jest.setTimeout(600_000);

const MINUTE = 60_000;

interface FakeGroup {
  g: string;
  roster: Map<string, { profile_id: string }>;
}

interface FakePool {
  oneTime: { data: string }[];
  lastResort: Map<number, { data: string }>;
}

const selfGroupsOf = (world: World, profileId: string): FakeGroup[] =>
  [...(world.ds.state["groups"] as Map<string, FakeGroup>).values()].filter(
    (group) =>
      group.roster.size > 0 &&
      [...group.roster.values()].every(
        (entry) => entry.profile_id === profileId
      )
  );

const poolOf = (world: World, deviceKey: string): FakePool | undefined =>
  (world.ds.state["keyPackages"] as Map<string, FakePool>).get(deviceKey);

const contextOf = (device: TestDevice): EngineContext =>
  (device.engine as unknown as { ctx: EngineContext }).ctx;

const keyOf = (device: TestDevice): string =>
  device.engine.getThisDevice()?.deviceKey ?? "";

const uploadsOf = (world: World, deviceKey: string): number =>
  world.ds.state.requests.filter(
    (r) => r.method === "POST" && r.path.endsWith(`${deviceKey}/key-packages`)
  ).length;

/**
 * KeyPackages an older client made lack the self-group capability: the
 * check reads every KeyPackage in `old` as lacking it.
 */
function oldKeyPackages(): { old: Set<string>; restore: () => void } {
  const old = new Set<string>();
  const actual = MlsClient.prototype.supportsSelfGroups;
  const spy = jest
    .spyOn(MlsClient.prototype, "supportsSelfGroups")
    .mockImplementation(function (this: MlsClient, keyPackage: string) {
      return !old.has(keyPackage) && actual.call(this, keyPackage);
    });
  return { old, restore: () => spy.mockRestore() };
}

/**
 * Makes `device` an older client's: its KeyPackages so far, and every one
 * it makes until it updates, lack the capability.
 */
function runsOlderClient(
  world: World,
  device: TestDevice,
  old: Set<string>
): void {
  const pool = poolOf(world, keyOf(device));
  for (const kp of pool?.oneTime ?? []) old.add(kp.data);
  for (const kp of pool?.lastResort.values() ?? []) old.add(kp.data);
  const mls = contextOf(device).mls;
  if (!mls) throw new Error("no MLS client");
  const make = mls.createKeyPackages.bind(mls);
  mls.createKeyPackages = (...args) => {
    const made = make(...args);
    for (const item of made) old.add(item.data);
    return made;
  };
}

/** An older client sends no read sync. */
async function olderClientDevice(
  world: World,
  user: TestUser,
  old: Set<string>
): Promise<TestDevice> {
  const device = await startDevice(world, user.profileId, user.account, {
    extra: { readSync: false },
  });
  user.devices.push(device);
  runsOlderClient(world, device, old);
  return device;
}

/**
 * The device loads the new client: same storage, read sync on. An older
 * client never wrote `lastResortSelfSync`.
 */
async function update(
  world: World,
  user: TestUser,
  device: TestDevice,
  edit: (record: StoredDevice) => void = () => {}
): Promise<TestDevice> {
  stopDevice(world, device);
  // The older client made its last-resort KeyPackage earlier, so its listed
  // expiry (whole seconds) differs from the one the update makes.
  await realSleep(1100);
  const record = await device.storage.getDevice(user.profileId);
  if (!record) throw new Error("no stored device");
  delete record.lastResortSelfSync;
  edit(record);
  await device.storage.writeBatch(user.profileId, { device: record });
  const updated = await startDevice(world, user.profileId, user.account, {
    storage: device.storage,
    enroll: false,
    extra: { readSync: true },
  });
  user.devices.push(updated);
  return updated;
}

/** Counts this device's claims of `deviceKey`'s KeyPackages from now on. */
function countClaims(device: TestDevice, deviceKey: string): () => number {
  const api = contextOf(device).api;
  const claim = api.claimKeyPackages.bind(api);
  let count = 0;
  api.claimKeyPackages = (body) => {
    if (
      body.targets.some((target) => target.device_keys?.includes(deviceKey))
    ) {
      count += 1;
    }
    return claim(body);
  };
  return () => count;
}

interface Timeline {
  /** Minutes after the phone updated. */
  capableKeyPackages: number | null;
  /** A self group holds both devices: read positions flow both ways. */
  sharedGroup: number | null;
  /** The phone is in the laptop's self group. */
  inLaptopGroup: number | null;
  /** One self group is left, holding both. */
  settled: number | null;
  /** The laptop's read reached the phone. */
  readStateSynced: number | null;
  /** The laptop maintained its self group at once on seeing the update. */
  earlyMaintenance: number[];
}

/**
 * The laptop already runs the new client and has a self group; the phone
 * updates with its older KeyPackages still queued on the server. Steps the
 * clock a minute at a time; every device syncs each step, about as often as
 * the idle poll (30 s).
 */
async function phoneUpdates(
  world: World,
  alice: TestUser,
  laptop: TestDevice,
  phone: TestDevice,
  g: string,
  options: { createdToday?: boolean } = {}
): Promise<Timeline> {
  const [laptopGroup, ...others] = selfGroupsOf(world, "alice");
  if (!laptopGroup) throw new Error("no self group");
  expect(others).toEqual([]);
  const phoneKey = keyOf(phone);
  const laptopKey = keyOf(laptop);
  expect(laptopGroup.roster.has(phoneKey)).toBe(false);
  expect(phone.engine.getConversation(g)?.unread).toBe(1);

  const timeline: Timeline = {
    capableKeyPackages: null,
    sharedGroup: null,
    inLaptopGroup: null,
    settled: null,
    readStateSynced: null,
    earlyMaintenance: [],
  };
  let start = world.clock.now();
  const minutes = () => (world.clock.now() - start) / MINUTE;
  const deps = (
    laptop.engine as unknown as {
      readSync: { deps: { maintain: (g: string) => void } };
    }
  ).readSync.deps;
  const maintain = deps.maintain;
  deps.maintain = (group) => {
    timeline.earlyMaintenance.push(minutes());
    maintain(group);
  };
  const uploads = uploadsOf(world, phoneKey);
  const updated = await update(world, alice, phone, (record) => {
    if (options.createdToday === true) {
      // It made a self group today, so it makes no other until tomorrow.
      record.readSync = { unsent: [], createdAt: world.clock.now() };
    }
  });
  start = world.clock.now();
  const first = (value: number | null, now: boolean): number | null =>
    value ?? (now ? minutes() : null);
  const both = (group: FakeGroup) =>
    group.roster.has(phoneKey) && group.roster.has(laptopKey);
  for (let step = 0; step <= 60; step += 1) {
    await settle(world);
    const groups = selfGroupsOf(world, "alice");
    timeline.capableKeyPackages = first(
      timeline.capableKeyPackages,
      uploadsOf(world, phoneKey) > uploads
    );
    timeline.sharedGroup = first(timeline.sharedGroup, groups.some(both));
    timeline.inLaptopGroup = first(
      timeline.inLaptopGroup,
      laptopGroup.roster.has(phoneKey)
    );
    timeline.settled = first(
      timeline.settled,
      groups.length === 1 && groups.every(both)
    );
    timeline.readStateSynced = first(
      timeline.readStateSynced,
      updated.engine.getConversation(g)?.unread === 0
    );
    if (timeline.settled !== null && timeline.readStateSynced !== null) {
      break;
    }
    world.clock.advance(MINUTE);
  }
  return timeline;
}

/** Bob's DM with Alice, read on the laptop and unread on the phone. */
async function readOnLaptop(world: World, laptop: TestDevice): Promise<string> {
  const bob = await addUser(world, "bob");
  const g = await bob.primary.engine.createConversation({
    profileIds: ["alice"],
    kind: "dm",
  });
  await settle(world);
  await bob.primary.engine.send(g, { text: "read me" });
  await settle(world);
  laptop.engine.markRead(g);
  await settle(world);
  return g;
}

/** Synced within minutes; one self group left within one listing pass. */
function expectQuick(timeline: Timeline): void {
  // The phone replaces its last-resort KeyPackage as it starts.
  expect(timeline.capableKeyPackages).toBe(0);
  expect(timeline.sharedGroup ?? Infinity).toBeLessThanOrEqual(4);
  expect(timeline.readStateSynced ?? Infinity).toBeLessThanOrEqual(4);
  expect(timeline.settled ?? Infinity).toBeLessThanOrEqual(12);
}

describe("E2EE engine: read sync after a device updates (D175, P60)", () => {
  let keyPackages: ReturnType<typeof oldKeyPackages>;
  beforeEach(() => {
    keyPackages = oldKeyPackages();
  });
  afterEach(() => {
    keyPackages.restore();
  });

  it("syncs an updated phone within minutes while its older KeyPackages are still queued", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice", { readSync: true });
    const laptop = alice.primary;
    // Alone, the laptop makes its self group at once.
    await settle(world);
    const phone = await olderClientDevice(world, alice, keyPackages.old);
    const g = await readOnLaptop(world, laptop);

    expectQuick(await phoneUpdates(world, alice, laptop, phone, g));
    for (const device of world.devices) device.engine.dispose();
  });

  it("does so when the laptop's KeyPackages are older too, and claims through an older client's pool once", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice", { readSync: false });
    runsOlderClient(world, alice.primary, keyPackages.old);
    const phone = await olderClientDevice(world, alice, keyPackages.old);
    await settle(world);
    // The laptop updates first; the phone stays on the older client.
    const laptop = await update(world, alice, alice.primary);
    const claims = countClaims(laptop, keyOf(phone));
    for (let step = 0; step < 120; step += 1) {
      await settle(world);
      world.clock.advance(MINUTE);
    }
    // The laptop made a self group of its own and claimed through the
    // phone's older KeyPackages once, then one per maintenance pass.
    expect(selfGroupsOf(world, "alice")).toHaveLength(1);
    expect(claims()).toBeGreaterThan(20);
    expect(claims()).toBeLessThanOrEqual(31 + 12);

    const g = await readOnLaptop(world, laptop);
    expectQuick(await phoneUpdates(world, alice, laptop, phone, g));
    for (const device of world.devices) device.engine.dispose();
  });

  /**
   * The laptop has a self group; the phone, on the older client with a full
   * pool of its KeyPackages queued, updates but makes no self group of its
   * own (it made one today), so only the laptop can add it.
   */
  async function onlyTheLaptopCanAdd() {
    const world = await createWorld();
    const alice = await addUser(world, "alice", { readSync: true });
    const laptop = alice.primary;
    await settle(world);
    const phone = await olderClientDevice(world, alice, keyPackages.old);
    const g = await readOnLaptop(world, laptop);
    // The older client refilled its pool with more of its KeyPackages.
    world.clock.advance(11 * MINUTE);
    await settle(world);
    const phoneKey = keyOf(phone);
    expect(poolOf(world, phoneKey)?.oneTime.length).toBeGreaterThan(20);
    const [laptopGroup] = selfGroupsOf(world, "alice");
    if (!laptopGroup) throw new Error("no self group");
    const claims = countClaims(laptop, phoneKey);
    const deps = (
      laptop.engine as unknown as {
        readSync: { deps: { maintain: (g: string) => void } };
      }
    ).readSync.deps;
    const maintain = deps.maintain;
    const maintained: string[] = [];
    deps.maintain = (group) => {
      maintained.push(group);
      maintain(group);
    };
    const updated = await update(world, alice, phone, (record) => {
      record.readSync = { unsent: [], createdAt: world.clock.now() };
    });
    await settle(world);
    expect(laptopGroup.roster.has(phoneKey)).toBe(false);
    expect(claims()).toBe(0);
    /** The laptop lists its devices (every 10 minutes and on device events). */
    const listDevices = async () => {
      await (
        laptop.engine as unknown as { refreshMe: () => Promise<void> }
      ).refreshMe();
      await settle(world);
    };
    return {
      world,
      laptop,
      updated,
      g,
      phoneKey,
      laptopGroup,
      claims,
      maintained,
      listDevices,
    };
  }

  it("adds the updated phone to the laptop's group as soon as the laptop lists its new KeyPackage", async () => {
    const {
      world,
      updated,
      g,
      phoneKey,
      laptopGroup,
      claims,
      maintained,
      listDevices,
    } = await onlyTheLaptopCanAdd();
    // The phone's last-resort KeyPackage changed, so the laptop maintains
    // its self group at once and claims through the older KeyPackages.
    await listDevices();
    expect(maintained).toEqual([laptopGroup.g]);
    expect(laptopGroup.roster.has(phoneKey)).toBe(true);
    expect(claims()).toBeGreaterThan(20);
    expect(claims()).toBeLessThanOrEqual(31);
    expect(updated.engine.getConversation(g)?.unread).toBe(0);
    for (const device of world.devices) device.engine.dispose();
  });

  it("claims through again at the next pass when a claim is refused", async () => {
    const {
      world,
      laptop,
      updated,
      g,
      phoneKey,
      laptopGroup,
      claims,
      listDevices,
    } = await onlyTheLaptopCanAdd();
    const api = contextOf(laptop).api;
    const claim = api.claimKeyPackages.bind(api);
    let refused = 0;
    api.claimKeyPackages = (body) => {
      // The first claim of the claim-through, as past the rate limit.
      if (claims() === 1 && refused === 0) {
        refused += 1;
        return Promise.reject(new Error("E2EE_RATE_LIMITED"));
      }
      return claim(body);
    };
    await listDevices();
    expect(refused).toBe(1);
    expect(laptopGroup.roster.has(phoneKey)).toBe(false);
    // The pass went on without the phone: nothing failed.
    expect(laptop.engine.getError()).toBeNull();

    // The next maintenance pass claims through again and adds the phone.
    world.clock.advance(11 * MINUTE);
    await settle(world);
    expect(laptopGroup.roster.has(phoneKey)).toBe(true);
    expect(updated.engine.getConversation(g)?.unread).toBe(0);
    for (const device of world.devices) device.engine.dispose();
  });
});
