import { test, expect } from "@playwright/test";
import { buildSync } from "esbuild";

const userAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MetaMaskMobile/8.12.0";
const bundle = buildSync({
  stdin: {
    contents: `export { installCyclicJsonTimerDiagnostics } from './utils/monitoring/cyclicJsonTimerDiagnostics';
      export { processSentryClientEvent } from './utils/monitoring/sentryClientEventPipeline';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  globalName: "BridgeFilterFixture",
  banner: { js: "var process = { env: {} };" },
  define: {
    "process.env.PUBLIC_RUNTIME": JSON.stringify(
      JSON.stringify({
        BASE_ENDPOINT: "https://6529.io",
        API_ENDPOINT: "https://api.6529.io",
        ALLOWLIST_API_ENDPOINT: "https://fixture.invalid",
        IPFS_API_ENDPOINT: "https://fixture.invalid",
        IPFS_GATEWAY_ENDPOINT: "https://fixture.invalid",
      })
    ),
  },
}).outputFiles[0]!.text;

// The anonymous timer body and metadata serialization reproduce MetaMask's
// SPA_urlChangeListener; no wallet, real website, or Sentry ingestion is used.
// https://github.com/MetaMask/metamask-mobile/blob/v8.12.0/app/util/browserScripts.ts
const cases = [
  { name: "confirmed bridge", kept: false },
  { name: "application toJSON", kept: true, applicationToJSON: true },
  { name: "changed callback", kept: true, changedCallback: true },
  { name: "unsampled bridge", kept: true, unsampled: true },
  { name: "unfamiliar script", kept: true, firstPartyScript: true },
  { name: "other wallet", kept: true, otherWallet: true },
];

for (const scenario of cases) {
  test(`preserves the reporting boundary for ${scenario.name}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent: scenario.otherWallet
        ? userAgent.replace("MetaMaskMobile", "RabbyMobile")
        : userAgent,
    });
    const page = await context.newPage();
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    try {
      await page.setContent(
        '<!doctype html><html><head><meta property="og:site_name" content="6529.io"></head><body></body></html>',
        { waitUntil: "domcontentloaded" }
      );
      await page.addScriptTag({ content: bundle });
      await page.evaluate(`
        globalThis.bridgeResults = [];
        globalThis.originalStringify = JSON.stringify;
        const nativeTimer = window.setTimeout;
        // Capture outside the diagnostics wrapper, as Sentry BrowserApiErrors does.
        window.setTimeout = function (handler, delay, ...args) {
          return nativeTimer(function () {
            try { handler.apply(this, args); }
            catch (error) {
              const event = { exception: { values: [{ type: error.name, value: error.message,
                mechanism: { type: 'auto.browser.browserapierrors.setTimeout', handled: false } }] } };
              const kept = BridgeFilterFixture.processSentryClientEvent(event, { originalException: error }) !== null;
              bridgeResults.push({ kept, message: error.message, stack: error.stack });
            }
          }, delay);
        };
        BridgeFilterFixture.installCyclicJsonTimerDiagnostics({ random: () => ${scenario.unsampled ? 1 : 0} });
        const metadata = document.querySelector('meta');
        metadata.fixtureFiber = { stateNode: metadata };
        ${
          scenario.applicationToJSON
            ? `metadata.toJSON = function applicationToJSON() {
          const cyclic = {}; cyclic.self = cyclic; return JSON.stringify(cyclic);
        };`
            : ""
        }
        //# sourceURL=https://fixture.invalid/application.js
      `);
      const bridgeScript = `
        (function () {
          function __mm__updateUrl() {
            const title = document.querySelector('head > meta[property="og:site_name"]') || document.title;
            JSON.stringify({ type: 'NAV_CHANGE', payload: { title: title } });
          }
          setTimeout(function () { ${scenario.changedCallback ? "const result = __mm__updateUrl(); return result;" : "__mm__updateUrl();"} }, 0);
        })();
      `;
      if (scenario.firstPartyScript) {
        await page.route("https://fixture.invalid/bridge.js", (route) =>
          route.fulfill({
            contentType: "application/javascript",
            body: bridgeScript,
          })
        );
        await page.addScriptTag({ url: "https://fixture.invalid/bridge.js" });
      } else {
        await page.evaluate(bridgeScript);
      }
      await expect
        .poll(() => page.evaluate("globalThis.bridgeResults.length"), {
          message: JSON.stringify(browserErrors),
        })
        .toBe(1);
      const result = await page.evaluate("globalThis.bridgeResults[0]");
      expect(result.message).toBe(
        "JSON.stringify cannot serialize cyclic structures."
      );
      expect(result.kept, result.stack).toBe(scenario.kept);
      expect(
        await page.evaluate("JSON.stringify === globalThis.originalStringify")
      ).toBe(true);
    } finally {
      await context.close();
    }
  });
}
