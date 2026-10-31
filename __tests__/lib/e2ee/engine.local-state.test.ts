/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. Local state safety:
 * a second engine on the same browser storage never overwrites newer state,
 * and a wipe also drops the encrypted-backup state.
 */
import {
  type BackupLocalState,
  createMemoryBackupStateStore,
} from "@/lib/e2ee/backup/state";
import { addUser, createWorld, settle, startDevice } from "./support/harness";

jest.setTimeout(180_000);

describe("E2EE engine: local state", () => {
  it("a stale second engine on the same storage stops instead of overwriting newer state", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    await settle(world);
    const storage = alice.primary.storage;

    // A second tab opens the same profile on the same browser storage.
    const onStateConflict = jest.fn();
    const stale = await startDevice(world, "alice", alice.account, {
      storage,
      enroll: false,
      extra: { onStateConflict },
    });
    expect(stale.engine.getStatus()).toBe("ready");
    await stale.engine.idle();
    await alice.primary.engine.idle();

    // The other tab moves the state on; this engine's copy is now old.
    const before = await storage.getStateVersion("alice");
    const labelBefore = (await storage.getDevice("alice"))?.label;
    const stateBefore = await storage.getWasmState("alice");
    await storage.writeBatch("alice", { expectedVersion: before });

    await expect(stale.engine.renameThisDevice("Second tab")).rejects.toThrow(
      "E2EE_STATE_CONFLICT"
    );
    expect(onStateConflict).toHaveBeenCalledTimes(1);
    expect(await storage.getStateVersion("alice")).toBe(before + 1);
    expect(await storage.getWasmState("alice")).toEqual(stateBefore);
    expect((await storage.getDevice("alice"))?.label).toBe(labelBefore);
  });

  it("wiping a revoked device also deletes its encrypted-backup state", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const backupState = createMemoryBackupStateStore();
    const laptop = await startDevice(world, "alice", alice.account, {
      noWake: true,
      extra: { backupState },
    });
    alice.devices.push(laptop);
    await settle(world);
    const laptopKey =
      (await laptop.storage.getDevice("alice"))?.deviceKey ?? "";
    await backupState.put({
      profileId: "alice",
      deviceKey: laptopKey,
      backupId: "backup-1",
    } as BackupLocalState);

    await alice.primary.engine.revokeDevice(laptopKey);
    await laptop.engine.sync();

    expect(laptop.engine.getStatus()).toBe("needs-enrollment");
    expect(await backupState.get("alice")).toBeNull();
    expect(await laptop.storage.getWasmState("alice")).toBeNull();
    expect(await laptop.storage.getDevice("alice")).toBeNull();
  });
});
