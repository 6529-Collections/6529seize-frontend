const CORE_BUILD = "mixpanel-browser/dist/mixpanel-core.cjs.js";

const loadSdkModule = (coreFactory?: () => unknown) => {
  jest.resetModules();
  if (coreFactory) jest.doMock(CORE_BUILD, coreFactory);
  return import("@/services/analytics/mixpanelSdk");
};

describe("mixpanel SDK loader", () => {
  afterEach(() => {
    jest.dontMock(CORE_BUILD);
  });

  it("downloads the core build only when requested and shares one load", async () => {
    let evaluations = 0;
    const sdk = { init: jest.fn(), track: jest.fn() };
    const loader = await loadSdkModule(() => {
      evaluations += 1;
      return { __esModule: true, default: sdk };
    });

    expect(evaluations).toBe(0);
    expect(loader.getLoadedMixpanelSdk()).toBeUndefined();

    const loads = await Promise.all([
      loader.loadMixpanelSdk(),
      loader.loadMixpanelSdk(),
    ]);

    expect(loads).toEqual([sdk, sdk]);
    expect(loader.getLoadedMixpanelSdk()).toBe(sdk);
    await expect(loader.loadMixpanelSdk()).resolves.toBe(sdk);
    expect(evaluations).toBe(1);
  });

  it("resolves the real recorder-free SDK instance", async () => {
    const loader = await loadSdkModule();

    const sdk = await loader.loadMixpanelSdk();

    expect(sdk).toBeDefined();
    expect(typeof sdk?.init).toBe("function");
    expect(typeof sdk?.track).toBe("function");
    expect(loader.getLoadedMixpanelSdk()).toBe(sdk);
  });

  it("reports a failed download as unavailable and retries on the next request", async () => {
    let attempts = 0;
    const sdk = { init: jest.fn() };
    const loader = await loadSdkModule(() => {
      attempts += 1;
      if (attempts === 1) throw new Error("Synthetic chunk load failure");
      return { __esModule: true, default: sdk };
    });

    await expect(loader.loadMixpanelSdk()).resolves.toBeUndefined();
    expect(loader.getLoadedMixpanelSdk()).toBeUndefined();

    await expect(loader.loadMixpanelSdk()).resolves.toBe(sdk);
    expect(loader.getLoadedMixpanelSdk()).toBe(sdk);
    expect(attempts).toBe(2);
  });
});
