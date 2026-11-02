/** @jest-environment node */
import { addUser, createWorld, settle, stopDevice } from "./support/harness";

jest.setTimeout(120_000);
it("edits, reacts, replies, searches, reports and backs up records outside the active page", async () => {
  const world = await createWorld();
  const alice = await addUser(world, "alice");
  const bob = await addUser(world, "bob", undefined, { noWake: true });
  const a = alice.primary.engine;
  const b = bob.primary.engine;
  try {
    const g = await a.createConversation({ profileIds: ["bob"], kind: "dm" });
    await settle(world);
    await a.send(g, { text: "oldest target" });
    const id = a
      .getMessages(g)
      .find((message) => message.text === "oldest target")!.id;
    for (let i = 0; i < 350; i++)
      await a.send(g, { text: `later message ${i}` });
    await b.sync();
    await b.idle();
    expect(a.getMessages(g).some((message) => message.id === id)).toBe(false);
    expect(b.getMessages(g).some((message) => message.id === id)).toBe(false);
    await b.react(g, id, "👍", true);
    await a.sync();
    await a.idle();
    expect((await a.getMessage?.(g, id))?.reactions["👍"]).toEqual(["bob"]);
    await a.edit(g, id, "edited oldest target");
    await b.sync();
    await b.idle();
    expect(
      (await b.search("edited oldest target", g)).map((message) => message.id)
    ).toEqual([id]);
    expect(await b.reportPreview(g, id)).toMatchObject({
      latest: { text: "edited oldest target" },
      original: { text: "oldest target" },
    });
    await b.send(g, { text: "reply to evicted history", reply: id });
    expect(world.ds.state.notifyLog.at(-1)?.hints).toContainEqual({
      profile_id: "alice",
      kind: "reply",
    });
    await a.remove(g, id);
    await b.sync();
    await b.idle();
    expect(await b.search("edited oldest target", g)).toEqual([]);
    const history = await b.backupHistory();
    expect(
      history.messages.filter((message) => message.kind === "message")
    ).toHaveLength(352);
    expect(history.messages.find((message) => message.id === id)).toMatchObject(
      { deleted: true }
    );
    await b.importBackupHistory(history);
    expect((await b.backupHistory()).messages).toHaveLength(
      history.messages.length
    );
  } finally {
    for (const device of [...world.devices]) {
      stopDevice(world, device);
      await device.engine.idle();
    }
  }
});
