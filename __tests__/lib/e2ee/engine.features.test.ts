/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Notify hints,
 * attachments, policy, reports, search, notices, stalls, split view,
 * maintenance timers and restarts.
 */
import {
  messageDigest,
  verifyEd25519,
} from "@/tests/support/e2ee/fakeDeliveryService.cjs";

import { base64ToBytes } from "@/lib/e2ee/bytes";

import {
  addUser,
  createWorld,
  notices,
  settle,
  startDevice,
  stopDevice,
  texts,
} from "./support/harness";

jest.setTimeout(180_000);

const DAY = 86_400_000;

async function trio() {
  const world = await createWorld();
  const alice = await addUser(world, "alice");
  const bob = await addUser(world, "bob");
  const carol = await addUser(world, "carol");
  const g = await alice.primary.engine.createConversation({
    profileIds: ["bob", "carol"],
    kind: "group",
    name: "Features",
  });
  await settle(world);
  return {
    world,
    alice,
    bob,
    carol,
    g,
    a: alice.primary.engine,
    b: bob.primary.engine,
    c: carol.primary.engine,
  };
}

describe("E2EE engine: features", () => {
  it("sends content-free notify hints with mention and reply kinds", async () => {
    const { world, a, b, g } = await trio();
    await a.send(g, { text: "plain secret words" });
    await settle(world);
    const first = b
      .getMessages(g)
      .find((m) => m.text === "plain secret words")!;
    await b.send(g, {
      text: "reply secret",
      reply: first.id,
      mentions: ["carol"],
    });
    await settle(world);
    const log = world.ds.state.notifyLog;
    expect(log).toHaveLength(2);
    expect(
      log[0]!.hints.sort((x, y) => x.profile_id.localeCompare(y.profile_id))
    ).toEqual([
      { profile_id: "bob", kind: "message" },
      { profile_id: "carol", kind: "message" },
    ]);
    expect(
      log[1]!.hints.sort((x, y) => x.profile_id.localeCompare(y.profile_id))
    ).toEqual([
      { profile_id: "alice", kind: "reply" },
      { profile_id: "carol", kind: "mention" },
    ]);
    const serialized = JSON.stringify(log);
    expect(serialized).not.toContain("secret");
    expect(
      world.ds.state.wakes.filter((w) => w.reason === "message")
    ).toHaveLength(4);
    expect(a.getConversation(g)?.mentions).toBe(0);
    expect(
      world.users.get("carol")!.primary.engine.getConversation(g)?.mentions
    ).toBe(1);
  });

  it("round-trips an attachment", async () => {
    const { world, a, b, g } = await trio();
    const bytes = new Uint8Array(1_500_000).map((_, i) => i % 256);
    const file = new File([bytes], "photo.png", { type: "image/png" });
    await a.send(g, { text: "see attached", files: [file] });
    await settle(world);
    const message = b.getMessages(g).find((m) => m.text === "see attached")!;
    expect(message.attachments).toEqual([
      {
        blob: expect.stringMatching(/^0x[0-9a-f]{32}$/),
        mime: "image/png",
        size: bytes.length,
        name: "photo.png",
      },
    ]);
    expect(JSON.stringify(message)).not.toMatch(/"k"|"n"/);
    const blob = await b.getAttachment(
      g,
      message.id,
      message.attachments[0]!.blob
    );
    expect(blob.type).toBe("image/png");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });

  it("refuses attachments while the server switch is off", async () => {
    const { world, a, b, g } = await trio();
    expect(a.getAttachmentsEnabled()).toBe(true);
    world.ds.setAttachmentsEnabled(false);
    // The engine re-reads GET /e2ee/me on its 10-minute maintenance pass.
    world.clock.advance(11 * 60_000);
    await a.sync();
    await settle(world);
    expect(a.getAttachmentsEnabled()).toBe(false);
    const file = new File([new Uint8Array(10)], "photo.png", {
      type: "image/png",
    });
    await expect(
      a.send(g, { text: "with a file", files: [file] })
    ).rejects.toMatchObject({ code: "E2EE_ATTACHMENTS_DISABLED" });
    await a.send(g, { text: "text only" });
    await settle(world);
    expect(
      b.getMessages(g).some((message) => message.text === "text only")
    ).toBe(true);
    expect(world.ds.state["blobs"].size).toBe(0);
  });

  it("refuses DMs to profiles with policy NOBODY or blocks (eligibility and claim)", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "nobody");
    await addUser(world, "blocker");
    await addUser(world, "blocked");
    await addUser(world, "follower-only");
    world.ds.setDmPolicy("nobody", "NOBODY");
    world.ds.block("blocker", "alice");
    world.ds.block("alice", "blocked");
    world.ds.setDmPolicy("follower-only", "PEOPLE_I_FOLLOW");
    const a = alice.primary.engine;
    await expect(
      a.checkEligibility([
        "nobody",
        "blocker",
        "blocked",
        "follower-only",
        "ghost",
      ])
    ).resolves.toEqual([
      {
        profileId: "nobody",
        status: "POLICY",
        reason: "DM_RECIPIENT_NOT_ACCEPTING",
      },
      // The target's block looks exactly like a closed inbox.
      {
        profileId: "blocker",
        status: "POLICY",
        reason: "DM_RECIPIENT_NOT_ACCEPTING",
      },
      // Only the viewer's own block is reported as BLOCKED.
      {
        profileId: "blocked",
        status: "BLOCKED",
        reason: "DM_SENDER_BLOCKED_RECIPIENT",
      },
      {
        profileId: "follower-only",
        status: "POLICY",
        reason: "DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY",
      },
      { profileId: "ghost", status: "NO_DEVICES", reason: null },
    ]);
    await expect(
      a.createConversation({ profileIds: ["nobody"], kind: "dm" })
    ).rejects.toThrow("E2EE_POLICY");
    await expect(
      a.createConversation({ profileIds: ["blocker"], kind: "dm" })
    ).rejects.toThrow("E2EE_POLICY");
    await expect(
      a.createConversation({ profileIds: ["blocked"], kind: "dm" })
    ).rejects.toThrow("E2EE_BLOCKED");
    expect(a.getConversations()).toEqual([]);
    world.ds.follow("follower-only", "alice");
    await expect(
      a.createConversation({ profileIds: ["follower-only"], kind: "dm" })
    ).resolves.toMatch(/^0x/);
  });

  it("admits members of the recipient's chosen group (and people they follow)", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await addUser(world, "member-only");
    await addUser(world, "outsider-only");
    await addUser(world, "strict");
    world.ds.setDmGroup("member-only", ["alice"]);
    world.ds.setDmGroup("outsider-only", ["someone-else"]);
    world.ds.setDmGroup("strict", ["someone-else"], false);
    world.ds.follow("strict", "alice");
    const a = alice.primary.engine;
    await expect(
      a.checkEligibility(["member-only", "outsider-only", "strict"])
    ).resolves.toEqual([
      { profileId: "member-only", status: "OK", reason: null },
      {
        profileId: "outsider-only",
        status: "POLICY",
        reason: "DM_RECIPIENT_GROUP_MEMBERS_ONLY",
      },
      {
        profileId: "strict",
        status: "POLICY",
        reason: "DM_RECIPIENT_GROUP_MEMBERS_ONLY",
      },
    ]);
    world.ds.follow("outsider-only", "alice");
    await expect(a.checkEligibility(["outsider-only"])).resolves.toEqual([
      { profileId: "outsider-only", status: "OK", reason: null },
    ]);
    await expect(
      a.createConversation({ profileIds: ["strict"], kind: "dm" })
    ).rejects.toThrow("E2EE_POLICY");
    await expect(
      a.createConversation({ profileIds: ["member-only"], kind: "dm" })
    ).resolves.toMatch(/^0x/);
  });

  it("refuses Welcomes from an inviter the user blocked", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    // Bob's client knows he blocked alice; the server-side block is not set,
    // so the server delivers the Welcome and the client must refuse it.
    const bob = await addUser(world, "bob", {
      isBlocked: (id) => id === "alice",
    });
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    expect(bob.primary.engine.getConversation(g)).toBeNull();
    const bobKey = bob.primary.engine.getThisDevice()!.deviceKey;
    expect(world.ds.state["deliveries"].get(bobKey) ?? []).toEqual([]);
  });

  it("reports a message with a payload the server can verify", async () => {
    const { world, a, b, g } = await trio();
    await a.send(g, { text: "report me" });
    await settle(world);
    const message = b.getMessages(g).find((m) => m.text === "report me")!;
    await b.report(g, message.id, "CREDIBLE_THREAT_OF_VIOLENCE", "notes");
    const [report] = world.ds.state.reports;
    expect(report).toMatchObject({
      verified: true,
      sender_profile_id: "alice",
      reason: "CREDIBLE_THREAT_OF_VIOLENCE",
    });
    const body = base64ToBytes(report!.body);
    expect(JSON.parse(new TextDecoder().decode(body))).toMatchObject({
      t: "msg",
      text: "report me",
    });
    expect(messageDigest(g, a.getConversation(g)!.epoch, body)).toMatch(/^0x/);
    expect(
      verifyEd25519(
        "0x" + "00".repeat(32),
        "0x" + "00".repeat(32),
        "0x" + "00".repeat(64)
      )
    ).toBe(false);
  });

  it("reports an edited message as its signed edit, the original only on request", async () => {
    const { world, a, b, g } = await trio();
    await a.send(g, { text: "see you at noon" });
    await settle(world);
    const sent = b.getMessages(g).find((m) => m.text === "see you at noon")!;
    await a.edit(g, sent.id, "a threat edited in");
    await settle(world);
    expect(b.getMessages(g).find((m) => m.id === sent.id)!.text).toBe(
      "a threat edited in"
    );
    expect(b.reportPreview(g, sent.id)).toEqual({
      latest: { text: "a threat edited in", attachmentNames: [] },
      original: { text: "see you at noon", attachmentNames: [] },
    });

    const decode = (body: string) =>
      JSON.parse(new TextDecoder().decode(base64ToBytes(body)));
    await b.report(g, sent.id, "CREDIBLE_THREAT_OF_VIOLENCE");
    expect(world.ds.state.reports).toHaveLength(1);
    const [latest] = world.ds.state.reports;
    expect(latest).toMatchObject({
      verified: true,
      sender_profile_id: "alice",
    });
    expect(decode(latest!.body)).toMatchObject({
      t: "edit",
      target: sent.id,
      text: "a threat edited in",
    });

    await b.report(g, sent.id, "CREDIBLE_THREAT_OF_VIOLENCE", undefined, {
      includeOriginal: true,
    });
    const [, edited, original] = world.ds.state.reports;
    expect(decode(edited!.body)).toMatchObject({ t: "edit" });
    expect(original).toMatchObject({ verified: true });
    expect(decode(original!.body)).toMatchObject({
      t: "msg",
      text: "see you at noon",
    });
  });

  it("searches locally", async () => {
    const { world, a, b, g } = await trio();
    await a.send(g, { text: "The quick brown fox" });
    await b.send(g, { text: "lazy dog" });
    await settle(world);
    expect((await b.search("QUICK")).map((m) => m.text)).toEqual([
      "The quick brown fox",
    ]);
    expect((await b.search("dog", g)).map((m) => m.text)).toEqual(["lazy dog"]);
    expect(await b.search("nothing")).toEqual([]);
    const searchRequests = world.ds.state.requests.filter((r) =>
      r.path.includes("search")
    );
    expect(searchRequests).toEqual([]);
  });

  it("shows joined, left, removed and device notices", async () => {
    const { world, alice, a, b, g } = await trio();
    await addUser(world, "dave");
    await a.addMembers(g, ["dave"]);
    await settle(world);
    await world.users.get("dave")!.primary.engine.leave(g);
    await settle(world);
    await a.removeMember(g, "carol");
    await settle(world);
    const laptop = await startDevice(world, "alice", alice.account);
    alice.devices.push(laptop);
    await settle(world);
    expect(notices(b.getMessages(g))).toEqual([
      "created",
      "joined",
      "left",
      "removed",
      "device_added",
    ]);
  });

  it("raises the delayed banner after 20 s of failing commits, then recovers", async () => {
    const { world, alice, a, b, c, g } = await trio();
    const laptop = await startDevice(world, "alice", alice.account);
    alice.devices.push(laptop);
    await settle(world);
    // Revoke alice's laptop directly at the server: every member now owes a
    // STRICT removal before sending (8.3).
    await laptop.engine.revokeDevice(laptop.engine.getThisDevice()!.deviceKey);
    const removeFault = world.ds.addFault({
      method: "POST",
      path: /\/entries$/,
      status: 500,
      times: -1,
    });
    const start = world.clock.now();
    await b.send(g, { text: "blocked until the change goes through" });
    expect(world.clock.now() - start).toBeGreaterThanOrEqual(20_000);
    expect(b.getConversation(g)?.delayed).toBe(true);
    expect(b.getMessages(g).at(-1)).toMatchObject({ pending: true });
    removeFault();
    await settle(world);
    expect(b.getConversation(g)?.delayed).toBe(false);
    expect(texts(c.getMessages(g))).toEqual([
      "blocked until the change goes through",
    ]);
    expect(texts(a.getMessages(g))).toEqual([
      "blocked until the change goes through",
    ]);
  });

  it("raises the split-view alarm for a forged epoch_fp", async () => {
    const { world, a, b, g } = await trio();
    world.ds.setTamper((item, context) =>
      item.type === "message" && context.profileId === "bob"
        ? { ...item, epoch_fp: "0123456789abcdef" }
        : item
    );
    await a.send(g, { text: "forged fp" });
    await settle(world);
    expect(b.getConversation(g)?.splitView).toBe(true);
    expect(a.getConversation(g)?.splitView).toBe(false);
  });

  it("pauses an INVALID group and restarts with the same people", async () => {
    const { world, a, b, c, g } = await trio();
    // Corrupt the next entry for bob only: the declared values no longer
    // match what MLS derives, so bob must refuse it.
    world.ds.setTamper((item, context) =>
      item.type === "entry" && context.profileId === "bob"
        ? { ...item, epoch_commitment: `0x${"11".repeat(32)}` }
        : item
    );
    await a.rename(g, "tampered");
    await settle(world);
    expect(b.getConversation(g)?.status).toBe("invalid");
    await expect(b.send(g, { text: "x" })).rejects.toThrow(
      "E2EE_CONVERSATION_INACTIVE"
    );
    world.ds.setTamper(null);
    const fresh = await b.restart(g);
    await settle(world);
    expect(fresh).not.toBe(g);
    expect(
      a
        .getConversation(fresh)
        ?.members.map((m) => m.profileId)
        .sort()
    ).toEqual(["alice", "bob", "carol"]);
    expect(c.getConversation(fresh)?.status).toBe("active");
  });

  it("self-updates every 14 days and evicts devices idle for 60 days", async () => {
    const { world, a, b, c, g } = await trio();
    const epoch = a.getConversation(g)!.epoch;
    world.clock.advance(15 * DAY);
    await settle(world);
    // Every member self-updated once.
    expect(a.getConversation(g)!.epoch).toBeGreaterThanOrEqual(epoch + 3);
    expect(
      notices(b.getMessages(g)).filter((n) => n === "safety_code_changed")
        .length
    ).toBeGreaterThanOrEqual(1);

    // Carol's device goes quiet; after 60 days the others remove it.
    const carolDevice = world.devices.find((d) => d.engine === c)!;
    stopDevice(world, carolDevice);
    // Online devices keep self-updating every 14 days, so only carol idles.
    for (let step = 0; step < 5; step += 1) {
      world.clock.advance(13 * DAY);
      await settle(world);
    }
    expect(
      a
        .getConversation(g)!
        .members.map((m) => m.profileId)
        .sort()
    ).toEqual(["alice", "bob"]);
  });

  it("restores from storage after a reload and keeps working", async () => {
    const { world, bob, a, g } = await trio();
    await a.send(g, { text: "before reload" });
    await settle(world);
    stopDevice(world, bob.primary);
    const reloaded = await startDevice(world, "bob", bob.account, {
      storage: bob.primary.storage,
    });
    expect(reloaded.engine.getStatus()).toBe("ready");
    expect(reloaded.signCalls).toBe(0);
    expect(texts(reloaded.engine.getMessages(g))).toEqual(["before reload"]);
    await a.send(g, { text: "after reload" });
    await settle(world);
    expect(texts(reloaded.engine.getMessages(g))).toEqual([
      "before reload",
      "after reload",
    ]);
    await reloaded.engine.send(g, { text: "bob is back" });
    await settle(world);
    expect(texts(a.getMessages(g))).toContain("bob is back");
  });
});
