import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext, Script } from "node:vm";
import {
  LEGACY_BROWSER_ATTRIBUTE,
  LEGACY_BROWSER_FLAG_SCRIPT,
  LEGACY_BROWSER_NOTICE_ID,
  LEGACY_BROWSER_NOTICE_SCRIPT,
  LEGACY_BROWSER_STYLES,
  LEGACY_BROWSER_SYNTAX_SCRIPT,
} from "@/components/legacy-browser/legacyBrowserGate";

const IPHONE_IOS_16_0 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
const IPADOS_DESKTOP_MODE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15";
const OLD_ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36";

/**
 * Runs the inline scripts in order, as the HTML parser does. An engine
 * without class static blocks rejects script 2 as a parse error and skips
 * it; `parsesStaticBlocks: false` models that.
 */
function runGate({
  parsesStaticBlocks,
  navigator = { userAgent: IPHONE_IOS_16_0, platform: "iPhone" },
}: {
  readonly parsesStaticBlocks: boolean;
  readonly navigator?: Record<string, unknown> | undefined;
}) {
  const setAttribute = jest.fn();
  const context: Record<string, unknown> = {
    navigator,
    document: { documentElement: { setAttribute } },
  };
  context["window"] = context;
  runInNewContext(LEGACY_BROWSER_FLAG_SCRIPT, context);
  if (parsesStaticBlocks) {
    runInNewContext(LEGACY_BROWSER_SYNTAX_SCRIPT, context);
  }
  runInNewContext(LEGACY_BROWSER_NOTICE_SCRIPT, context);
  return { setAttribute, flag: context["__6529LegacyBrowser"] };
}

describe("legacy browser gate", () => {
  it("leaves browsers that run the site untouched", () => {
    const { setAttribute, flag } = runGate({ parsesStaticBlocks: true });
    expect(flag).toBe(false);
    expect(setAttribute).not.toHaveBeenCalled();
  });

  it.each([
    ["an iPhone", { userAgent: IPHONE_IOS_16_0, platform: "iPhone" }, "ios"],
    [
      "an iPad that reports a Mac",
      {
        userAgent: IPADOS_DESKTOP_MODE,
        platform: "MacIntel",
        maxTouchPoints: 5,
      },
      "ios",
    ],
    [
      "a Mac",
      {
        userAgent: IPADOS_DESKTOP_MODE,
        platform: "MacIntel",
        maxTouchPoints: 0,
      },
      "other",
    ],
    ["an old Android browser", { userAgent: OLD_ANDROID_CHROME }, "other"],
  ])(
    "shows the notice on %s that cannot parse the site",
    (_name, navigator, variant) => {
      const { setAttribute, flag } = runGate({
        parsesStaticBlocks: false,
        navigator,
      });
      expect(flag).toBe(true);
      expect(setAttribute).toHaveBeenCalledWith(
        LEGACY_BROWSER_ATTRIBUTE,
        variant
      );
    }
  );

  it("does nothing when none of the inline scripts may run", () => {
    const setAttribute = jest.fn();
    // A CSP without 'unsafe-inline' blocks all three alike: no flag.
    runInNewContext(LEGACY_BROWSER_NOTICE_SCRIPT, {
      window: {},
      navigator: { userAgent: IPHONE_IOS_16_0 },
      document: { documentElement: { setAttribute } },
    });
    expect(setAttribute).not.toHaveBeenCalled();
  });

  it("never throws", () => {
    const context: Record<string, unknown> = { __6529LegacyBrowser: true };
    context["window"] = context;
    expect(() =>
      runInNewContext(LEGACY_BROWSER_NOTICE_SCRIPT, context)
    ).not.toThrow();
  });

  it("detects with the exact syntax the site's bundles fail on", () => {
    // Safari before 16.4 reports "Unexpected token '{'" for a static block.
    expect(LEGACY_BROWSER_SYNTAX_SCRIPT).toMatch(/class\s*\{\s*static\s*\{/);
    // A class expression: no global name another script could clash with.
    expect(LEGACY_BROWSER_SYNTAX_SCRIPT).not.toMatch(/class\s+\w/);
    expect(() => new Script(LEGACY_BROWSER_SYNTAX_SCRIPT)).not.toThrow();
  });

  it.each([
    ["the flag script", LEGACY_BROWSER_FLAG_SCRIPT],
    ["the notice script", LEGACY_BROWSER_NOTICE_SCRIPT],
  ])("keeps %s to syntax every old browser runs", (_name, script) => {
    expect(script).not.toMatch(/=>|\blet\b|\bconst\b|`|\?\.|\?\?|\bclass\b/);
  });

  it("hides the notice unless the gate marks the page", () => {
    const rules = LEGACY_BROWSER_STYLES.trim().split("\n");
    expect(rules[0]).toBe(`#${LEGACY_BROWSER_NOTICE_ID}{display:none}`);
    for (const rule of rules.slice(1)) {
      expect(
        rule.startsWith(`html[${LEGACY_BROWSER_ATTRIBUTE}`) ||
          rule.startsWith(`#${LEGACY_BROWSER_NOTICE_ID} `)
      ).toBe(true);
    }
    expect(LEGACY_BROWSER_STYLES).toContain(
      `html[${LEGACY_BROWSER_ATTRIBUTE}] body>:not(#${LEGACY_BROWSER_NOTICE_ID}){display:none!important}`
    );
  });

  it("matches the strings the Device Farm notice probe verified", () => {
    const fixture = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "tests/device-farm/fixtures/legacy-browser-gate.json"
        ),
        "utf8"
      )
    ) as Record<string, string>;
    expect(fixture).toMatchObject({
      styles: LEGACY_BROWSER_STYLES,
      flagScript: LEGACY_BROWSER_FLAG_SCRIPT,
      syntaxScript: LEGACY_BROWSER_SYNTAX_SCRIPT,
      noticeScript: LEGACY_BROWSER_NOTICE_SCRIPT,
      attribute: LEGACY_BROWSER_ATTRIBUTE,
    });
  });
});
