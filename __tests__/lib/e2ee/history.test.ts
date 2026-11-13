/** @jest-environment node */
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { createIndexedDbE2eeStorage, E2EE_DB_NAME } from "@/lib/e2ee/storage";
import { historyKey, emptyHistorySummary } from "@/lib/e2ee/history-order";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import {
  cacheMessage,
  historyAround,
  loadHistoryPage,
  updateHistorySummary,
  trimHistory,
} from "@/lib/e2ee/engine/history";
import type { StoredGroup, StoredMessage } from "@/lib/e2ee/records";
import type { EngineContext } from "@/lib/e2ee/engine/context";
import { checkpoint } from "@/lib/e2ee/engine/context";
import { EngineStore } from "@/lib/e2ee/engine/store";
import type { DeviceDirectory } from "@/lib/e2ee/engine/directory";

const message = (
  seq: number,
  changes: Partial<StoredMessage> = {}
): StoredMessage => ({
  id: `m-${seq}`,
  g: "g",
  seq,
  kind: "message",
  senderProfileId: "other",
  senderDeviceKey: null,
  ts: seq,
  serverTs: seq,
  text: `message ${seq}`,
  mentions: [],
  reply: null,
  attachments: [],
  editedAt: null,
  deleted: false,
  reactions: {},
  sigOk: true,
  undecryptable: false,
  pending: false,
  epoch: null,
  body: null,
  sig: null,
  ...changes,
});

beforeAll(() => {
  globalThis.IDBKeyRange = IDBKeyRange;
});

it("does not double unread or history counts when an atomic write is retried", async () => {
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  const runtime = newRuntime({
    g: "g",
    readSeq: 0,
    history: emptyHistorySummary(),
  } as StoredGroup);
  await storage.writeBatch("p", { groups: [runtime.record] });
  const ctx = {
    storage,
    profileId: "p",
    store: { touch: jest.fn() },
    mls: null,
    stateVersion: 0,
    persistChain: Promise.resolve(),
    disposed: false,
    options: {},
  } as unknown as EngineContext;
  const incoming = message(1, { mentions: ["p"] });
  runtime.messages.set(incoming.id, incoming);
  runtime.dirty.add(incoming.id);
  jest
    .spyOn(storage, "writeBatch")
    .mockRejectedValueOnce(new Error("Storage temporarily unavailable"));
  await expect(
    checkpoint(ctx, { groups: [runtime], skipWasm: true })
  ).rejects.toThrow("Storage temporarily unavailable");
  expect(runtime.record.history).toMatchObject({
    count: 0,
    unread: 0,
    mentions: 0,
  });
  await checkpoint(ctx, { groups: [runtime], skipWasm: true });
  expect((await storage.listGroups("p"))[0]?.history).toMatchObject({
    count: 1,
    unread: 1,
    mentions: 1,
  });
  expect(await storage.listMessages("p", "g")).toHaveLength(1);
});

it("pages equal-sequence notices, pending messages and profiles without gaps or repeats", async () => {
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  const rows = [
    message(1),
    message(2),
    message(2, { id: "notice-2", kind: "notice" }),
    message(0, { id: "pending", pending: true, ts: 10 }),
  ];
  await storage.writeBatch("p", { messages: rows });
  await storage.writeBatch("q", { messages: [message(99)] });
  const latest = await storage.pageMessages("p", "g", { limit: 2 });
  expect(latest.map((row) => row.id)).toEqual(["m-2", "pending"]);
  const older = await storage.pageMessages("p", "g", {
    before: historyKey(latest[0]!),
    limit: 2,
  });
  expect(older.map((row) => row.id)).toEqual(["m-1", "notice-2"]);
  expect(
    (
      await storage.pageMessages("p", "g", {
        after: historyKey(older.at(-1)!),
        limit: 2,
      })
    ).map((row) => row.id)
  ).toEqual(["m-2", "pending"]);
  expect(await storage.getMessage("q", "g", "m-1")).toBeNull();
});

