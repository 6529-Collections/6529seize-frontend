/** @jest-environment node */
import type { LoginE2eeDevice } from "@/lib/device-signing/login-e2ee";

const mockPreload = jest.fn<Promise<void>, []>(async () => undefined);
const mockCreate = jest.fn<Promise<LoginE2eeDevice>, []>();
jest.mock("@/lib/e2ee/login-device", () => ({
  preloadLoginE2eeDevice: () => mockPreload(),
  createLoginE2eeDevice: () => mockCreate(),
}));

let mockE2eeEnabled = true;
jest.mock("@/config/e2eeEnv", () => ({
  isE2eeEnabled: () => mockE2eeEnabled,
}));

let mockGrantPossible = true;
jest.mock("@/lib/device-signing/login-grant", () => ({
  isDeviceGrantPossible: (role: string | null) =>
    role === null && mockGrantPossible,
}));

type LoginE2eeModule = typeof import("@/lib/device-signing/login-e2ee");

/** A fresh module per test: the prefetch is remembered for the page. */
async function loadModule(): Promise<LoginE2eeModule> {
  let loaded: LoginE2eeModule | undefined;
  await jest.isolateModulesAsync(async () => {
    loaded = await import("@/lib/device-signing/login-e2ee");
  });
  return loaded!;
}

const flush = async () => {
  for (let round = 0; round < 5; round += 1) {
    await Promise.resolve();
  }
};

const device = (): LoginE2eeDevice => ({
  deviceKeyHex: `0x${"3d".repeat(32)}`,
  ciphersuite: 1,
  adopt: jest.fn(async () => true),
  dispose: jest.fn(),
});

const hadIndexedDb = "indexedDB" in globalThis;

describe("encrypted-messages key for the sign-in (NC8)", () => {
  beforeAll(() => {
    if (!hadIndexedDb) {
      Object.defineProperty(globalThis, "indexedDB", {
        value: {},
        configurable: true,
      });
    }
  });
  afterAll(() => {
    if (!hadIndexedDb) {
      Reflect.deleteProperty(globalThis, "indexedDB");
    }
  });
  beforeEach(() => {
    mockE2eeEnabled = true;
    mockGrantPossible = true;
    mockPreload.mockReset().mockResolvedValue(undefined);
    mockCreate.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("prefetch", () => {
    it("loads the MLS module once per page ahead of the sign-in", async () => {
      const { prefetchLoginE2eeDevice } = await loadModule();
      prefetchLoginE2eeDevice();
      prefetchLoginE2eeDevice();
      await flush();
      expect(mockPreload).toHaveBeenCalledTimes(1);
      prefetchLoginE2eeDevice();
      await flush();
      expect(mockPreload).toHaveBeenCalledTimes(1);
    });

    it("tries again after a failed download", async () => {
      mockPreload.mockRejectedValueOnce(new Error("offline"));
      const { prefetchLoginE2eeDevice } = await loadModule();
      prefetchLoginE2eeDevice();
      await flush();
      prefetchLoginE2eeDevice();
      await flush();
      expect(mockPreload).toHaveBeenCalledTimes(2);
    });

    it("downloads nothing where sign-in grants no device (apps, signed messages off)", async () => {
      mockGrantPossible = false;
      const { prefetchLoginE2eeDevice } = await loadModule();
      prefetchLoginE2eeDevice();
      await flush();
      expect(mockPreload).not.toHaveBeenCalled();
    });

    it("downloads nothing with encrypted messages off", async () => {
      mockE2eeEnabled = false;
      const { prefetchLoginE2eeDevice } = await loadModule();
      prefetchLoginE2eeDevice();
      await flush();
      expect(mockPreload).not.toHaveBeenCalled();
    });
  });

  describe("time budget", () => {
    it("signs in without the key after 5 s and releases a key that arrives later", async () => {
      jest.useFakeTimers();
      let resolveKey: (value: LoginE2eeDevice) => void = () => undefined;
      mockCreate.mockReturnValue(
        new Promise((resolve) => {
          resolveKey = resolve;
        })
      );
      const { prepareLoginE2eeDevice } = await loadModule();
      let settled: LoginE2eeDevice | null | undefined;
      void prepareLoginE2eeDevice().then((value) => {
        settled = value;
      });

      await jest.advanceTimersByTimeAsync(4_999);
      expect(settled).toBeUndefined();
      await jest.advanceTimersByTimeAsync(1);
      expect(settled).toBeNull();

      const late = device();
      resolveKey(late);
      await flush();
      expect(late.dispose).toHaveBeenCalled();
    });

    it("waits longer when the user asked to turn on encrypted messages", async () => {
      jest.useFakeTimers();
      const key = device();
      mockCreate.mockReturnValue(
        new Promise((resolve) => {
          setTimeout(() => resolve(key), 10_000);
        })
      );
      const { prepareLoginE2eeDevice } = await loadModule();

      const prepared = prepareLoginE2eeDevice({ required: true });
      await jest.advanceTimersByTimeAsync(10_000);

      await expect(prepared).resolves.toBe(key);
      expect(key.dispose).not.toHaveBeenCalled();
    });

    it("gives up on turning on after 15 s", async () => {
      jest.useFakeTimers();
      mockCreate.mockReturnValue(new Promise(() => undefined));
      const { prepareLoginE2eeDevice } = await loadModule();

      const prepared = prepareLoginE2eeDevice({ required: true });
      await jest.advanceTimersByTimeAsync(15_000);

      await expect(prepared).resolves.toBeNull();
    });
  });
});
