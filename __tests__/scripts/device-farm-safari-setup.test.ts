/** @jest-environment node */
const {
  ensureSafariWebInspector,
} = require("../../tests/device-farm/lib/safari-setup.cjs");

describe("real iPhone Web Inspector preparation", () => {
  function settings({
    modern = true,
    value = "1",
    locked = false,
    toggleWorks = true,
    depth = 0,
    hidden = false,
    foregroundDelay = 0,
    navigationDelay = 0,
    largeTitle = false,
  }: {
    modern?: boolean;
    value?: string | null;
    locked?: boolean;
    toggleWorks?: boolean;
    depth?: number;
    hidden?: boolean;
    foregroundDelay?: number;
    navigationDelay?: number;
    largeTitle?: boolean;
  } = {}) {
    let screen = depth > 0 ? "old screen" : "Settings";
    let backDepth = depth;
    let controlVisible = !hidden;
    let activeBundle = "com.apple.mobilesafari";
    let launchedBundle = activeBundle;
    let foregroundReads = 0;
    let navigationReads = 0;
    const actions: string[] = [];
    const toggle = {
      isDisplayed: jest.fn(async () => screen === "Advanced" && controlVisible),
      isEnabled: jest.fn(async () => !locked),
      getAttribute: jest.fn(async (attribute: string) => {
        if (attribute !== "value") throw new Error("Unexpected attribute");
        return value;
      }),
      click: jest.fn(async () => {
        actions.push("enable inspector");
        if (toggleWorks) value = "1";
      }),
    };
    const back = jest.fn(async () => {
      actions.push("back");
      backDepth -= 1;
      if (backDepth === 0) screen = "Settings";
    });
    const driver = {
      waitUntil: jest.fn(
        async (
          observe: () => Promise<boolean>,
          options: { timeoutMsg: string }
        ) => {
          for (let tick = 0; tick < 40; tick += 1) {
            if (await observe()) return;
          }
          throw new Error(options.timeoutMsg);
        }
      ),
      execute: jest.fn(
        async (command: string, args: Record<string, string> = {}) => {
          if (command === "mobile: launchApp") {
            actions.push(`launch ${args["bundleId"]}`);
            launchedBundle = args["bundleId"]!;
            foregroundReads = 0;
          } else if (command === "mobile: activeAppInfo") {
            if (foregroundReads++ >= foregroundDelay)
              activeBundle = launchedBundle;
            return { bundleId: activeBundle };
          } else if (command === "mobile: scroll") {
            actions.push("scroll");
            controlVisible = true;
          } else {
            throw new Error(`Unexpected native command: ${command}`);
          }
          return undefined;
        }
      ),
      $: jest.fn(async (selector: string) => {
        if (activeBundle !== "com.apple.Preferences") {
          throw new Error(
            "Queried the preceding app before Settings became active"
          );
        }
        if (selector.includes("XCUIElementTypeNavigationBar")) {
          if (selector.includes("XCUIElementTypeButton"))
            return {
              click: back,
              isDisplayed: async () =>
                backDepth > 0 && navigationReads > navigationDelay,
            };
          return {
            isDisplayed: async () => {
              navigationReads += 1;
              return (
                screen === "Settings" &&
                navigationReads > navigationDelay &&
                (!largeTitle || selector.includes("XCUIElementTypeStaticText"))
              );
            },
          };
        }
        if (selector.includes("XCUIElementTypeSwitch")) return toggle;
        const name = /name == "([^"]+)"/.exec(selector)?.[1];
        if (!name) throw new Error("Unexpected selector");
        const allowed =
          (screen === "Settings" && name === (modern ? "Apps" : "Safari")) ||
          (screen === "Apps" && name === "Safari") ||
          (screen === "Safari" && name === "Advanced");
        return {
          isDisplayed: async () => allowed && controlVisible,
          click: async () => {
            if (!allowed || !controlVisible)
              throw new Error("Wrong Settings route");
            actions.push(`open ${name}`);
            screen = name;
          },
        };
      }),
    };
    return { driver, toggle, actions, back };
  }

  it.each([
    { version: "16.4", modern: false },
    { version: "18.6.2", modern: true },
  ])(
    "verifies an already enabled switch on iOS $version without toggling",
    async ({ version, modern }) => {
      const { driver, toggle, actions } = settings({ modern });
      await ensureSafariWebInspector(driver, version);
      expect(actions).toEqual([
        "launch com.apple.Preferences",
        ...(modern ? ["open Apps"] : []),
        "open Safari",
        "open Advanced",
        "launch com.apple.mobilesafari",
      ]);
      expect(toggle.click).not.toHaveBeenCalled();
      expect(toggle.getAttribute.mock.calls).toEqual([["value"], ["value"]]);
    }
  );

  it("enables a disabled switch once and verifies it before returning to Safari", async () => {
    const { driver, toggle, actions } = settings({ value: "0" });
    await ensureSafariWebInspector(driver, "18.6.2");
    expect(toggle.click).toHaveBeenCalledTimes(1);
    expect(toggle.getAttribute).toHaveBeenCalledTimes(2);
    expect(actions.slice(-2)).toEqual([
      "enable inspector",
      "launch com.apple.mobilesafari",
    ]);
  });

  it("returns from a retained Settings screen and reveals off-screen controls", async () => {
    const { driver, back, actions } = settings({ depth: 3, hidden: true });
    await ensureSafariWebInspector(driver, "18.6.2");
    expect(back).toHaveBeenCalledTimes(3);
    expect(actions).toContain("scroll");
  });

  it("stops at a bounded Settings navigation failure", async () => {
    const { driver, back, toggle } = settings({ depth: 20 });
    await expect(
      ensureSafariWebInspector(driver, "18.6.2")
    ).rejects.toMatchObject({
      code: "SAFARI_WEB_INSPECTOR_SETUP",
      deviceFarmDiagnostics: { startupStage: "web-inspector-setup" },
    });
    expect(back).toHaveBeenCalledTimes(8);
    expect(toggle.click).not.toHaveBeenCalled();
    expect(
      driver.execute.mock.calls.filter(
        ([command]) => command === "mobile: launchApp"
      )
    ).toHaveLength(1);
  });

  it.each([false, true])(
    "waits for foreground and root readiness without clicking Back (large title: %s)",
    async (largeTitle) => {
      const { driver, back, actions } = settings({
        foregroundDelay: 3,
        navigationDelay: 3,
        largeTitle,
      });
      await ensureSafariWebInspector(driver, "18.6.2");
      expect(back).not.toHaveBeenCalled();
      expect(actions.filter((action) => action.startsWith("launch"))).toEqual([
        "launch com.apple.Preferences",
        "launch com.apple.mobilesafari",
      ]);
      expect(
        driver.execute.mock.calls.filter(
          ([command]) => command === "mobile: activeAppInfo"
        )
      ).toHaveLength(8);
    }
  );

  it("never queries or clicks controls if Settings does not become active", async () => {
    const { driver, back, toggle } = settings({ foregroundDelay: 100 });
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
      "App did not become active: com.apple.Preferences"
    );
    expect(driver.$).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
    expect(toggle.click).not.toHaveBeenCalled();
  });

  it("fails without clicking when neither root nor Back becomes visible", async () => {
    const { driver, back } = settings({ navigationDelay: 100 });
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
      "Settings navigation did not become ready"
    );
    expect(back).not.toHaveBeenCalled();
  });

  it("waits for a retained screen's Back control before clicking it", async () => {
    const { driver, back } = settings({ depth: 2, navigationDelay: 3 });
    await ensureSafariWebInspector(driver, "18.6.2");
    expect(back).toHaveBeenCalledTimes(2);
  });

  it("preserves the first foreground read failure without repeating the command", async () => {
    const { driver } = settings();
    const error = new Error("WDA disconnected");
    driver.execute
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(error);
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toBe(
      error
    );
    expect(driver.execute).toHaveBeenCalledTimes(2);
    expect(driver.$).not.toHaveBeenCalled();
  });

  it("preserves a navigation query failure without repeating it", async () => {
    const { driver, back } = settings();
    const error = new Error("Native query failed");
    driver.$.mockRejectedValueOnce(error);
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toBe(
      error
    );
    expect(driver.$).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
  });

  it("does not finish preparation until Safari becomes active again", async () => {
    const { driver, actions } = settings();
    const execute = driver.execute.getMockImplementation()!;
    driver.execute.mockImplementation(async (command, args) => {
      const result = await execute(command, args);
      if (command === "mobile: activeAppInfo") {
        return { bundleId: "com.apple.Preferences" };
      }
      return result;
    });
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
      "App did not become active: com.apple.mobilesafari"
    );
    expect(
      actions.filter((action) => action === "launch com.apple.mobilesafari")
    ).toHaveLength(1);
  });

  it.each(["", "unknown", null])(
    "rejects unknown switch state %s without touching it",
    async (value) => {
      const { driver, toggle, actions } = settings();
      toggle.getAttribute.mockResolvedValueOnce(value);
      await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
        "Unknown Web Inspector"
      );
      expect(toggle.click).not.toHaveBeenCalled();
      expect(actions).not.toContain("launch com.apple.mobilesafari");
    }
  );

  it("fails on a locked disabled switch", async () => {
    const { driver, toggle } = settings({ value: "0", locked: true });
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
      "setting is locked"
    );
    expect(toggle.click).not.toHaveBeenCalled();
  });

  it("fails when the enable action does not stick, without toggling again", async () => {
    const { driver, toggle, actions } = settings({
      value: "0",
      toggleWorks: false,
    });
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
      "did not remain enabled"
    );
    expect(toggle.click).toHaveBeenCalledTimes(1);
    expect(actions).not.toContain("launch com.apple.mobilesafari");
  });

  it("fails if an initially enabled setting becomes disabled", async () => {
    const { driver, toggle } = settings();
    toggle.getAttribute.mockResolvedValueOnce("1").mockResolvedValueOnce("0");
    await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toThrow(
      "did not remain enabled"
    );
    expect(toggle.click).not.toHaveBeenCalled();
  });

  it.each(["read", "click", "launch", "scroll"])(
    "preserves the first %s error",
    async (operation) => {
      const { driver, toggle } = settings({
        value: "0",
        hidden: operation === "scroll",
      });
      const error = new Error(`${operation} failed`);
      if (operation === "read")
        toggle.getAttribute.mockRejectedValueOnce(error);
      if (operation === "click") toggle.click.mockRejectedValueOnce(error);
      if (operation === "launch") driver.execute.mockRejectedValueOnce(error);
      if (operation === "scroll") {
        const execute = driver.execute.getMockImplementation()!;
        driver.execute.mockImplementation(async (command, args) => {
          if (command === "mobile: scroll") throw error;
          return execute(command, args);
        });
      }
      await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toBe(
        error
      );
      expect(error).toHaveProperty("code", "SAFARI_WEB_INSPECTOR_SETUP");
      expect(toggle.click.mock.calls.length).toBeLessThanOrEqual(1);
    }
  );
});
