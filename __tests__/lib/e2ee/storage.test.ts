/**
 * @jest-environment node
 */
import type {
  StoredDevice,
  StoredGroup,
  StoredMessage,
  StoredOutboxItem,
} from "@/lib/e2ee/records";
import {
  createIndexedDbE2eeStorage,
  createMemoryE2eeStorage,
  E2EE_DB_NAME,
  hasStoredE2eeDevice,
} from "@/lib/e2ee/storage";

import { createFakeIndexedDb } from "./support/fakeIndexedDb";

const device = (profileId: string): StoredDevice => ({
  profileId,
  deviceKey: `0x${"11".repeat(32)}`,
  wallet: `0x${"22".repeat(20)}`,
  grant: {
    wallet: `0x${"22".repeat(20)}`,
    device_key: `0x${"11".repeat(32)}`,
    ciphersuite: 79,
    issued_at: 1,
    expires_at: 60,
    origin: "localhost:3001",
  },
  grantId: `0x${"33".repeat(32)}`,
  walletSignature: "0x00",
  registered: true,
  provisioned: true,
  label: "Device",
  platform: "web",
  createdAt: 1,
  lastResortAt: null,
});

const group = (g: string): StoredGroup =>
  ({ g, status: "active", cursor: 3 }) as unknown as StoredGroup;

const message = (g: string, id: string): StoredMessage =>
  ({ id, g, seq: 1, kind: "message", text: "hi" }) as unknown as StoredMessage;

const outbox = (g: string, id: string): StoredOutboxItem =>
  ({ id, g, createdAt: 1, sealed: null }) as unknown as StoredOutboxItem;

describe("memory storage", () => {
  it("writes batches and reads them back per profile", async () => {
    const storage = createMemoryE2eeStorage();
    await storage.writeBatch("p1", {
      device: device("p1"),
      wasmState: new Uint8Array([1, 2, 3]),
      groups: [group("g1"), group("g2")],
      messages: [message("g1", "m1"), message("g1", "m2"), message("g2", "m3")],
      outbox: [outbox("g1", "o1")],
    });
    await storage.writeBatch("p2", { groups: [group("g9")] });

    expect(await storage.getDevice("p1")).toEqual(device("p1"));
    expect(await storage.getDevice("p2")).toBeNull();
    expect(await storage.getWasmState("p1")).toEqual(new Uint8Array([1, 2, 3]));
    expect((await storage.listGroups("p1")).map((g) => g.g).sort()).toEqual([
      "g1",
      "g2",
    ]);
    expect((await storage.listGroups("p2")).map((g) => g.g)).toEqual(["g9"]);
    expect(
      (await storage.listMessages("p1", "g1")).map((m) => m.id).sort()
    ).toEqual(["m1", "m2"]);
    expect((await storage.listOutbox("p1")).map((o) => o.id)).toEqual(["o1"]);
  });

  it("returns copies, deletes and clears", async () => {
    const storage = createMemoryE2eeStorage();
    await storage.writeBatch("p1", {
      groups: [group("g1")],
      messages: [message("g1", "m1"), message("g1", "m2")],
      outbox: [outbox("g1", "o1")],
      wasmState: new Uint8Array([9]),
    });
    const [copy] = await storage.listGroups("p1");
    copy!.cursor = 99;
    expect((await storage.listGroups("p1"))[0]!.cursor).toBe(3);

    await storage.writeBatch("p1", {
      deleteMessages: [{ g: "g1", id: "m1" }],
      deleteOutbox: ["o1"],
    });
    expect((await storage.listMessages("p1", "g1")).map((m) => m.id)).toEqual([
      "m2",
    ]);
    expect(await storage.listOutbox("p1")).toEqual([]);

    await storage.writeBatch("p1", { deleteGroups: ["g1"] });
    expect(await storage.listGroups("p1")).toEqual([]);
    expect(await storage.listMessages("p1", "g1")).toEqual([]);

    await storage.writeBatch("p1", {
      device: device("p1"),
      groups: [group("g3")],
    });
    await storage.clearProfile("p1");
    expect(await storage.getDevice("p1")).toBeNull();
    expect(await storage.getWasmState("p1")).toBeNull();
    expect(await storage.listGroups("p1")).toEqual([]);
  });

  it("reports no stored device without IndexedDB", async () => {
    await expect(hasStoredE2eeDevice("p1")).resolves.toBe(false);
  });
});

