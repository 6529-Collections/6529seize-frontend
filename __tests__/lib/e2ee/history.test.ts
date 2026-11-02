/** @jest-environment node */
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { createIndexedDbE2eeStorage, E2EE_DB_NAME } from "@/lib/e2ee/storage";
import { historyKey } from "@/lib/e2ee/history-order";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import {
  cacheMessage,
  loadHistoryPage,
  updateHistorySummary,
} from "@/lib/e2ee/engine/history";
import type { StoredGroup, StoredMessage } from "@/lib/e2ee/records";
import type { EngineContext } from "@/lib/e2ee/engine/context";

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
      messages.put({ ...message(7), profileId: "p" });
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
  expect(await storage.pageMessages("p", "g")).toEqual([message(7)]);
});

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
  await loadHistoryPage(ctx, runtime);
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
});
