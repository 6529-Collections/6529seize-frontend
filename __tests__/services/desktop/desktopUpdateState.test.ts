import {
  __resetDesktopAutoUpdateForTests,
  getDesktopAutoUpdate,
  restartDesktopToUpdate,
  setDesktopUpdateSettings,
  startDesktopUpdate,
  subscribeDesktopAutoUpdate,
} from "@/services/desktop/desktopUpdateState";

type Listener = (event: unknown, payload?: unknown) => void;

const U1 = {
  id: "U1",
  state: "up_to_date",
  label: "Up to date",
  headline: "You're on the newest release. Checked 2026-11-17 10:00 UTC.",
  running: "0.1.0-rc.3",
  check: true,
  auto: true,
  canInstall: true,
  cannotInstallWhy: null,
  checkedAt: 1_800_000_000,
};

function install(info: Record<string, unknown>, methods = true) {
  const stateListeners = new Set<Listener>();
  const setSettings = jest.fn((s: Record<string, boolean>) =>
    Promise.resolve({ ...U1, ...s })
  );
  const getState = jest.fn(() => Promise.resolve(U1));
  const updater = {
    checkUpdates: jest.fn(),
    downloadUpdate: jest.fn(() => Promise.resolve()),
    installUpdate: jest.fn(() => Promise.resolve()),
    ...(methods
      ? {
          getState,
          onUpdateState: jest.fn((cb: Listener) => stateListeners.add(cb)),
          offUpdateState: jest.fn((cb: Listener) => stateListeners.delete(cb)),
          setSettings,
        }
      : {}),
  };
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { openExternal: jest.fn(), getInfo: jest.fn(async () => info) },
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
  Object.defineProperty(window, "updater", {
    configurable: true,
    value: updater,
  });
  const emit = (value: unknown) =>
    stateListeners.forEach((cb) => cb({ channel: "update-state" }, value));
  return { updater, stateListeners, emit, setSettings, getState };
}

const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

describe("desktopUpdateState", () => {
  afterEach(() => {
    __resetDesktopAutoUpdateForTests();
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    Reflect.deleteProperty(window, "updater");
  });

  it("is unsupported on the web", () => {
    const stop = subscribeDesktopAutoUpdate(() => undefined);
    expect(getDesktopAutoUpdate()).toEqual({ support: "unsupported" });
    stop();
  });

  it("follows the state of a build that installs its own updates", async () => {
    const { emit, stateListeners } = install({ supportsInAppUpdates: true });
    const stop = subscribeDesktopAutoUpdate(() => undefined);
    expect(getDesktopAutoUpdate()).toEqual({ support: "detecting" });
    await flush();
    expect(getDesktopAutoUpdate()).toMatchObject({
      support: "supported",
      state: { id: "U1", running: "0.1.0-rc.3" },
    });

    emit({ ...U1, id: "U4", state: "available", version: "0.1.0-rc.4" });
    expect(getDesktopAutoUpdate()).toMatchObject({ state: { id: "U4" } });
    // A state that does not parse changes nothing.
    emit({ id: "U99" });
    expect(getDesktopAutoUpdate()).toMatchObject({ state: { id: "U4" } });

    stop();
    expect(stateListeners.size).toBe(0);
    expect(getDesktopAutoUpdate()).toEqual({ support: "detecting" });
  });

  it.each([
    [
      "says it does not install updates (0.1.0-rc.2)",
      { supportsInAppUpdates: false },
      true,
    ],
    ["does not say (the older app)", {}, true],
    ["lacks the state methods", { supportsInAppUpdates: true }, false],
  ])("is unsupported when the app %s", async (_label, info, methods) => {
    install(info, methods);
    const stop = subscribeDesktopAutoUpdate(() => undefined);
    await flush();
    expect(getDesktopAutoUpdate()).toEqual({ support: "unsupported" });
    stop();
  });

  it("applies the state setSettings returns", async () => {
    const { setSettings, getState } = install({ supportsInAppUpdates: true });
    const stop = subscribeDesktopAutoUpdate(() => undefined);
    await flush();
    await expect(setDesktopUpdateSettings({ auto: false })).resolves.toBeNull();
    expect(setSettings).toHaveBeenCalledWith({ auto: false });
    expect(getDesktopAutoUpdate()).toMatchObject({ state: { auto: false } });

    // Taken but answered with a state the website cannot read: no failure,
    // and the state is read again.
    setSettings.mockResolvedValueOnce({ id: "U99" } as never);
    await expect(setDesktopUpdateSettings({ auto: true })).resolves.toBeNull();
    expect(getState).toHaveBeenCalledTimes(2);

    setSettings.mockRejectedValueOnce("Please wait a moment and try again.");
    await expect(setDesktopUpdateSettings({ check: false })).resolves.toBe(
      "Please wait a moment and try again."
    );
    stop();
  });

  it("does not apply a settings answer that arrives after the monitor stopped", async () => {
    const { setSettings } = install({ supportsInAppUpdates: true });
    const stop = subscribeDesktopAutoUpdate(() => undefined);
    await flush();
    let answer: (value: unknown) => void = () => undefined;
    setSettings.mockReturnValueOnce(
      new Promise((resolve) => {
        answer = resolve;
      }) as never
    );
    const pending = setDesktopUpdateSettings({ auto: false });
    stop();
    answer({ ...U1, auto: false });
    await expect(pending).resolves.toBeNull();
    expect(getDesktopAutoUpdate()).toEqual({ support: "detecting" });
  });

  it("reports why the app cannot restart to update", async () => {
    const { updater } = install({ supportsInAppUpdates: true });
    await expect(restartDesktopToUpdate()).resolves.toBeNull();
    updater.installUpdate.mockRejectedValueOnce(
      new Error(
        "A signature request is open. Finish or cancel it, then restart to update."
      )
    );
    await expect(restartDesktopToUpdate()).resolves.toBe(
      "A signature request is open. Finish or cancel it, then restart to update."
    );
    updater.installUpdate.mockRejectedValueOnce("x\ny");
    await expect(restartDesktopToUpdate()).resolves.toBe("");
  });

  it("passes on the app's refusal to start a download, once", async () => {
    const { updater } = install({ supportsInAppUpdates: true });
    await expect(startDesktopUpdate()).resolves.toBeNull();
    updater.downloadUpdate.mockReturnValueOnce(
      Promise.reject(new Error("Please wait a moment and try again."))
    );
    await expect(startDesktopUpdate()).resolves.toBe(
      "Please wait a moment and try again."
    );
    // Never retried by itself.
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(2);
  });
});
