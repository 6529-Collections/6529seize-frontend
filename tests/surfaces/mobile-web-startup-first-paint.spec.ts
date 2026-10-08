import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  SMALL_WEB_STARTUP_SCRIPT,
  SMALL_WEB_STARTUP_STYLES,
} from "../../components/layout/smallWebStartup";

const globals = readFileSync("styles/globals.css", "utf8");
const layoutStyles = globals.match(/@layer components \{[\s\S]*?\n\}/u)?.[0];
if (!layoutStyles) throw new Error("Global layout styles are missing");

// Exercise production startup CSS with React absent. WebLayout.test.tsx covers
// the markup contract; home.spec.ts withholds real Next bundles on the route.
// These fixtures need no local server.
for (const mobile of [true, false]) {
  test(`${mobile ? "phone" : "touch laptop"} first paint preserves the correct chrome @readonly`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(`<!doctype html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>${layoutStyles}
        body { margin: 0; background: #000; color: #fff; font-family: sans-serif; }
        .layout-root { display: flex; width: 100%; }
        [data-web-sidebar] { position: fixed; width: 80px; height: 100vh; background: #26272b; }
        [data-web-small-header] { height: 64px; border-bottom: 1px solid #26272b; }
        main { padding-top: 24px; }
      </style>
      <style>${SMALL_WEB_STARTUP_STYLES}</style>
      <script>
        Object.defineProperty(navigator, "userAgent", { value: ${JSON.stringify(mobile ? "iPhone" : "Windows")}, configurable: true });
        Object.defineProperty(navigator, "maxTouchPoints", { value: 5, configurable: true });
        Object.defineProperty(navigator, "userAgentData", { value: undefined, configurable: true });
        globalThis.matchMedia = query => ({ matches: ${mobile ? "false" : "true"} });
      </script>
      <script>${SMALL_WEB_STARTUP_SCRIPT}</script>
      </head><body>
        <div class="layout-root" data-small="false" style="--sidebar-width:80px;--collapsed-width:80px">
          <div hidden data-web-small-header="true"><header><a href="#home">6529</a><button>Open menu</button></header></div>
          <div data-web-sidebar="true"><nav aria-label="Primary sidebar"><a href="#waves">Waves</a></nav></div>
          <main data-mobile="false" data-narrow="false" class="layout-main"><h1>Building a decentralized network state</h1></main>
        </div>
      </body></html>`);
    const header = page.getByRole("banner", { includeHidden: true });
    const sidebar = page.getByRole("navigation", {
      name: "Primary sidebar",
      includeHidden: true,
    });
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    if (mobile) {
      await expect(header).toBeVisible();
      await expect(sidebar).toBeHidden();
      const box = await main.boundingBox();
      expect(box?.x).toBe(0);
      expect(box?.width).toBe(390);
      await page.getByRole("link", { name: "6529" }).focus();
      await expect(page.getByRole("link", { name: "6529" })).toBeFocused();
      expect(
        await main.evaluate((el) => getComputedStyle(el).paddingLeft)
      ).toBe("0px");
    } else {
      await expect(header).toBeHidden();
      await expect(sidebar).toBeVisible();
      expect(
        await main.evaluate((el) => getComputedStyle(el).paddingLeft)
      ).toBe("80px");
    }
    await page.screenshot({
      path: info.outputPath(
        `${mobile ? "mobile" : "desktop"}-before-hydration.png`
      ),
    });
  });
}
