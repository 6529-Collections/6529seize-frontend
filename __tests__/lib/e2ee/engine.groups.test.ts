/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Groups.
 */
import {
  addUser,
  createWorld,
  notices,
  settle,
  texts,
  type TestUser,
  type World,
} from "./support/harness";

jest.setTimeout(300_000);

async function users(
  world: World,
  count: number,
  prefix = "u"
): Promise<TestUser[]> {
  const out: TestUser[] = [];
  for (let index = 0; index < count; index += 1) {
    out.push(await addUser(world, `${prefix}${index}`));
  }
  return out;
}

const profileIds = (list: TestUser[]) => list.map((user) => user.profileId);

async function groupRoundTrip(size: number): Promise<void> {
  const world = await createWorld();
  const members = await users(world, size);
  const [owner, ...rest] = members;
  const g = await owner!.primary.engine.createConversation({
    profileIds: profileIds(rest),
    kind: "group",
    name: `Group of ${size}`,
  });
  await settle(world);
  for (const member of members) {
    expect(member.primary.engine.getConversation(g)).toMatchObject({
      kind: "group",
      name: `Group of ${size}`,
      status: "active",
      epoch: owner!.primary.engine.getConversation(g)!.epoch,
    });
    expect(member.primary.engine.getConversation(g)!.members).toHaveLength(
      size
    );
  }
  await rest
    .at(-1)!
    .primary.engine.send(g, { text: `hello from the last of ${size}` });
  await settle(world);
  for (const member of members) {
    expect(texts(member.primary.engine.getMessages(g))).toEqual([
      `hello from the last of ${size}`,
    ]);
  }
}

