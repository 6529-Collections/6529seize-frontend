type StorageManagerLike = Partial<Pick<StorageManager, "persist" | "persisted">>;

const loadHelper = (): typeof import("@/lib/storage/persistent-storage") => {
  let helper: typeof import("@/lib/storage/persistent-storage") | undefined;
  jest.isolateModules(() => {
    helper = jest.requireActual("@/lib/storage/persistent-storage");
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
  afterEach(() => {
    if (original) {
      Object.defineProperty(globalThis.navigator, "storage", original);
    } else {
      delete (globalThis.navigator as { storage?: unknown }).storage;
    }
  });

  it("asks once per page and ignores the answer", async () => {
    const persist = jest.fn(async () => false);
    setStorage({ persist, persisted: async () => false });
    const { requestPersistentStorage } = loadHelper();

    await requestPersistentStorage();
    await requestPersistentStorage();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("asks nothing when storage is already persistent", async () => {
    const persist = jest.fn(async () => true);
    setStorage({ persist, persisted: async () => true });

    await loadHelper().requestPersistentStorage();

    expect(persist).not.toHaveBeenCalled();
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
    await expect(
      loadHelper().requestPersistentStorage()
    ).resolves.toBeUndefined();
  });
});
