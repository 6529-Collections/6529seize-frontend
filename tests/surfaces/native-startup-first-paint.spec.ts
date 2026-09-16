import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import NativeStartupBoundary from "../../components/layout/NativeStartupBoundary";
import { VERSION_RELOAD_STYLES } from "../../components/version-update/VersionReloadScreen";
import {
  NATIVE_STARTUP_SCRIPT,
  NATIVE_STARTUP_STYLES,
} from "../../components/layout/nativeStartup";

// These browser tests use the real boundary markup and critical bootstrap/CSS.
// They need no app server or wallet runtime. LayoutWrapper.hydration.test.tsx
// separately exercises the actual device hooks and web-to-native React commits.
// Each fixture needs the app's mobile viewport settings; setViewportSize alone
// leaves mobile browsers using their default 980px layout viewport.
for (const platform of ["ios", "android", "web"] as const) {
  for (const isNativeLayout of [false, true]) {
    test(`${platform} ${isNativeLayout ? "native layout ready" : "before hydration"} @readonly`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const content = renderToString(
        createElement(NativeStartupBoundary, {
          isNativeLayout,
          children: createElement(
            "main",
            null,
            createElement("h1", null, "Public content"),
            createElement("a", { href: "#about" }, "About")
          ),
        })
      );
      await page.setContent(`<!doctype html><html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <style>${NATIVE_STARTUP_STYLES}body { margin: 0; }</style>
        <script>globalThis.CapacitorCustomPlatform = { name: "${platform}" };</script>
        <script>${NATIVE_STARTUP_SCRIPT}</script>
        </head><body>${content}</body></html>`);
      const main = page.getByRole("main", { includeHidden: true });
      const placeholder = page.getByTestId("native-startup-placeholder");
      const nativePending = platform !== "web" && !isNativeLayout;
      if (nativePending) {
        await expect(main).toBeHidden();
        await expect(placeholder).toBeVisible();
        await expect(page.getByRole("link", { name: "About" })).toHaveCount(0);
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("link", { name: "About", includeHidden: true })
        ).not.toBeFocused();
        const box = await placeholder.boundingBox();
        expect(box).toMatchObject({ x: 0, y: 0, width: 390 });
        expect(box?.height).toBeCloseTo(844, 1);
        await page.screenshot({
          path: info.outputPath(`${platform}-before-hydration.png`),
        });
      } else {
        await expect(main).toBeVisible();
        await expect(placeholder).toBeHidden();
        await expect(
          page.getByRole("heading", { name: "Public content" })
        ).toBeVisible();
        // macOS WebKit may exclude links from Tab traversal by system setting.
        await page.getByRole("link", { name: "About" }).focus();
        await expect(page.getByRole("link", { name: "About" })).toBeFocused();
      }
    });
  }
}

test("version reload cover hands off to the native loading shell @readonly", async ({
  page,
}) => {
  const content = renderToString(
    createElement(NativeStartupBoundary, {
      isNativeLayout: false,
      children: createElement("main", null, "Public content"),
    })
  );
  await page.setContent(`<!doctype html><html data-version-reload="true"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <style>${NATIVE_STARTUP_STYLES}${VERSION_RELOAD_STYLES}</style>
    <script>globalThis.androidBridge = {};</script>
    <script>${NATIVE_STARTUP_SCRIPT}</script>
    </head><body>
    <div id="version-reload-screen" role="status">Updating</div>
    ${content}</body></html>`);
  const placeholder = page.getByTestId("native-startup-placeholder");
  const main = page.getByRole("main", { includeHidden: true });
  await expect(page.getByRole("status")).toBeVisible();
  await expect(placeholder).toBeHidden();
  await expect(main).toBeHidden();
  await page.evaluate(() =>
    document.documentElement.removeAttribute("data-version-reload")
  );
  await expect(page.getByRole("status", { includeHidden: true })).toBeHidden();
  await expect(placeholder).toBeVisible();
  await expect(main).toBeHidden();
});
