/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. WebSocket hints,
 * polling fallback, stale-epoch re-encryption, roster repair and snapshots.
 */
import type { EngineContext } from "@/lib/e2ee/engine/context";
import {
  type EngineController,
  POLL_OPEN_MS,
} from "@/lib/e2ee/engine/controller";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import { queueMessage } from "@/lib/e2ee/engine/send";
import {
  addUser,
  createWorld,
  realSleep,
  settle,
  startDevice,
  stopDevice,
  texts,
  type TestDevice,
} from "./support/harness";

/** Engine internals, to stage a send left waiting in the outbox. */
const internals = (device: TestDevice) =>
  device.engine as unknown as {
    ctx: EngineContext;
    controller: EngineController;
  };

jest.setTimeout(120_000);

async function waitFor(check: () => boolean, ms = 5_000): Promise<void> {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) {
      throw new Error("condition not met in time");
    }
    await realSleep(5);
  }
}

describe("E2EE engine: sync paths", () => {
  it("follows WebSocket hints without explicit syncs", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await waitFor(
      () => bob.primary.engine.getConversation(g)?.status === "active"
    );
    await alice.primary.engine.send(g, { text: "pushed" });
    await waitFor(() =>
      texts(bob.primary.engine.getMessages(g)).includes("pushed")
    );
  });

  it("falls back to polling when no hints arrive", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(
      world,
      "bob",
      { polling: true },
      { noWake: true }
    );
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await waitFor(
      () => bob.primary.engine.getConversation(g)?.status === "active"
    );
    bob.primary.engine.setOpenConversation(g);
    await alice.primary.engine.send(g, { text: "polled" });
    await waitFor(() =>
      texts(bob.primary.engine.getMessages(g)).includes("polled")
    );
    bob.primary.engine.dispose();
  });

  it("never names the open conversation in its fast poll (D175)", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(
      world,
      "bob",
      { polling: true },
      { noWake: true }
    );
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    const other = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "group",
      name: "Other",
    });
    try {
      await waitFor(
        () =>
          bob.primary.engine.getConversation(g)?.status === "active" &&
          bob.primary.engine.getConversation(other)?.status === "active"
      );
      await bob.primary.engine.idle();
      const bobGets = () =>
        world.ds.state.requests.filter(
          (r) => r.profileId === "bob" && r.method === "GET"
        );
      const start = bobGets().length;
      bob.primary.engine.setOpenConversation(g);
      const listings = () =>
        bobGets()
          .slice(start)
          .filter((r) => /^e2ee\/devices\/0x[0-9a-f]+\/groups$/.test(r.path))
          .length;
      // Several fast polls while nothing is new: only the device's group
      // listing, never the open conversation's log or record.
      await waitFor(() => listings() >= 3);
      const named = (handle: string) =>
        bobGets()
          .slice(start)
          .filter((r) => r.path.startsWith(`e2ee/groups/${handle}`));
      expect(named(g)).toEqual([]);
      // A new item in another chat is fetched for that chat only.
      await alice.primary.engine.send(other, { text: "elsewhere" });
      await waitFor(() =>
        texts(bob.primary.engine.getMessages(other)).includes("elsewhere")
      );
      expect(named(other).length).toBeGreaterThan(0);
      expect(named(g)).toEqual([]);
      // The open chat is fetched once it has something new.
      await alice.primary.engine.send(g, { text: "here" });
      await waitFor(() =>
        texts(bob.primary.engine.getMessages(g)).includes("here")
      );
    } finally {
      bob.primary.engine.dispose();
    }
  });

  it("flushes a waiting send on the next changed-groups pass, whichever chat is open", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob", {}, { noWake: true });
    const opened = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    const other = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "group",
      name: "Other",
    });
    await settle(world);
    const { ctx, controller } = internals(bob.primary);
    // A send left waiting in the outbox, as after a failed or delayed try.
    await queueMessage(ctx, other, { text: "waiting" });
    expect(ctx.store.groups.get(other)?.outbox.size).toBe(1);

    const start = world.ds.state.requests.length;
    const bobRequests = () =>
      world.ds.state.requests.slice(start).filter((r) => r.profileId === "bob");
    bob.primary.engine.setOpenConversation(opened);
    await controller.syncChanged();
    await bob.primary.engine.idle();
    // The waiting send went out; nothing named the chat that was opened.
    expect(ctx.store.groups.get(other)?.outbox.size).toBe(0);
    expect(
      bobRequests().some(
        (r) => r.method === "POST" && r.path === `e2ee/groups/${other}/messages`
      )
    ).toBe(true);
    expect(
      bobRequests().filter((r) => r.path.startsWith(`e2ee/groups/${opened}`))
    ).toEqual([]);
    await alice.primary.engine.sync();
    expect(texts(alice.primary.engine.getMessages(other))).toContain("waiting");
    bob.primary.engine.dispose();
  });

  it("keeps listedThrough in memory only, so a reload catches up afresh", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    // The commit that added Bob lies outside his delivery window, so his
    // cursor stays behind the group's last_seq once he has caught up.
    const record = (await bob.primary.storage.listGroups("bob")).find(
      (item) => item.g === g
    );
    if (!record) throw new Error("no stored group");
    expect(record).not.toHaveProperty("listedThrough");
    expect(newRuntime(record).listedThrough).toBeUndefined();

    stopDevice(world, bob.primary);
    const start = world.ds.state.requests.length;
    const restarted = await startDevice(world, "bob", bob.account, {
      storage: bob.primary.storage,
      enroll: false,
    });
    await restarted.engine.sync();
    await restarted.engine.idle();
    const fetches = world.ds.state.requests
      .slice(start)
      .filter(
        (r) => r.profileId === "bob" && r.path === `e2ee/groups/${g}/log`
      );
    expect(fetches.length).toBeGreaterThan(0);
    restarted.engine.dispose();
  });

  it("polls an opened conversation every 5 s even after a local lookup-resume event", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const armed: number[] = [];
    let wake: ((event: { type: string; data: unknown }) => void) | undefined;
    const scheduler = {
      setTimeout: (fire: () => void, ms: number) => {
        armed.push(ms);
        return world.scheduler.setTimeout(fire, ms);
      },
      clearTimeout: world.scheduler.clearTimeout,
    };
    const bob = await addUser(world, "bob", {
      polling: true,
      scheduler,
      onWake: (listener) => {
        wake = listener;
        return () => {
          wake = undefined;
        };
      },
    });
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    try {
      await waitFor(
        () => bob.primary.engine.getConversation(g)?.status === "active"
      );
      expect(wake).toBeDefined();
      wake?.({ type: "E2EE_LOOKUP_RESUME", data: {} });
      armed.length = 0;
      bob.primary.engine.setOpenConversation(g);
      // Re-armed at once at the open-conversation cadence (contract 12).
      expect(armed).toContain(POLL_OPEN_MS);
    } finally {
      bob.primary.engine.dispose();
    }
  });

  it("re-encrypts a message that lost the race with a commit (409 STALE)", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const carol = await addUser(world, "carol");
    const a = alice.primary.engine;
    const g = await a.createConversation({
      profileIds: ["bob", "carol"],
      kind: "group",
      name: "Stale",
    });
    await a.setAdmin(g, "bob", true);
    await settle(world);
    const gate = world.ds.hold(/\/messages$/);
    const sending = a.send(g, { text: "raced" });
    await waitFor(() => gate.waiting() === 1);
    await bob.primary.engine.rename(g, "moved on");
    gate.release();
    await sending;
    await settle(world);
    const stale = world.ds.state.requests.filter(
      (r) => r.code === "E2EE_EPOCH_STALE"
    );
    expect(stale.length).toBeGreaterThan(0);
    expect(texts(carol.primary.engine.getMessages(g))).toEqual(["raced"]);
    expect(texts(bob.primary.engine.getMessages(g))).toEqual(["raced"]);
  });

  it("repairs a server roster that drifted from the MLS leaves", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const a = alice.primary.engine;
    const g = await a.createConversation({
      profileIds: ["bob"],
      kind: "group",
      name: "Repair",
    });
    await settle(world);
    const bobKey = bob.primary.engine.getThisDevice()!.deviceKey;
    // Simulate a delivery-service glitch: bob silently drops off the roster.
    world.ds.group(g).roster.delete(bobKey);
    await a.rename(g, "after the glitch");
    await settle(world);
    expect(world.ds.state.rosterRepairs).toBeGreaterThanOrEqual(1);
    expect(world.ds.group(g).roster.has(bobKey)).toBe(true);
  });

  it("serves immutable snapshots and notifies subscribers", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "bob");
    const a = alice.primary.engine;
    const listener = jest.fn();
    const unsubscribe = a.subscribe(listener);
    const g = await a.createConversation({ profileIds: ["bob"], kind: "dm" });
    await settle(world);
    expect(listener).toHaveBeenCalled();
    const list = a.getConversations();
    expect(a.getConversations()).toBe(list);
    const messages = a.getMessages(g);
    expect(a.getMessages(g)).toBe(messages);
    await a.send(g, { text: "change" });
    expect(a.getConversations()).not.toBe(list);
    expect(a.getMessages(g)).not.toBe(messages);
    expect(messages).toHaveLength(messages.length);
    unsubscribe();
    listener.mockClear();
    await a.send(g, { text: "after unsubscribe" });
    await realSleep(5);
    expect(listener).not.toHaveBeenCalled();
  });
});
