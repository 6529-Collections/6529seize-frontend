type StorageManagerLike = Partial<Pick<StorageManager, "persist" | "persisted">>;

const loadHelper = (): typeof import("@/lib/storage/persistent-storage") => {
  let helper: typeof import("@/lib/storage/persistent-storage") | undefined;
  jest.isolateModules(() => {
    helper = jest.requireActual<
      typeof import("@/lib/storage/persistent-storage")
    >("@/lib/storage/persistent-storage");
  });
  return helper!;
};

const setStorage = (storage: StorageManagerLike | undefined) => {
  Object.defineProperty(globalThis.navigator, "storage", {
    configurable: true,
    value: storage,
  });
};

describe("requestPersistentStorage", () => {
  const original = Object.getOwnPropertyDescriptor(
    globalThis.navigator,
    "storage"
  );
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    if (original) {
      Object.defineProperty(globalThis.navigator, "storage", original);
    } else {
      delete (globalThis.navigator as { storage?: unknown }).storage;
    }
  });

  it("asks once per page and remembers the answer for later", async () => {
    const persist = jest.fn(async () => false);
    setStorage({ persist, persisted: async () => false });
    const { requestPersistentStorage, readLastPersistentStorageResult } =
      loadHelper();

    await expect(requestPersistentStorage()).resolves.toBe("denied");
    await expect(requestPersistentStorage()).resolves.toBe("denied");

    expect(persist).toHaveBeenCalledTimes(1);
    expect(readLastPersistentStorageResult()).toBe("denied");
  });

  it("asks nothing when storage is already persistent", async () => {
    const persist = jest.fn(async () => true);
    setStorage({ persist, persisted: async () => true });
    const helper = loadHelper();

    await expect(helper.requestPersistentStorage()).resolves.toBe("granted");

    expect(persist).not.toHaveBeenCalled();
    expect(helper.readLastPersistentStorageResult()).toBe("granted");
  });

  it("records a granted request", async () => {
    setStorage({ persist: async () => true, persisted: async () => false });
    const helper = loadHelper();

    await expect(helper.requestPersistentStorage()).resolves.toBe("granted");
    expect(helper.readLastPersistentStorageResult()).toBe("granted");
  });

  it.each([
    ["no StorageManager", undefined],
    ["no persist()", {}],
    [
      "a refused request",
      {
        persisted: async () => false,
        persist: async () => {
          throw new DOMException("denied", "NotAllowedError");
        },
      },
    ],
  ])("never throws with %s", async (_label, storage) => {
    setStorage(storage as StorageManagerLike | undefined);
    await expect(loadHelper().requestPersistentStorage()).resolves.toBe(
      "unsupported"
    );
  });
});
