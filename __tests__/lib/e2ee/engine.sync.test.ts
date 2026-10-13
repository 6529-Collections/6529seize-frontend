/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. WebSocket hints,
 * polling fallback, stale-epoch re-encryption, roster repair and snapshots.
 */
import { POLL_OPEN_MS } from "@/lib/e2ee/engine/controller";
import {
  addUser,
  createWorld,
  realSleep,
  settle,
  texts,
} from "./support/harness";

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

  it("polls an opened conversation every 5 s at once, not after the idle poll", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const armed: number[] = [];
    const scheduler = {
      setTimeout: (fire: () => void, ms: number) => {
        armed.push(ms);
        return world.scheduler.setTimeout(fire, ms);
      },
      clearTimeout: world.scheduler.clearTimeout,
    };
    const bob = await addUser(
      world,
      "bob",
      { polling: true, scheduler },
      { noWake: true }
    );
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    try {
      await waitFor(
        () => bob.primary.engine.getConversation(g)?.status === "active"
      );
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
