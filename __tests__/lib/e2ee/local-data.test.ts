/**
 * @jest-environment node
 */
import {
  createMemoryBackupStateStore,
  E2EE_BACKUP_DB_NAME,
  type BackupLocalState,
} from "@/lib/e2ee/backup/state";
import {
  removeAllE2eeLocalData,
  removeE2eeProfileLocalData,
} from "@/lib/e2ee/local-data";
import {
  createIndexedDbE2eeStorage,
  createMemoryE2eeStorage,
  E2EE_DB_NAME,
} from "@/lib/e2ee/storage";
import type { StoredDevice } from "@/lib/e2ee/records";
import { createFakeIndexedDb } from "./support/fakeIndexedDb";
import { createFakeLocks } from "./support/fakeLocks";

describe("removing encrypted messages from this browser", () => {
  it("sign out of all deletes the engine and backup databases", async () => {
    const fake = createFakeIndexedDb();
    const uninstall = fake.install();
    try {
      const storage = createIndexedDbE2eeStorage(fake.factory);
      await storage.writeBatch("p1", {
        expectedVersion: 0,
        wasmState: new Uint8Array([1]),
      });
      // The backup state database exists too.
      const backupOpen = fake.factory.open(E2EE_BACKUP_DB_NAME, 1);
      backupOpen.onsuccess = () => {
        backupOpen.result.onversionchange = () => backupOpen.result.close();
      };
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(fake.has(E2EE_DB_NAME)).toBe(true);
      expect(fake.has(E2EE_BACKUP_DB_NAME)).toBe(true);

      await removeAllE2eeLocalData(fake.factory);

      expect(fake.has(E2EE_DB_NAME)).toBe(false);
      expect(fake.has(E2EE_BACKUP_DB_NAME)).toBe(false);
      // The open connection closed and reopens empty, keyless.
      expect(await storage.getWasmState("p1")).toBeNull();
      expect(await storage.getStateVersion("p1")).toBe(0);
    } finally {
      uninstall();
    }
  });

  it("a normal sign-out removes one profile under its engine lock", async () => {
    const storage = createMemoryE2eeStorage();
    const backupState = createMemoryBackupStateStore();
    await storage.writeBatch("p1", { wasmState: new Uint8Array([1]) });
    await storage.writeBatch("p2", { wasmState: new Uint8Array([2]) });
    await backupState.put({ profileId: "p1" } as BackupLocalState);

    await removeE2eeProfileLocalData("p1", {
      storage,
      backupState,
      locks: createFakeLocks(),
    });

    expect(await storage.getWasmState("p1")).toBeNull();
    expect(await storage.getWasmState("p2")).toEqual(new Uint8Array([2]));
    expect(await backupState.get("p1")).toBeNull();
    // Any engine that loaded p1 before the removal is now stale.
    expect(await storage.getStateVersion("p1")).toBe(1);
  });
});

describe("removing a revoked device's data", () => {
  const storedDevice = (deviceKey: string) =>
    ({ profileId: "p1", deviceKey }) as unknown as StoredDevice;

  it("removes it while that device is still the one stored here", async () => {
    const storage = createMemoryE2eeStorage();
    await storage.writeBatch("p1", {
      device: storedDevice("0xAA"),
      wasmState: new Uint8Array([1]),
    });
    await expect(
      removeE2eeProfileLocalData("p1", {
        storage,
        backupState: createMemoryBackupStateStore(),
        locks: createFakeLocks(),
        onlyDeviceKey: "0xaa",
      })
    ).resolves.toBe(true);
    expect(await storage.getWasmState("p1")).toBeNull();
  });

  it("keeps a device set up after the key was checked, under the lock", async () => {
    // Checked against 0xaa, but before the lock is held this browser set
    // up a new device: its data must not be removed.
    const storage = createMemoryE2eeStorage();
    await storage.writeBatch("p1", {
      device: storedDevice("0xbb"),
      wasmState: new Uint8Array([2]),
    });
    await expect(
      removeE2eeProfileLocalData("p1", {
        storage,
        backupState: createMemoryBackupStateStore(),
        locks: createFakeLocks(),
        onlyDeviceKey: "0xaa",
      })
    ).resolves.toBe(false);
    expect(await storage.getWasmState("p1")).toEqual(new Uint8Array([2]));
    expect((await storage.getDevice("p1"))?.deviceKey).toBe("0xbb");
  });
});

describe("removing all encrypted messages while another tab holds the database", () => {
  function blockingFactory(succeedAfterBlock: boolean): IDBFactory {
    return {
      deleteDatabase: () => {
        const req = {} as IDBOpenDBRequest;
        setTimeout(() => {
          req.onblocked?.({} as IDBVersionChangeEvent);
          if (succeedAfterBlock) {
            setTimeout(() => req.onsuccess?.({} as Event), 100);
          }
        }, 0);
        return req;
      },
    } as unknown as IDBFactory;
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fails instead of reporting success while the delete stays blocked", async () => {
    jest.useFakeTimers();
    const removal = removeAllE2eeLocalData(blockingFactory(false));
    const outcome = removal.then(
      () => "removed",
      () => "failed"
    );
    await jest.advanceTimersByTimeAsync(5000);
    await expect(outcome).resolves.toBe("failed");
  });

  it("succeeds once the other tab lets the delete finish", async () => {
    jest.useFakeTimers();
    const removal = removeAllE2eeLocalData(blockingFactory(true));
    await jest.advanceTimersByTimeAsync(200);
    await expect(removal).resolves.toBeUndefined();
  });
});
