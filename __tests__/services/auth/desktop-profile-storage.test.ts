import {
  __resetDesktopProfileStorageForTests,
  getDesktopProfileSaveStatus,
  initializeDesktopProfiles,
  notifyDesktopProfilesReady,
  persistDesktopProfileAccounts,
  restartDesktopProfileRestore,
  retryDesktopProfileSave,
} from "@/services/auth/desktop-profile-storage";
import type { DesktopProfileState } from "@/types/desktop-shell";
import { fakeJwt } from "@/__tests__/helpers/fakeJwt";

const ADDRESS = `0x${"1".repeat(40)}`;
const TOKEN = fakeJwt({ sub: ADDRESS });
const EMPTY: DesktopProfileState = {
  version: 1,
  accounts: [],
  activeAddress: null,
};
const SAVED: DesktopProfileState = {
  version: 1,
  accounts: [
    {
      address: ADDRESS,
      role: null,
      jwt: TOKEN,
      profileId: null,
      profileHandle: null,
      authSessionVersion: "v2",
      refreshToken: null,
    },
  ],
  activeAddress: ADDRESS,
};

const createNativeAuth = () => ({
  sessionLogin: jest.fn(),
  restoreProfiles: jest.fn().mockResolvedValue(SAVED),
  saveProfiles: jest.fn().mockResolvedValue(undefined),
  profilesReady: jest.fn().mockResolvedValue(undefined),
  restartProfileRestore: jest.fn().mockResolvedValue(undefined),
});

let nativeAuth: ReturnType<typeof createNativeAuth>;

const setBridge = (key: "api" | "nativeAuth", value: unknown) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

const flush = async () => {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
};

const pageAccount = {
  address: ADDRESS,
  role: null,
  jwt: TOKEN,
  profileId: null,
  profileHandle: null,
  authSessionVersion: "v2" as const,
  refreshToken: "legacy-page-token",
};

describe("desktop profile storage", () => {
  beforeEach(() => {
    __resetDesktopProfileStorageForTests();
    nativeAuth = createNativeAuth();
    setBridge("api", { openExternal: jest.fn() });
    setBridge("nativeAuth", nativeAuth);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("restores the shell's profiles before allowing saves", async () => {
    const restore = jest.fn();

    persistDesktopProfileAccounts([pageAccount], ADDRESS);
    expect(nativeAuth.saveProfiles).not.toHaveBeenCalled();

    await initializeDesktopProfiles(EMPTY, restore);

    expect(nativeAuth.restoreProfiles).toHaveBeenCalledWith(EMPTY);
    expect(restore).toHaveBeenCalledWith(SAVED);
    expect(nativeAuth.saveProfiles).not.toHaveBeenCalled();
  });

  it("restores only once even if asked again", async () => {
    await Promise.all([
      initializeDesktopProfiles(EMPTY, jest.fn()),
      initializeDesktopProfiles(EMPTY, jest.fn()),
    ]);

    expect(nativeAuth.restoreProfiles).toHaveBeenCalledTimes(1);
  });

  it("saves every change without sending refresh tokens", async () => {
    await initializeDesktopProfiles(EMPTY, jest.fn());

    persistDesktopProfileAccounts([pageAccount], ADDRESS);
    await flush();

    expect(nativeAuth.saveProfiles).toHaveBeenCalledWith(SAVED);
  });

  it("saves a checksummed address lower-cased, with the active profile kept", async () => {
    await initializeDesktopProfiles(EMPTY, jest.fn());
    const checksummed = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";

    persistDesktopProfileAccounts(
      [{ ...pageAccount, address: checksummed }],
      checksummed
    );
    await flush();

    expect(nativeAuth.saveProfiles).toHaveBeenCalledWith({
      ...SAVED,
      accounts: [{ ...SAVED.accounts[0], address: checksummed.toLowerCase() }],
      activeAddress: checksummed.toLowerCase(),
    });
  });

  it("never sends the shell an active profile that is not listed", async () => {
    await initializeDesktopProfiles(EMPTY, jest.fn());

    persistDesktopProfileAccounts([pageAccount], `0x${"9".repeat(40)}`);
    await flush();

    expect(nativeAuth.saveProfiles).toHaveBeenCalledWith({
      ...SAVED,
      activeAddress: null,
    });
  });

  it("saves a change made during an in-flight save once, after it", async () => {
    await initializeDesktopProfiles(EMPTY, jest.fn());
    let finishFirstSave: () => void = () => undefined;
    nativeAuth.saveProfiles.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishFirstSave = resolve;
      })
    );

    persistDesktopProfileAccounts([pageAccount], ADDRESS);
    persistDesktopProfileAccounts([], null);
    finishFirstSave();
    await flush();
    await flush();

    expect(nativeAuth.saveProfiles).toHaveBeenCalledTimes(2);
    expect(nativeAuth.saveProfiles).toHaveBeenNthCalledWith(1, SAVED);
    expect(nativeAuth.saveProfiles).toHaveBeenNthCalledWith(2, EMPTY);
  });

  it("reports a failed save and retries the latest snapshot", async () => {
    await initializeDesktopProfiles(EMPTY, jest.fn());
    nativeAuth.saveProfiles.mockRejectedValueOnce(new Error("locked"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    persistDesktopProfileAccounts([pageAccount], ADDRESS);
    await flush();
    expect(getDesktopProfileSaveStatus()).toBe("failed");

    persistDesktopProfileAccounts([], null);
    await flush();
    expect(getDesktopProfileSaveStatus()).toBe("idle");
    expect(nativeAuth.saveProfiles).toHaveBeenLastCalledWith(EMPTY);
    consoleError.mockRestore();
  });

  it("allows a later restore after a failed one", async () => {
    nativeAuth.restoreProfiles.mockRejectedValueOnce(new Error("keychain"));

    await expect(initializeDesktopProfiles(EMPTY, jest.fn())).rejects.toThrow(
      "keychain"
    );
    await initializeDesktopProfiles(EMPTY, jest.fn());

    expect(nativeAuth.restoreProfiles).toHaveBeenCalledTimes(2);
  });

  it("passes readiness and restart requests to the shell", async () => {
    notifyDesktopProfilesReady();
    await restartDesktopProfileRestore();
    await flush();

    expect(nativeAuth.profilesReady).toHaveBeenCalledTimes(1);
    expect(nativeAuth.restartProfileRestore).toHaveBeenCalledTimes(1);
  });

  it("does nothing in a plain browser", async () => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    const restore = jest.fn();

    await initializeDesktopProfiles(EMPTY, restore);
    persistDesktopProfileAccounts([pageAccount], ADDRESS);
    notifyDesktopProfilesReady();
    await retryDesktopProfileSave();
    await expect(restartDesktopProfileRestore()).rejects.toThrow(
      "Desktop profile restart is unavailable"
    );

    expect(restore).not.toHaveBeenCalled();
    expect(nativeAuth.restoreProfiles).not.toHaveBeenCalled();
    expect(nativeAuth.saveProfiles).not.toHaveBeenCalled();
    expect(nativeAuth.profilesReady).not.toHaveBeenCalled();
  });
});