it("indexes imports and updates deletion/reimport and unread summaries", async () => {
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  const imp = { w: "wave", d: "drop", p: 0 } as NonNullable<
    StoredMessage["imported"]
  >;
  const first = message(1, { imported: imp, mentions: ["p"] });
  await storage.writeBatch("p", {
    messages: [first, message(2, { senderProfileId: "p" })],
  });
  expect(
    (await storage.findImported("p", "g", imp)).map((row) => row.id)
  ).toEqual([first.id]);
  expect(await storage.historySummary("p", "g", 0)).toMatchObject({
    count: 2,
    unread: 1,
    mentions: 1,
  });
  await storage.writeBatch("p", {
    messages: [{ ...first, deleted: true }, message(3, { imported: imp })],
  });
  expect(
    (await storage.findImported("p", "g", imp)).map((row) => row.id)
  ).toEqual(["m-3"]);
  expect(await storage.historySummary("p", "g", 3)).toMatchObject({
    count: 3,
    unread: 0,
    mentions: 0,
  });
});

it("upgrades a v1 database in place without losing history, device or checkpoint", async () => {
  const factory = new IDBFactory();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = factory.open(E2EE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const messages = req.result.createObjectStore("messages", {
        keyPath: ["profileId", "g", "id"],
      });
      messages.createIndex("group", ["profileId", "g"]);
      messages.createIndex("profile", "profileId");
      for (let seq = 1; seq <= 550; seq++)
        messages.put({ ...message(seq), profileId: "p" });
      const groups = req.result.createObjectStore("groups", {
        keyPath: ["profileId", "g"],
      });
      groups.createIndex("profile", "profileId");
      groups.put({ g: "g", profileId: "p", readSeq: 6 });
      const wasm = req.result.createObjectStore("wasm", {
        keyPath: "profileId",
      });
      wasm.put({ profileId: "p", version: 42 });
      req.result
        .createObjectStore("devices", { keyPath: "profileId" })
        .put({ profileId: "p", deviceKey: "device" });
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
  db.close();
  const storage = createIndexedDbE2eeStorage(factory);
  expect(await storage.getStateVersion("p")).toBe(42);
  expect(await storage.getDevice("p")).toMatchObject({ deviceKey: "device" });
  expect(await storage.pageMessages("p", "g", { limit: 1 })).toEqual([
    message(550),
  ]);
  expect(await storage.listMessages("p", "g")).toHaveLength(550);
  expect((await storage.listGroups("p"))[0]?.history).toMatchObject({
    count: 550,
    unread: 544,
    mentions: 0,
    maxSeq: 550,
  });
}, 30_000);

it("upgrades an indexed v2 checkpoint without rewriting its history", async () => {
  const factory = new IDBFactory();
  const row = message(1);
  const history = {
    ...emptyHistorySummary(),
    count: 1,
    maxSeq: 1,
    last: row,
    tail: row,
  };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = factory.open(E2EE_DB_NAME, 2);
    req.onupgradeneeded = () => {
      const messages = req.result.createObjectStore("messages", {
        keyPath: ["profileId", "g", "id"],
      });
      messages.createIndex("group", ["profileId", "g"]);
      messages.createIndex("profile", "profileId");
      for (const [name, field] of [
        ["history-order", "historyOrder"],
        ["last-message", "lastOrder"],
        ["import-source", "importSource"],
        ["unread-seq", "unreadSeq"],
        ["mention-seq", "mentionSeq"],
      ])
        messages.createIndex(name!, ["profileId", "g", field!]);
      messages.put({
        ...row,
        profileId: "p",
        historyOrder: historyKey(row),
        lastOrder: historyKey(row),
      });
      const groups = req.result.createObjectStore("groups", {
        keyPath: ["profileId", "g"],
      });
      groups.createIndex("profile", "profileId");
      groups.put({ g: "g", profileId: "p", readSeq: 1, history });
      req.result.createObjectStore("wasm", { keyPath: "profileId" }).put({
        profileId: "p",
        version: 37,
      });
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
  db.close();
  const storage = createIndexedDbE2eeStorage(factory);
  expect(await storage.getStateVersion("p")).toBe(37);
  expect(await storage.getMessage("p", "g", row.id)).toEqual(row);
  expect((await storage.listGroups("p"))[0]?.history).toEqual(history);
  const current = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = factory.open(E2EE_DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  expect(current.version).toBe(3);
  const indexes = current
    .transaction("messages")
    .objectStore("messages").indexNames;
  expect([...indexes]).toHaveLength(5);
  expect(indexes.contains("group")).toBe(false);
  expect(indexes.contains("profile")).toBe(false);
  current.close();
});

// The 1,500-message IndexedDB fixture and nine page reads need extra time under coverage.
it("retains at most two pages while browsing and preserves offscreen summary counts", async () => {
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  const rows = Array.from({ length: 1500 }, (_, i) => message(i + 1));
  await storage.writeBatch("p", { messages: rows });
  const runtime = newRuntime({
    g: "g",
    readSeq: 0,
    history: await storage.historySummary("p", "g", 0),
  } as StoredGroup);
  const ctx = {
    storage,
    profileId: "p",
    store: { touch: jest.fn() },
  } as unknown as EngineContext;
  runtime.historyError = true;
  await loadHistoryPage(ctx, runtime);
  expect(runtime.historyError).toBe(false);
  expect(runtime.messages.size).toBe(100);
  for (let i = 0; i < 8; i++) {
    const first = [...runtime.messages.values()].sort(
      (a, b) => a.seq - b.seq
    )[0]!;
    await loadHistoryPage(ctx, runtime, { before: historyKey(first) });
    expect(runtime.messages.size).toBeLessThanOrEqual(200);
  }
  const evicted = await storage.getMessage("p", "g", "m-1500");
  expect(evicted).not.toBeNull();
  const target = message(100, { deleted: true });
  cacheMessage(runtime, message(100));
  runtime.messages.set(target.id, target);
  runtime.dirty.add(target.id);
  updateHistorySummary(ctx, runtime);
  expect(runtime.record.history).toMatchObject({ count: 1500, unread: 1499 });
}, 30_000);

it("keeps the incoming notification cursor behind pending sends and outside the history window", async () => {
  const store = new EngineStore("p", { version: 0 } as DeviceDirectory);
  const runtime = newRuntime({
    g: "g",
    status: "active",
    readSeq: 0,
    members: [],
    leaving: [],
    epochFp: "0".repeat(16),
    metadata: { admins: [], kind: "dm", name: null, created_by: "p" },
    history: emptyHistorySummary(),
  } as unknown as StoredGroup);
  store.groups.set("g", runtime);
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  const ctx = { profileId: "p", storage } as EngineContext;
  const rows = [
    message(1),
    message(2, { senderProfileId: "p" }),
    message(3, {
      imported: { w: "old", d: "drop", p: 0 } as NonNullable<
        StoredMessage["imported"]
      >,
    }),
    message(4, { kind: "notice" }),
    message(5, { deleted: true }),
    message(0, { pending: true, senderProfileId: "p" }),
  ];
  for (const row of rows) {
    runtime.messages.set(row.id, row);
    runtime.dirty.add(row.id);
  }
  runtime.windowIds = new Set(["m-0"]);
  const visible = store.getConversation("g");
  expect(visible?.lastMessage?.pending).toBe(true);
  expect(visible?.lastIncomingSeq).toBe(1);
  // The checkpoint persists the cursor before old-window eviction drops the
  // incoming record. A later snapshot still has it without loading history.
  updateHistorySummary(ctx, runtime);
  await storage.writeBatch("p", { groups: [runtime.record] });
  runtime.dirty.clear();
  trimHistory(runtime, true);
  expect(runtime.messages.has("m-1")).toBe(false);
  store.touch("g");
  expect(store.getConversation("g")?.lastIncomingSeq).toBe(1);
  expect((await storage.listGroups("p"))[0]?.history?.lastIncomingSeq).toBe(1);
});

it("silently baselines old checkpoints before importing history", () => {
  const runtime = newRuntime({
    g: "g",
    readSeq: 0,
    history: { ...emptyHistorySummary(), maxSeq: 10 },
  } as StoredGroup);
  const imported = message(11, {
    imported: { w: "old", d: "drop", p: 0 } as NonNullable<
      StoredMessage["imported"]
    >,
  });
  runtime.messages.set(imported.id, imported);
  runtime.dirty.add(imported.id);
  updateHistorySummary({ profileId: "p" } as EngineContext, runtime);
  expect(runtime.record.history).toMatchObject({
    maxSeq: 11,
    lastIncomingSeq: 10,
  });
});

it("refreshes dirty snapshots while unchanged messages retain their identity", () => {
  const store = new EngineStore("p", {} as DeviceDirectory);
  const runtime = newRuntime({ g: "g" } as StoredGroup);
  const changing = message(1);
  runtime.messages.set(changing.id, changing);
  runtime.messages.set("m-2", message(2));
  store.groups.set("g", runtime);
  const before = store.getMessages("g");
  changing.text = "edited before checkpoint";
  runtime.dirty.add(changing.id);
  store.touch("g");
  const after = store.getMessages("g");
  expect(after[0]?.text).toBe("edited before checkpoint");
  expect(before[0]?.text).toBe("message 1");
  expect(after[1]).toBe(before[1]);
});

it("retains offscreen dirty edits without inserting them into a selected history window", async () => {
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  await storage.writeBatch("p", {
    messages: Array.from({ length: 300 }, (_, i) => message(i + 1)),
  });
  const runtime = newRuntime({ g: "g", readSeq: 0 } as StoredGroup);
  const store = new EngineStore("p", {} as DeviceDirectory);
  store.groups.set("g", runtime);
  const ctx = { storage, profileId: "p", store } as unknown as EngineContext;
  await loadHistoryPage(ctx, runtime);
  cacheMessage(runtime, message(1));
  runtime.messages.set("m-1", message(1, { text: "unsaved old edit" }));
  runtime.dirty.add("m-1");
  await loadHistoryPage(ctx, runtime, { before: historyKey(message(201)) });
  expect(store.getMessages("g")).toHaveLength(200);
  expect(store.getMessages("g").some((row) => row.id === "m-1")).toBe(false);
  expect(runtime.messages.get("m-1")?.text).toBe("unsaved old edit");
  runtime.messages.set("m-150", message(150, { text: "unsaved visible edit" }));
  runtime.dirty.add("m-150");
  await historyAround(ctx, runtime, "m-220");
  expect(store.getMessages("g")).toHaveLength(100);
  expect(store.getMessages("g").some((row) => row.id === "m-150")).toBe(false);
  expect(runtime.messages.get("m-150")?.text).toBe("unsaved visible edit");
  await historyAround(ctx, runtime, "m-1");
  expect(store.getMessages("g").find((row) => row.id === "m-1")?.text).toBe(
    "unsaved old edit"
  );
  expect((await storage.getMessage("p", "g", "m-1"))?.text).toBe("message 1");
});

it("keeps a read marker advanced during a failed checkpoint when retrying summary deltas", async () => {
  const storage = createIndexedDbE2eeStorage(new IDBFactory());
  const runtime = newRuntime({
    g: "g",
    readSeq: 0,
    history: { ...emptyHistorySummary(), count: 1, unread: 1 },
  } as StoredGroup);
  await storage.writeBatch("p", {
    groups: [runtime.record],
    messages: [message(1)],
  });
  runtime.messages.set("m-2", message(2, { mentions: ["p"] }));
  runtime.dirty.add("m-2");
  const ctx = {
    storage,
    profileId: "p",
    store: { touch: jest.fn() },
    mls: null,
    stateVersion: 0,
    persistChain: Promise.resolve(),
    disposed: false,
    options: {},
  } as unknown as EngineContext;
  jest.spyOn(storage, "writeBatch").mockImplementationOnce(async () => {
    runtime.record.readSeq = 2;
    throw new Error("Write unavailable");
  });
  await expect(
    checkpoint(ctx, { groups: [runtime], skipWasm: true })
  ).rejects.toThrow("Write unavailable");
  expect(runtime.record.history).toMatchObject({
    count: 1,
    unread: 0,
    mentions: 0,
  });
  await checkpoint(ctx, { groups: [runtime], skipWasm: true });
  expect((await storage.listGroups("p"))[0]?.history).toMatchObject({
    count: 2,
    unread: 0,
    mentions: 0,
  });
});
