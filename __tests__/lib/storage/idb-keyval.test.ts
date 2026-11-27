/** @jest-environment node */
import { createStore, get, set } from "@/lib/storage/idb-keyval";
import { IDBDatabase, IDBFactory, IDBObjectStore } from "fake-indexeddb";
import "fake-indexeddb/auto";

describe("IndexedDB operation diagnostics", () => {
  let databaseNumber = 0;
  let store: ReturnType<typeof createStore>;
  const onFailure = jest.fn();

  beforeEach(() => {
    store = createStore(`operation-diagnostics-${databaseNumber++}`, "keys");
    onFailure.mockClear();
  });

  afterEach(() => jest.restoreAllMocks());

  it("reports a database open failure", async () => {
    const error = new DOMException("Storage blocked", "SecurityError");
    jest.spyOn(IDBFactory.prototype, "open").mockImplementationOnce(() => {
      throw error;
    });

    await expect(get("key", store, onFailure)).rejects.toBe(error);
    expect(onFailure.mock.calls).toEqual([["open"]]);
  });

  it("reports a transaction failure separately from its read", async () => {
    await get("key", store);
    const error = new DOMException("Store missing", "NotFoundError");
    jest
      .spyOn(IDBDatabase.prototype, "transaction")
      .mockImplementationOnce(() => {
        throw error;
      });

    await expect(get("key", store, onFailure)).rejects.toBe(error);
    expect(onFailure.mock.calls).toEqual([["transaction"]]);
  });

  it("reports a read failure", async () => {
    const error = new DOMException("Read failed", "UnknownError");
    jest.spyOn(IDBObjectStore.prototype, "get").mockImplementationOnce(() => {
      throw error;
    });

    await expect(get("key", store, onFailure)).rejects.toBe(error);
    expect(onFailure.mock.calls).toEqual([["read"]]);
  });

  it("reports a write failure", async () => {
    const error = new DOMException("Could not clone value", "DataCloneError");
    jest.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => {
      throw error;
    });

    await expect(set("key", "value", store, onFailure)).rejects.toBe(error);
    expect(onFailure.mock.calls).toEqual([["write"]]);
  });

  it("reports no failure when reopening a closing connection works", async () => {
    await get("key", store);
    jest
      .spyOn(IDBDatabase.prototype, "transaction")
      .mockImplementationOnce(() => {
        throw new DOMException("Connection is closing", "InvalidStateError");
      });

    await set("key", "value", store, onFailure);

    expect(onFailure).not.toHaveBeenCalled();
    await expect(get("key", store)).resolves.toBe("value");
  });
});
