/**
 * @jest-environment node
 */
import type { StoredGroup } from "@/lib/e2ee/records";
import {
  createIndexedDbE2eeStorage,
  createMemoryE2eeStorage,
  E2EE_DB_NAME,
  type E2eeStorage,
} from "@/lib/e2ee/storage";
import { checkpoint, type EngineContext } from "@/lib/e2ee/engine/context";
import { createFakeIndexedDb } from "./support/fakeIndexedDb";

const group = (g: string, cursor: number): StoredGroup =>
  ({ g, status: "active", cursor }) as unknown as StoredGroup;

const fake = createFakeIndexedDb();
let uninstall: () => void = () => undefined;

beforeAll(() => {
  uninstall = fake.install();
});

afterAll(() => {
  uninstall();
});

const backends: [string, () => E2eeStorage][] = [
  ["memory", () => createMemoryE2eeStorage()],
  [
    "indexeddb",
    () => {
      // A fresh database per test: delete, then open lazily.
      fake.factory.deleteDatabase(E2EE_DB_NAME);
      return createIndexedDbE2eeStorage(fake.factory);
    },
  ],
];

describe.each(backends)("%s storage state version", (_name, create) => {
  it("starts at 0 and moves on with every compare-and-swap write", async () => {
    const storage = create();
    expect(await storage.getStateVersion("p1")).toBe(0);
    await storage.writeBatch("p1", {
      expectedVersion: 0,
      wasmState: new Uint8Array([1]),
    });
    await storage.writeBatch("p1", {
      expectedVersion: 1,
      groups: [group("g1", 1)],
    });
    expect(await storage.getStateVersion("p1")).toBe(2);
    expect(await storage.getWasmState("p1")).toEqual(new Uint8Array([1]));
    expect(await storage.getStateVersion("p2")).toBe(0);
  });

  it("refuses a stale tab's write and keeps the newer state", async () => {
    const storage = create();
    // Both tabs load version 0; tab A writes first.
    await storage.writeBatch("p1", {
      expectedVersion: 0,
      wasmState: new Uint8Array([2, 2]),
      groups: [group("g1", 5)],
    });
    const stale = storage.writeBatch("p1", {
      expectedVersion: 0,
      wasmState: new Uint8Array([1]),
      groups: [group("g1", 3)],
    });
    await expect(stale).rejects.toThrow("E2EE_STATE_CONFLICT");
    expect(await storage.getWasmState("p1")).toEqual(new Uint8Array([2, 2]));
    expect(await storage.listGroups("p1")).toEqual([group("g1", 5)]);
    expect(await storage.getStateVersion("p1")).toBe(1);
  });

  it("keeps the counter across a clear so old state cannot come back", async () => {
    const storage = create();
    await storage.writeBatch("p1", {
      expectedVersion: 0,
      wasmState: new Uint8Array([9]),
    });
    await storage.clearProfile("p1");
    expect(await storage.getWasmState("p1")).toBeNull();
    expect(await storage.getStateVersion("p1")).toBe(2);
    await expect(
      storage.writeBatch("p1", {
        expectedVersion: 1,
        wasmState: new Uint8Array([9]),
      })
    ).rejects.toThrow("E2EE_STATE_CONFLICT");
    expect(await storage.getWasmState("p1")).toBeNull();
    await expect(storage.clearProfile("p1", 1)).rejects.toThrow(
      "E2EE_STATE_CONFLICT"
    );
  });

  it("lets the sign-in key adoption write without a version", async () => {
    const storage = create();
    await storage.writeBatch("p1", { wasmState: new Uint8Array([4]) });
    expect(await storage.getStateVersion("p1")).toBe(0);
    expect(await storage.getWasmState("p1")).toEqual(new Uint8Array([4]));
  });
});

describe("engine checkpoint", () => {
  const ctxFor = (storage: E2eeStorage, onStateConflict: () => void) =>
    ({
      storage,
      profileId: "p1",
      mls: null,
      lastState: null,
      stateVersion: 0,
      persistChain: Promise.resolve(),
      disposed: false,
      options: { onStateConflict },
    }) as unknown as EngineContext;

  it("writes with its version, and stops once another engine wrote newer state", async () => {
    const storage = createMemoryE2eeStorage();
    const onConflict = jest.fn();
    const ctx = ctxFor(storage, onConflict);
    await checkpoint(ctx, { skipWasm: true });
    await checkpoint(ctx, { skipWasm: true });
    expect(ctx.stateVersion).toBe(2);

    // Another tab's engine writes version 3.
    await storage.writeBatch("p1", { expectedVersion: 2 });
    await expect(checkpoint(ctx, { skipWasm: true })).rejects.toThrow(
      "E2EE_STATE_CONFLICT"
    );
    expect(ctx.disposed).toBe(true);
    expect(onConflict).toHaveBeenCalledTimes(1);
    expect(await storage.getStateVersion("p1")).toBe(3);
  });

  it("serialises concurrent checkpoints instead of tripping over itself", async () => {
    const storage = createMemoryE2eeStorage();
    const onConflict = jest.fn();
    const ctx = ctxFor(storage, onConflict);
    await Promise.all([
      checkpoint(ctx, { skipWasm: true }),
      checkpoint(ctx, { skipWasm: true }),
      checkpoint(ctx, { skipWasm: true }),
    ]);
    expect(ctx.stateVersion).toBe(3);
    expect(onConflict).not.toHaveBeenCalled();
  });
});
