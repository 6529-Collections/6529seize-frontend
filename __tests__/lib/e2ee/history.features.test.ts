/** @jest-environment node */
import {
  addUser,
  createWorld,
  settle,
  stopDevice,
  startDevice,
} from "./support/harness";

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
    const firstSnapshot = a
      .getMessages(g)
      .find((message) => message.text === "oldest target")!;
    const id = firstSnapshot.id;
    for (let i = 0; i < 350; i++) {
      await a.send(g, { text: `later message ${i}` });
      if (i === 0)
        expect(a.getMessages(g).find((message) => message.id === id)).toBe(
          firstSnapshot
        );
    }
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
    const latest = b
      .getMessages(g)
      .find((message) => message.text === "reply to evicted history")!;
    await b.remove(g, latest.id);
    expect(b.getConversation(g)?.lastMessage).toMatchObject({
      id: latest.id,
      deleted: true,
      text: "",
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

it("resumes an interrupted backlog from the last atomic checkpoint", async () => {
  const world = await createWorld();
  const alice = await addUser(world, "alice");
  const bob = await addUser(world, "bob", undefined, { noWake: true });
  const a = alice.primary.engine;
  const storage = bob.primary.storage;
  const write = storage.writeBatch.bind(storage);
  let receiver: Awaited<ReturnType<typeof startDevice>> | null = null;
  try {
    const g = await a.createConversation({ profileIds: ["bob"], kind: "dm" });
    await settle(world);
    stopDevice(world, bob.primary);
    await bob.primary.engine.idle();
    for (let i = 0; i < 450; i++)
      await a.send(g, { text: `interruption fixture ${i}` });
    let pages = 0;
    storage.writeBatch = async (profile, batch) => {
      if (batch.messages?.some((message) => message.kind === "message")) {
        pages++;
        if (pages === 2) {
          receiver?.engine.dispose();
          throw new Error("QA interrupted checkpoint");
        }
      }
      return write(profile, batch);
    };
    receiver = await startDevice(world, "bob", bob.account, {
      storage,
      noWake: true,
    });
    await receiver.engine.sync().catch(() => undefined);
    await receiver.engine.idle();
    stopDevice(world, receiver);
    await receiver.engine.idle();
    storage.writeBatch = write;
    const cursor = (await storage.listGroups("bob"))[0]!.cursor;
    expect(cursor).toBeGreaterThan(1);
    expect(cursor).toBeLessThan(451);
    const requestsBefore = world.ds.state.requests.length;
    const cursors: number[] = [];
    const api = bob.primary.options.api;
    const recovered = await startDevice(world, "bob", bob.account, {
      storage,
      noWake: true,
      extra: {
        api: {
          ...api,
          getLog: (group, options) => {
            cursors.push(options.afterSeq ?? 0);
            return api.getLog(group, options);
          },
        },
      },
    });
    await recovered.engine.sync();
    await recovered.engine.idle();
    expect(
      (await recovered.engine.backupHistory()).messages.filter(
        (message) => message.kind === "message"
      )
    ).toHaveLength(450);
    expect(
      (await recovered.engine.backupHistory()).messages.some(
        (message) => message.undecryptable
      )
    ).toBe(false);
    expect(cursors.length).toBeGreaterThan(0);
    expect(cursors.every((value) => value >= cursor)).toBe(true);
    expect(
      world.ds.state.requests
        .slice(requestsBefore)
        .filter((request) => request.path.endsWith("/log")).length
    ).toBeGreaterThan(0);
  } finally {
    storage.writeBatch = write;
    for (const device of [...world.devices]) {
      stopDevice(world, device);
      await device.engine.idle();
    }
  }
});

it("surfaces an initial saved-history read failure and clears it on retry", async () => {
  const world = await createWorld();
  const alice = await addUser(world, "alice");
  await addUser(world, "bob");
  try {
    const engine = alice.primary.engine;
    const g = await engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    jest
      .spyOn(alice.primary.storage, "pageMessages")
      .mockRejectedValueOnce(new Error("Read unavailable"));
    engine.setOpenConversation(g);
    await engine.idle();
    expect(engine.getConversation(g)?.historyError).toBe(true);
    await engine.loadHistory?.(g);
    expect(engine.getConversation(g)?.historyError).toBe(false);
  } finally {
    for (const device of [...world.devices]) {
      stopDevice(world, device);
      await device.engine.idle();
    }
  }
});