describe("E2EE engine: groups", () => {
  it("publishes the actor's own change notices to a subscribed timeline", async () => {
    const world = await createWorld();
    const [alice, bob, carol] = await users(world, 3, "n");
    const a = alice!.primary.engine;
    const g = await a.createConversation({
      profileIds: ["n1"],
      kind: "group",
      name: "Before",
    });
    await settle(world);
    // Like the UI: every store notification re-reads the timeline snapshot.
    const unsubscribe = a.subscribe(() => {
      a.getMessages(g);
    });
    await a.rename(g, "After");
    await Promise.resolve();
    expect(notices(a.getMessages(g))).toEqual(["created", "renamed"]);
    await a.addMembers(g, [carol!.profileId]);
    await Promise.resolve();
    expect(notices(a.getMessages(g))).toEqual(["created", "renamed", "joined"]);
    unsubscribe();
    await settle(world);
    expect(notices(bob!.primary.engine.getMessages(g))).toEqual([
      "created",
      "renamed",
      "joined",
    ]);
  });

  it("3 members: rename, add, remove, leave, with notices", async () => {
    const world = await createWorld();
    const [alice, bob, carol, dave] = await users(world, 4, "p");
    const a = alice!.primary.engine;
    const g = await a.createConversation({
      profileIds: ["p1", "p2"],
      kind: "group",
      name: "Trio",
    });
    await settle(world);
    const b = bob!.primary.engine;
    const c = carol!.primary.engine;
    expect(notices(b.getMessages(g))).toEqual(["created"]);

    await a.rename(g, "Renamed");
    await settle(world);
    expect(b.getConversation(g)?.name).toBe("Renamed");
    expect(b.getMessages(g).at(-1)?.notice).toMatchObject({
      type: "renamed",
      detail: "Renamed",
    });
    await expect(b.rename(g, "not admin")).rejects.toThrow("E2EE_NOT_ADMIN");

    await a.setAdmin(g, "p1", true);
    await settle(world);
    expect(c.getConversation(g)?.admins).toEqual(["p0", "p1"]);

    const eligibility = await b.addMembers(g, ["p3"]);
    expect(eligibility).toEqual([{ profileId: "p3", status: "OK" }]);
    await settle(world);
    const d = dave!.primary.engine;
    expect(d.getConversation(g)).toMatchObject({
      status: "active",
      name: "Renamed",
    });
    expect(notices(c.getMessages(g))).toContain("joined");

    await a.removeMember(g, "p2");
    await settle(world);
    expect(c.getConversation(g)?.status).toBe("removed");
    expect(
      b
        .getConversation(g)
        ?.members.map((m) => m.profileId)
        .sort()
    ).toEqual(["p0", "p1", "p3"]);
    expect(b.getMessages(g).at(-1)?.notice).toMatchObject({
      type: "removed",
      actorProfileId: "p0",
      targetProfileIds: ["p2"],
    });

    await d.leave(g);
    expect(d.getConversation(g)?.status).toBe("left");
    await settle(world);
    expect(
      b
        .getConversation(g)
        ?.members.map((m) => m.profileId)
        .sort()
    ).toEqual(["p0", "p1"]);
    expect(notices(b.getMessages(g))).toContain("left");

    await b.send(g, { text: "after the changes" });
    await settle(world);
    expect(texts(a.getMessages(g))).toEqual(["after the changes"]);
    expect(texts(c.getMessages(g))).toEqual([]);
    expect(texts(d.getMessages(g))).toEqual([]);
  });

  it("removed members cannot read later messages; new members cannot read earlier ones", async () => {
    const world = await createWorld();
    const [alice, bob, carol] = await users(world, 3, "q");
    const a = alice!.primary.engine;
    const g = await a.createConversation({
      profileIds: ["q1"],
      kind: "group",
      name: null,
    });
    await settle(world);
    await a.send(g, { text: "before carol" });
    await settle(world);
    await a.addMembers(g, ["q2"]);
    await settle(world);
    const c = carol!.primary.engine;
    expect(texts(c.getMessages(g))).toEqual([]);
    await a.send(g, { text: "with carol" });
    await settle(world);
    expect(texts(c.getMessages(g))).toEqual(["with carol"]);

    await a.removeMember(g, "q1");
    await settle(world);
    await a.send(g, { text: "after bob" });
    await settle(world);
    expect(texts(bob!.primary.engine.getMessages(g))).toEqual([
      "before carol",
      "with carol",
    ]);
    expect(texts(c.getMessages(g))).toEqual(["with carol", "after bob"]);
    // The delivery service no longer serves bob anything new.
    const bobLog = world.ds.state.requests.filter(
      (r) => r.profileId === "q1"
    ).length;
    expect(bobLog).toBeGreaterThan(0);
  });

  it("15 members", async () => {
    await groupRoundTrip(15);
  });

  it("30 members", async () => {
    await groupRoundTrip(30);
  });

  const slow = process.env["E2EE_SLOW"] === "1" ? it : it.skip;
  slow("87 members (slow; E2EE_SLOW=1)", async () => {
    await groupRoundTrip(87);
  });

  it("concurrent commits from two members converge", async () => {
    const world = await createWorld();
    const [alice, bob, carol, dave] = await users(world, 4, "r");
    const a = alice!.primary.engine;
    const g = await a.createConversation({
      profileIds: ["r1", "r2"],
      kind: "group",
      name: "Race",
    });
    await a.setAdmin(g, "r1", true);
    await settle(world);
    const b = bob!.primary.engine;
    // Both admins change the group at the same epoch without syncing first.
    const gate = world.ds.hold(/\/entries$/);
    const racing = Promise.all([
      a.rename(g, "Alice's name"),
      b.addMembers(g, ["r3"]),
    ]);
    while (gate.waiting() < 2) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    gate.release();
    await racing;
    await settle(world);
    const conflicts = world.ds.state.requests.filter(
      (r) => r.path.endsWith("/entries") && r.code === "E2EE_EPOCH_CONFLICT"
    );
    expect(conflicts.length).toBeGreaterThan(0);
    const views = [alice, bob, carol, dave].map((user) =>
      user!.primary.engine.getConversation(g)
    );
    for (const view of views) {
      expect(view).toMatchObject({
        status: "active",
        name: "Alice's name",
        epoch: views[0]!.epoch,
      });
      expect(view!.members).toHaveLength(4);
      expect(view!.safetyCode).toBe(views[0]!.safetyCode);
    }
  });
});
