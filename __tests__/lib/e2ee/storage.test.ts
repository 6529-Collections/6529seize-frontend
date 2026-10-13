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
  createMemoryE2eeStorage,
  hasStoredE2eeDevice,
} from "@/lib/e2ee/storage";

const device = (profileId: string): StoredDevice => ({
  profileId,
  deviceKey: `0x${"11".repeat(32)}`,
  wallet: `0x${"22".repeat(20)}`,
  grant: {
    wallet: `0x${"22".repeat(20)}`,
    device_key: `0x${"11".repeat(32)}`,
    ciphersuite: 1,
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
