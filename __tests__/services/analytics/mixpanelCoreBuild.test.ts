import fs from "node:fs";
import mixpanel from "mixpanel-browser/dist/mixpanel-core.cjs.js";
import { MIXPANEL_PRIVACY_CONFIG } from "@/services/analytics/mixpanelPrivacy";

const CORE_BUILD = "mixpanel-browser/dist/mixpanel-core.cjs.js";

// Options passed by initAnalytics() in services/analytics/mixpanel.ts.
const INIT_OPTION_KEYS = [
  ...Object.keys(MIXPANEL_PRIVACY_CONFIG),
  "batch_autostart",
  "persistence",
  "loaded",
  "hooks",
];

type SdkInstance = Record<string, unknown> & {
  config: Record<string, unknown>;
  get_config: (key: string) => unknown;
};

const initInstance = (
  name: string,
  options: Record<string, unknown>
): SdkInstance =>
  (
    mixpanel.init as unknown as (
      token: string,
      config: Record<string, unknown>,
      name: string
    ) => unknown
  )("core-build-test", options, name) as SdkInstance;

describe("mixpanel recorder-free core build", () => {
  it("does not contain the rrweb session recorder", () => {
    const source = fs.readFileSync(require.resolve(CORE_BUILD), "utf8");

    expect(source).not.toMatch(/rrweb/i);
  });

  it("supports every option and method the analytics wrapper relies on", () => {
    // A pristine instance exposes the SDK's own default config keys.
    const sdk = initInstance("pristine", {});
    const supported = Object.keys(sdk.config);

    expect(
      INIT_OPTION_KEYS.filter((option) => !supported.includes(option))
    ).toEqual([]);
    for (const method of [
      "identify",
      "people",
      "register",
      "reset",
      "start_batch_senders",
      "stop_batch_senders",
      "track",
      "unregister",
    ]) {
      expect(sdk).toHaveProperty(method);
    }
  });

  it("keeps recording and autocapture off with the privacy options", () => {
    const sdk = initInstance("privacy", {
      ...MIXPANEL_PRIVACY_CONFIG,
      batch_autostart: false,
      persistence: "localStorage",
    });

    expect(sdk.get_config("record_sessions_percent")).toBe(0);
    expect(sdk.get_config("autocapture")).toBe(false);
    expect(sdk.get_config("track_pageview")).toBe(false);
    expect(sdk.get_config("save_referrer")).toBe(false);
    expect(sdk.get_config("property_blacklist")).toEqual(
      MIXPANEL_PRIVACY_CONFIG.property_blacklist
    );
  });
});