describe("IndexedDB storage", () => {
  const { factory, install } = createFakeIndexedDb();
  let restore: () => void;

  beforeAll(() => {
    restore = install();
  });

  afterAll(() => {
    restore();
  });

  it("round-trips a batch and encrypts the WASM state at rest", async () => {
    const storage = createIndexedDbE2eeStorage(factory);
    const state = new TextEncoder().encode("secret mls state bytes");
    await storage.writeBatch("p1", {
      device: device("p1"),
      wasmState: state,
      groups: [group("g1"), group("g2")],
      messages: [message("g1", "m1"), message("g1", "m2"), message("g2", "m3")],
      outbox: [outbox("g1", "o1")],
    });
    await storage.writeBatch("p2", {
      groups: [group("g9")],
      wasmState: new Uint8Array([7]),
    });

    expect(await storage.getDevice("p1")).toEqual(device("p1"));
    expect(await storage.getWasmState("p1")).toEqual(state);
    expect(await storage.getWasmState("p2")).toEqual(new Uint8Array([7]));
    expect((await storage.listGroups("p1")).map((g) => g.g).sort()).toEqual([
      "g1",
      "g2",
    ]);
    expect(
      (await storage.listMessages("p1", "g1")).map((m) => m.id).sort()
    ).toEqual(["m1", "m2"]);
    expect((await storage.listOutbox("p1")).map((o) => o.id)).toEqual(["o1"]);
    const [stored] = (await storage.listGroups("p1")).filter(
      (g) => g.g === "g1"
    );
    expect(stored).not.toHaveProperty("profileId");

    // The raw record holds ciphertext under a non-extractable key.
    const raw = await rawRecord(factory, "wasm", "p1");
    expect(
      Buffer.from(new Uint8Array(raw["ciphertext"] as ArrayBuffer)).toString()
    ).not.toContain("secret");
    const keyRecord = await rawRecord(factory, "keys", "p1");
    expect((keyRecord["key"] as CryptoKey).extractable).toBe(false);
  });

  it("deletes groups with their messages and clears a profile", async () => {
    const storage = createIndexedDbE2eeStorage(factory);
    await storage.writeBatch("p3", {
      device: device("p3"),
      wasmState: new Uint8Array([1]),
      groups: [group("g1"), group("g2")],
      messages: [message("g1", "m1"), message("g2", "m2")],
      outbox: [outbox("g2", "o1")],
    });
    await storage.writeBatch("p3", {
      deleteGroups: ["g1"],
      deleteOutbox: ["o1"],
    });
    expect((await storage.listGroups("p3")).map((g) => g.g)).toEqual(["g2"]);
    expect(await storage.listMessages("p3", "g1")).toEqual([]);
    expect((await storage.listMessages("p3", "g2")).map((m) => m.id)).toEqual([
      "m2",
    ]);
    expect(await storage.listOutbox("p3")).toEqual([]);
    await storage.writeBatch("p3", { deleteMessages: [{ g: "g2", id: "m2" }] });
    expect(await storage.listMessages("p3", "g2")).toEqual([]);
    await storage.clearProfile("p3");
    expect(await storage.getDevice("p3")).toBeNull();
    expect(await storage.getWasmState("p3")).toBeNull();
    expect(await storage.listGroups("p3")).toEqual([]);
  });

  it("reports an enrolled device through the default storage", async () => {
    const previous = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
    (globalThis as { indexedDB?: IDBFactory }).indexedDB = factory;
    try {
      await createIndexedDbE2eeStorage(factory).writeBatch("p4", {
        device: device("p4"),
      });
      await expect(hasStoredE2eeDevice("p4")).resolves.toBe(true);
      await expect(hasStoredE2eeDevice("p5")).resolves.toBe(false);
    } finally {
      (globalThis as { indexedDB?: IDBFactory | undefined }).indexedDB =
        previous;
    }
  });
});

function rawRecord(
  factory: IDBFactory,
  store: string,
  key: string
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const open = factory.open(E2EE_DB_NAME, 1);
    open.onsuccess = () => {
      const request = open.result
        .transaction(store, "readonly")
        .objectStore(store)
        .get(key);
      request.onsuccess = () => {
        resolve(request.result as Record<string, unknown>);
      };
      request.onerror = () => {
        reject(request.error ?? new Error("read failed"));
      };
    };
  });
}
