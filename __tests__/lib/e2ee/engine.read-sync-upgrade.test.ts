/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. A device updates
 * to a client with self groups while the KeyPackages its older client made,
 * without the self-group capability, are still on the server, handed out
 * oldest first (D175, P60 §2 rule 6).
 */
import { checkpoint, type EngineContext } from "@/lib/e2ee/engine/context";
import { E2EE_CIPHERSUITE } from "@/lib/e2ee/grant";
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

/** The device uploads one-time KeyPackages until 30 are queued. */
async function fillQueue(world: World, device: TestDevice): Promise<void> {
  const ctx = contextOf(device);
  const queued = poolOf(world, keyOf(device))?.oneTime.length ?? 0;
  if (!ctx.mls || queued >= 30) return;
  const made = ctx.mls.createKeyPackages(
    30 - queued,
    false,
    30 * 86_400,
    E2EE_CIPHERSUITE
  );
  // Like the client: private halves stored before the public ones leave.
  await checkpoint(ctx);
  await ctx.api.uploadKeyPackages(keyOf(device), {
    key_packages: made.map((item) => ({
      data: item.data,
      last_resort: false,
      expires_at: item.expires_at,
    })),
  });
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

/** Alice's KeyPackage claims so far (every device counts, as on the server). */
const claimsOf = (world: World, profileId: string): number =>
  world.ds.state.requests.filter(
    (r) =>
      r.profileId === profileId &&
      r.method === "POST" &&
      r.path === "e2ee/key-packages/claim"
  ).length;

const rateLimited = (world: World, profileId: string): number =>
  world.ds.state.requests.filter(
    (r) => r.profileId === profileId && r.status === 429
  ).length;

interface Timeline {
  /** Minutes after the phone updated. */
  capableKeyPackages: number | null;
  /** A self group holds both devices: read positions flow both ways. */
  sharedGroup: number | null;
  /** The laptop's read reached the phone. */
  readStateSynced: number | null;
  /** Alice's claims in each hour after the update. */
  claimsPerHour: number[];
}

/**
 * The laptop already runs the new client and has a self group; the phone
 * updates with its older KeyPackages still queued on the server. Steps the
 * clock a minute at a time (every device syncs each step, about as often as
 * the idle poll) until both share a self group and the phone has the read.
 */
async function phoneUpdates(
  world: World,
  alice: TestUser,
  laptop: TestDevice,
  phone: TestDevice,
  g: string,
  maxMinutes: number
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
    readStateSynced: null,
    claimsPerHour: [],
  };
  const uploads = uploadsOf(world, phoneKey);
  const updated = await update(world, alice, phone);
  const start = world.clock.now();
  const claimsAtStart = claimsOf(world, "alice");
  const minutes = () => (world.clock.now() - start) / MINUTE;
  const first = (value: number | null, now: boolean): number | null =>
    value ?? (now ? minutes() : null);
  for (let step = 0; step <= maxMinutes; step += 1) {
    await settle(world);
    timeline.capableKeyPackages = first(
      timeline.capableKeyPackages,
      uploadsOf(world, phoneKey) > uploads
    );
    timeline.sharedGroup = first(
      timeline.sharedGroup,
      selfGroupsOf(world, "alice").some(
        (group) => group.roster.has(phoneKey) && group.roster.has(laptopKey)
      )
    );
    timeline.readStateSynced = first(
      timeline.readStateSynced,
      updated.engine.getConversation(g)?.unread === 0
    );
    const hour = Math.floor(minutes() / 60);
    const earlier = timeline.claimsPerHour
      .slice(0, hour)
      .reduce((sum, count) => sum + count, 0);
    timeline.claimsPerHour[hour] =
      claimsOf(world, "alice") - claimsAtStart - earlier;
    if (timeline.sharedGroup !== null && timeline.readStateSynced !== null) {
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

/** Self-group claims keep to their budget: 24 an hour per profile. */
const SELF_GROUP_BUDGET = 24;

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

    const timeline = await phoneUpdates(world, alice, laptop, phone, g, 10);
    // The phone replaces its last-resort KeyPackage as it starts, waits
    // two minutes to be added, then makes its own self group with the
    // laptop, whose KeyPackages are capable: one claim.
    expect(timeline.capableKeyPackages).toBe(0);
    expect(timeline.sharedGroup ?? Infinity).toBeLessThanOrEqual(4);
    expect(timeline.readStateSynced ?? Infinity).toBeLessThanOrEqual(4);
    expect(timeline.claimsPerHour[0]).toBeLessThanOrEqual(SELF_GROUP_BUDGET);
    for (const device of world.devices) device.engine.dispose();
  });

  it("shares a self group within the hour's budget when the laptop's KeyPackages are older too", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice", { readSync: false });
    runsOlderClient(world, alice.primary, keyPackages.old);
    const phone = await olderClientDevice(world, alice, keyPackages.old);
    await settle(world);
    // The laptop updates first; the phone stays on the older client.
    const laptop = await update(world, alice, alice.primary);
    const claims = countClaims(laptop, keyOf(phone));
    for (let step = 0; step < 24; step += 1) {
      await settle(world);
      world.clock.advance(5 * MINUTE);
    }
    // While the phone runs the older client, the laptop claims its
    // KeyPackages within the budget (about two hours here).
    expect(selfGroupsOf(world, "alice")).toHaveLength(1);
    expect(claims()).toBeGreaterThan(0);
    expect(claims()).toBeLessThanOrEqual(2 * SELF_GROUP_BUDGET);

    const g = await readOnLaptop(world, laptop);
    const timeline = await phoneUpdates(world, alice, laptop, phone, g, 150);
    expect(timeline.capableKeyPackages).toBe(0);
    // An older queue holds up to 30 KeyPackages; the device with the
    // lowest key spends 22 claims an hour on self groups, the other 2, so
    // one of them reaches a capable KeyPackage within about 70 minutes.
    expect(timeline.sharedGroup ?? Infinity).toBeLessThanOrEqual(80);
    expect(timeline.readStateSynced ?? Infinity).toBeLessThanOrEqual(
      (timeline.sharedGroup ?? Infinity) + 1
    );
    for (const claimsInHour of timeline.claimsPerHour) {
      expect(claimsInHour).toBeLessThanOrEqual(SELF_GROUP_BUDGET);
    }
    for (const device of world.devices) device.engine.dispose();
  });

  /**
   * The laptop has a self group; the phone, on the older client with one
   * older KeyPackage left in its queue, updates but makes no self group of
   * its own (it made one today), so only the laptop can add it.
   */
  async function onlyTheLaptopCanAdd() {
    const world = await createWorld();
    const alice = await addUser(world, "alice", { readSync: true });
    const laptop = alice.primary;
    await settle(world);
    const phone = await olderClientDevice(world, alice, keyPackages.old);
    const g = await readOnLaptop(world, laptop);
    const phoneKey = keyOf(phone);
    // The phone goes offline with two older KeyPackages queued; one is
    // kept back to be queued again before it updates.
    stopDevice(world, phone);
    const pool = poolOf(world, phoneKey);
    if (!pool) throw new Error("no KeyPackages");
    pool.oneTime.splice(2);
    const [spare] = pool.oneTime.splice(1);
    if (!spare) throw new Error("no spare KeyPackage");
    // The laptop claims through the queue to the phone's last-resort
    // KeyPackage, which lacks the capability: an older client, which it
    // then leaves alone.
    const laptopRecord = () => contextOf(laptop).device?.readSync;
    for (
      let step = 0;
      step < 12 && laptopRecord()?.claimedThrough?.[phoneKey] === undefined;
      step += 1
    ) {
      world.clock.advance(11 * MINUTE);
      await settle(world);
    }
    expect(laptopRecord()?.claimedThrough?.[phoneKey]).toBeDefined();
    // An hour later the budget is free again; one older KeyPackage queued.
    world.clock.advance(61 * MINUTE);
    await settle(world);
    pool.oneTime.unshift(spare);
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
    // its self group at once and claims through the older KeyPackage: two
    // claims, within even the smallest share of the budget.
    await listDevices();
    expect(maintained).toEqual([laptopGroup.g]);
    expect(laptopGroup.roster.has(phoneKey)).toBe(true);
    expect(claims()).toBe(2);
    expect(updated.engine.getConversation(g)?.unread).toBe(0);
    for (const device of world.devices) device.engine.dispose();
  });

  it("stops claiming for self groups until the server's window ends after a 429", async () => {
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
    world.ds.addFault({
      method: "POST",
      path: /^e2ee\/key-packages\/claim$/u,
      status: 429,
      code: "E2EE_RATE_LIMITED",
    });
    await listDevices();
    expect(rateLimited(world, "alice")).toBe(1);
    expect(laptopGroup.roster.has(phoneKey)).toBe(false);
    // The pass went on without the phone: nothing failed.
    expect(laptop.engine.getError()).toBeNull();

    // Until the window ends, maintenance claims nothing for the self group.
    const hour = 60 * MINUTE;
    const windowEnd = world.clock.now() - (world.clock.now() % hour) + hour;
    const before = claims();
    while (world.clock.now() + 11 * MINUTE < windowEnd) {
      world.clock.advance(11 * MINUTE);
      await settle(world);
    }
    expect(claims()).toBe(before);

    // Then it claims through again and adds the phone, within the hour's
    // budget (the refused claim counted too).
    for (
      let step = 0;
      step < 7 && !laptopGroup.roster.has(phoneKey);
      step += 1
    ) {
      world.clock.advance(11 * MINUTE);
      await settle(world);
    }
    expect(laptopGroup.roster.has(phoneKey)).toBe(true);
    expect(world.clock.now()).toBeLessThanOrEqual(windowEnd + 72 * MINUTE);
    expect(updated.engine.getConversation(g)?.unread).toBe(0);
    for (const device of world.devices) device.engine.dispose();
  });

  it("leaves the hourly claim limit to new chats while four devices catch up (prxt)", async () => {
    const world = await createWorld();
    // The server's limits: 120 claims per profile and 30 claims of a
    // device per clock hour.
    world.ds.limitClaims({
      perProfile: 120,
      perTargetDevice: 30,
      windowMs: 60 * MINUTE,
    });
    const alice = await addUser(world, "alice", { readSync: true });
    const laptop = alice.primary;
    await settle(world);
    // Four devices on the older client, each with a full queue of older
    // KeyPackages.
    const phones: TestDevice[] = [];
    for (let index = 0; index < 4; index += 1) {
      phones.push(await olderClientDevice(world, alice, keyPackages.old));
    }
    await settle(world);
    // Their queues are full: each older client uploads more of its own.
    for (const phone of phones) {
      await fillQueue(world, phone);
      expect(poolOf(world, keyOf(phone))?.oneTime.length).toBe(30);
    }

    // All four update at once.
    const updated: TestDevice[] = [];
    for (const phone of phones) {
      updated.push(await update(world, alice, phone));
    }
    const start = world.clock.now();
    // The same devices, by the keys they had before updating.
    const keys = [laptop, ...phones].map(keyOf);
    const together = () =>
      selfGroupsOf(world, "alice").some((group) =>
        keys.every((key) => group.roster.has(key))
      );
    let contacts = 0;
    let allTogether: number | null = null;
    /** Per clock hour: Alice's claims, and how many new chats she started. */
    const hours = new Map<number, { claims: number; chats: number }>();
    const hourOf = () => Math.floor(world.clock.now() / (60 * MINUTE));
    const hourEntry = () => {
      const entry = hours.get(hourOf()) ?? { claims: 0, chats: 0 };
      hours.set(hourOf(), entry);
      return entry;
    };
    let claimsSoFar = claimsOf(world, "alice");
    const countHour = () => {
      const now = claimsOf(world, "alice");
      hourEntry().claims += now - claimsSoFar;
      claimsSoFar = now;
    };
    for (let step = 0; step < 12 * 12 && allTogether === null; step += 1) {
      await settle(world);
      countHour();
      if (step % 3 === 1) {
        // A new encrypted chat, from one of Alice's devices in turn: never
        // rate-limited.
        contacts += 1;
        const contact = `contact${contacts}`;
        await addUser(world, contact);
        const starter = [laptop, ...updated][contacts % 5] ?? laptop;
        await expect(
          starter.engine.createConversation({
            profileIds: [contact],
            kind: "dm",
          })
        ).resolves.toMatch(/^0x/u);
        countHour();
        hourEntry().chats += 1;
      }
      if (together()) {
        allTogether = (world.clock.now() - start) / MINUTE;
      }
      world.clock.advance(5 * MINUTE);
    }
    expect(rateLimited(world, "alice")).toBe(0);
    // Each new chat takes one claim; the rest stays within the self-group
    // budget in every clock hour, leaving at least 96 of the 120.
    for (const { claims, chats } of hours.values()) {
      expect(claims - chats).toBeLessThanOrEqual(SELF_GROUP_BUDGET);
    }
    // One self group holds all five within the 12 hours simulated.
    expect(allTogether).not.toBeNull();
    for (const device of world.devices) device.engine.dispose();
  });
});
