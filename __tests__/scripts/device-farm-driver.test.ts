/** @jest-environment node */
const mockRemote = jest.fn();
jest.mock("webdriverio", () => ({ remote: mockRemote }), { virtual: true });
const {
  openPage,
  startWebSession,
  startNativeAndroidSession,
} = require("../../tests/device-farm/lib/driver.cjs");
const {
  classifyFailure,
  summarizeResult,
} = require("../../tests/device-farm/lib/result.cjs");

describe("Device Farm browser startup and diagnostics", () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TARGET_URL: "https://staging.6529.io" };
    delete process.env.DEVICEFARM_DEVICE_OS_VERSION;
    mockRemote.mockResolvedValue({});
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  it.each(["16.4", "18.6.2", "26.0"])(
    "preloads Safari before debugger attachment on iOS %s",
    async (version) => {
      process.env.DEVICEFARM_DEVICE_PLATFORM_NAME = "iOS";
      process.env.DEVICEFARM_DEVICE_OS_VERSION = version;
      await startWebSession();
      expect(mockRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionRetryCount: 0,
          capabilities: expect.objectContaining({
            browserName: "Safari",
            "appium:initialDeeplinkUrl": "https://staging.6529.io",
            "appium:webviewConnectTimeout": 30000,
          }),
        })
      );
    }
  );

  it.each(["16.3", "15.8", "", "unknown"])(
    "does not send an unsupported launch capability on iOS %s",
    async (version) => {
      process.env.DEVICEFARM_DEVICE_PLATFORM_NAME = "iOS";
      process.env.DEVICEFARM_DEVICE_OS_VERSION = version;
      await startWebSession();
      expect(mockRemote.mock.calls[0][0].capabilities).not.toHaveProperty(
        "appium:initialDeeplinkUrl"
      );
    }
  );

  it("keeps Android and native capabilities separate", async () => {
    process.env.DEVICEFARM_DEVICE_PLATFORM_NAME = "Android";
    await startWebSession();
    expect(mockRemote.mock.calls[0][0].capabilities.browserName).toBe("Chrome");
    expect(mockRemote.mock.calls[0][0].capabilities).not.toHaveProperty(
      "appium:initialDeeplinkUrl"
    );
    await startNativeAndroidSession();
    expect(mockRemote.mock.calls[1][0].connectionRetryCount).toBe(2);
    expect(mockRemote.mock.calls[1][0].capabilities).not.toHaveProperty(
      "browserName"
    );
  });

  it("preserves session startup failures instead of retrying outside the driver", async () => {
    const error = new Error(
      "The remote debugger did not return any connected web applications after 30154ms"
    );
    mockRemote.mockRejectedValue(error);
    await expect(startWebSession()).rejects.toBe(error);
    expect(mockRemote).toHaveBeenCalledTimes(1);
    expect(classifyFailure(error)).toBe("safari-session-startup");
  });

  it("preserves disconnected navigation and captures device state", async () => {
    const error = new Error("unknown error: net::ERR_INTERNET_DISCONNECTED");
    const driver = {
      url: jest.fn().mockRejectedValue(error),
      execute: jest.fn().mockResolvedValue({ online: false }),
    };
    await expect(openPage(driver, "https://6529.io", 100)).rejects.toBe(error);
    expect(classifyFailure(error)).toBe("device-connectivity");
    expect(error).toHaveProperty("deviceFarmDiagnostics.online", false);
    expect(driver.url).toHaveBeenCalledTimes(1);
  });

  it("does not mask navigation errors when diagnostics also fail", async () => {
    const error = new Error("navigation failed");
    const driver = {
      url: jest.fn().mockRejectedValue(error),
      execute: jest.fn().mockRejectedValue(new Error("session lost")),
    };
    await expect(openPage(driver, "https://6529.io", 100)).rejects.toBe(error);
    expect(error).toHaveProperty("deviceFarmDiagnostics.unavailable", true);
    expect(classifyFailure(error)).toBe("test-failure");
  });

  it("detects explicit offline state even when navigation returns normally", async () => {
    const driver = {
      url: jest.fn().mockResolvedValue(undefined),
      waitUntil: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue({ online: false }),
    };
    await expect(
      openPage(driver, "https://6529.io", 100)
    ).rejects.toMatchObject({ code: "DEVICE_OFFLINE" });
  });
});

describe("Device Farm evidence classifications", () => {
  const passed = { total: 7, passes: 7, pending: 0, failures: [], retries: 0 };
  it("requires every selected test to execute without recovery", () => {
    expect(summarizeResult(passed).outcome).toBe("passed");
    expect(summarizeResult({ ...passed, passes: 6, pending: 1 }).outcome).toBe(
      "tests-not-run"
    );
    expect(summarizeResult({ ...passed, passes: 6 }).notRun).toBe(1);
    expect(summarizeResult({ ...passed, retries: 1 }).outcome).toBe(
      "passed-after-retry"
    );
    expect(summarizeResult({ ...passed, total: 0, passes: 0 }).outcome).toBe(
      "tests-not-run"
    );
  });
  it("distinguishes a failed setup hook from an app assertion failure", () => {
    const setup = summarizeResult({
      ...passed,
      passes: 0,
      failures: [{ hook: true, kind: "safari-session-startup" }],
    });
    expect(setup).toMatchObject({
      outcome: "infrastructure-failure",
      notRun: 7,
    });
    const app = summarizeResult({
      ...passed,
      passes: 6,
      failures: [{ hook: false, kind: "test-failure" }],
    });
    expect(app).toMatchObject({ outcome: "test-failure", notRun: 0 });
    expect(
      classifyFailure(
        new Error("long-press did not open the wave action sheet")
      )
    ).toBe("test-failure");
    expect(classifyFailure(new Error("net::ERR_NAME_NOT_RESOLVED"))).toBe(
      "test-failure"
    );
  });
});
