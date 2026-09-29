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
  }: {
    modern?: boolean;
    value?: string | null;
    locked?: boolean;
    toggleWorks?: boolean;
    depth?: number;
    hidden?: boolean;
  } = {}) {
    let screen = depth > 0 ? "old screen" : "Settings";
    let backDepth = depth;
    let controlVisible = !hidden;
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
      execute: jest.fn(
        async (command: string, args: Record<string, string>) => {
          if (command === "mobile: launchApp") {
            actions.push(`launch ${args["bundleId"]}`);
          } else if (command === "mobile: scroll") {
            actions.push("scroll");
            controlVisible = true;
          } else {
            throw new Error(`Unexpected native command: ${command}`);
          }
        }
      ),
      $: jest.fn(async (selector: string) => {
        if (selector.includes("XCUIElementTypeNavigationBar")) {
          if (selector.includes("XCUIElementTypeButton"))
            return { click: back };
          return { isDisplayed: async () => screen === "Settings" };
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
    expect(driver.execute).toHaveBeenCalledTimes(1);
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
        driver.execute
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(error);
      }
      await expect(ensureSafariWebInspector(driver, "18.6.2")).rejects.toBe(
        error
      );
      expect(error).toHaveProperty("code", "SAFARI_WEB_INSPECTOR_SETUP");
      expect(toggle.click.mock.calls.length).toBeLessThanOrEqual(1);
    }
  );
});
