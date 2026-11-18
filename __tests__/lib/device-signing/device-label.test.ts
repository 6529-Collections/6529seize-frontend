import { getE2eeDeviceLabel } from "@/components/e2ee/e2eeDeviceLabel";
import { getDeviceLabel } from "@/lib/device-signing/device-label";

const CHROME_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

describe("device label", () => {
  it.each([
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Chrome on Mac",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      "Safari on iPhone",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
      "Firefox on Linux",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
      "Samsung Internet on Android",
    ],
    ["", "Browser"],
    ["SomeBot/1.0", "Browser"],
  ])("labels %s", (userAgent, label) => {
    expect(getDeviceLabel(userAgent)).toBe(label);
  });

  describe("in this browser", () => {
    afterEach(() => {
      // Own overrides shadow jsdom's prototype getters; deleting restores them.
      Reflect.deleteProperty(globalThis.navigator, "userAgent");
      Reflect.deleteProperty(globalThis.navigator, "userAgentData");
    });

    it("names Brave by its client-hint brand, as encrypted DMs do", () => {
      Object.defineProperty(globalThis.navigator, "userAgent", {
        configurable: true,
        value: CHROME_WINDOWS,
      });
      Object.defineProperty(globalThis.navigator, "userAgentData", {
        configurable: true,
        value: {
          brands: [
            { brand: "Chromium", version: "129" },
            { brand: "Brave", version: "129" },
            { brand: "Not=A?Brand", version: "8" },
          ],
          platform: "Windows",
        },
      });

      expect(getDeviceLabel()).toBe("Brave on Windows");
      expect(getDeviceLabel()).toBe(getE2eeDeviceLabel("web"));
    });
  });
});
