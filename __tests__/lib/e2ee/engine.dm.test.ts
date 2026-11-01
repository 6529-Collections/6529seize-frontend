/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. 1:1 DMs.
 */
import {
  addUser,
  createWorld,
  notices,
  settle,
  texts,
} from "./support/harness";

jest.setTimeout(120_000);

describe("E2EE engine: direct messages", () => {
  it("enrolls, creates a DM, sends, edits, deletes and reacts with one signature per device", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    expect(alice.primary.engine.getStatus()).toBe("ready");
    expect(bob.primary.engine.getStatus()).toBe("ready");
    expect(alice.primary.engine.getThisDevice()).toMatchObject({
      isThisDevice: true,
      verified: true,
    });

    const a = alice.primary.engine;
    const b = bob.primary.engine;
    const g = await a.createConversation({ profileIds: ["bob"], kind: "dm" });
    expect(a.findDm("bob")).toBe(g);
    await expect(
      a.createConversation({ profileIds: ["bob"], kind: "dm" })
    ).resolves.toBe(g);
    await settle(world);

    expect(b.getConversation(g)).toMatchObject({
      kind: "dm",
      status: "active",
      name: null,
    });
    expect(b.findDm("alice")).toBe(g);
    expect(
      b.getConversation(g)?.members.find((m) => m.profileId === "alice")
    ).toMatchObject({ handle: "alice", isAdmin: true });
    expect(a.getConversation(g)?.safetyCode).toBe(
      b.getConversation(g)?.safetyCode
    );
    expect(notices(b.getMessages(g))).toEqual(["created"]);

    await a.send(g, { text: "hello bob" });
    await settle(world);
    expect(texts(b.getMessages(g))).toEqual(["hello bob"]);
    expect(texts(a.getMessages(g))).toEqual(["hello bob"]);
    const sent = b.getMessages(g).find((m) => m.text === "hello bob");
    expect(sent).toMatchObject({
      senderProfileId: "alice",
      sigOk: true,
      pending: false,
    });
    expect(b.getConversation(g)?.unread).toBe(1);
    b.markRead(g);
    expect(b.getConversation(g)?.unread).toBe(0);

    await b.send(g, { text: "hi alice", reply: sent!.id });
    await settle(world);
    const reply = a.getMessages(g).find((m) => m.text === "hi alice");
    expect(reply).toMatchObject({ senderProfileId: "bob", reply: sent!.id });

    await a.edit(g, sent!.id, "hello bob (edited)");
    await b.react(g, sent!.id, ":fire:", true);
    await settle(world);
    expect(b.getMessages(g).find((m) => m.id === sent!.id)).toMatchObject({
      text: "hello bob (edited)",
      reactions: { ":fire:": ["bob"] },
    });
    expect(a.getMessages(g).find((m) => m.id === sent!.id)).toMatchObject({
      text: "hello bob (edited)",
      reactions: { ":fire:": ["bob"] },
    });
    await expect(b.edit(g, sent!.id, "not mine")).rejects.toThrow(
      "E2EE_NOT_SENDER"
    );

    await b.react(g, sent!.id, ":fire:", false);
    await a.remove(g, sent!.id);
    await settle(world);
    for (const engine of [a, b]) {
      const removed = engine.getMessages(g).find((m) => m.id === sent!.id);
      expect(removed).toMatchObject({ deleted: true, text: "", reactions: {} });
    }

    expect(alice.primary.signCalls).toBe(1);
    expect(bob.primary.signCalls).toBe(1);
  });
});
