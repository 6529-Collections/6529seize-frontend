import type { Page } from "@playwright/test";
import {
  expect,
  test,
  waitForRouteReady,
  expectNoHorizontalOverflow,
} from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import { longPressMessage } from "../support/longPressMessage";

const WAVE = "00000000-0000-4000-8000-000000000529";
const DROP = "00000000-0000-4000-8000-000000000530";
const DM = "00000000-0000-4000-8000-000000000532";

type NativeSimulation = typeof globalThis & {
  readonly __playwrightAppListeners?: readonly string[];
  readonly __playwrightNativeCalls?: readonly string[];
  readonly __playwrightLastBackAt?: number;
  readonly __playwrightKeyboardListeners?: readonly string[];
};

useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_AUTH_SANDBOX",
  "Requires the local mock API."
);

test.beforeEach(async ({ page, context, baseURL }, testInfo) => {
  test.skip(
    testInfo.project.name !== "web-mobile-chromium",
    "Browser simulation of the Android native bridge uses mobile Chromium."
  );
  await installSurfaceSimulation(context, "capacitor-android-sim", baseURL);
  await hideNextDevOverlay(context);
  await page.setViewportSize({ width: 412, height: 840 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("**/api/drops/*/curations**", (route) =>
    route.fulfill({ json: [] })
  );
});

async function back(page: Page) {
  await page.waitForFunction(() => {
    const runtime = globalThis as NativeSimulation;
    return (
      runtime.__playwrightAppListeners?.includes("backButton") &&
      Date.now() - (runtime.__playwrightLastBackAt ?? 0) >= 260
    );
  });
  const delivered = await page.evaluate(
    () =>
      !globalThis.dispatchEvent(
        new CustomEvent("playwright:backButton", {
          detail: { canGoBack: true },
          cancelable: true,
        })
      )
  );
  expect(delivered).toBe(true);
}

async function keyboardEvent(
  page: Page,
  eventName: string,
  keyboardHeight = 0
) {
  await page.waitForFunction(
    (name) =>
      (globalThis as NativeSimulation).__playwrightKeyboardListeners?.includes(
        name
      ),
    eventName
  );
  const delivered = await page.evaluate(
    ({ name, height }) =>
      !globalThis.dispatchEvent(
        new CustomEvent(`playwright:${name}`, {
          detail: { keyboardHeight: height },
          cancelable: true,
        })
      ),
    { name: eventName, height: keyboardHeight }
  );
  expect(delivered).toBe(true);
}

async function openWave(page: Page, path = `/waves/${WAVE}`) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("textbox", { name: "Write a message" }).last()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
}

async function openActions(page: Page) {
  await longPressMessage(
    page,
    page.getByRole("tabpanel").locator("[data-wave-drop-id]").first()
  );
  await expect(
    page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .getByRole("button", { name: "Add Reaction", exact: true })
  ).toBeVisible();
}

async function nativeCalls(page: Page) {
  return page.evaluate(
    () => (globalThis as NativeSimulation).__playwrightNativeCalls ?? []
  );
}

test("Android Back hides the keyboard before closing the action sheet", async ({
  page,
  baseURL,
}) => {
  await openWave(page);
  await openActions(page);
  await keyboardEvent(page, "keyboardWillShow", 320);
  await keyboardEvent(page, "keyboardDidShow", 320);
  await expect(page.locator("html")).toHaveAttribute(
    "data-native-keyboard-visible",
    "true"
  );
  await back(page);
  await expect.poll(() => nativeCalls(page)).toContain("Keyboard.hide");
  await expect(
    page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .getByRole("button", { name: "Add Reaction", exact: true })
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
  await keyboardEvent(page, "keyboardWillHide");
  await keyboardEvent(page, "keyboardDidHide");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-native-keyboard-visible"
  );
  await back(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await nativeCalls(page)).not.toContain("App.minimizeApp");
  await expectNoUnsafeSandboxMutations(baseURL);
});

test("Android Back returns from reactions before dismissing the action sheet", async ({
  page,
  baseURL,
}, testInfo) => {
  await openWave(page);
  await openActions(page);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add Reaction", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Add reaction to drop", exact: true })
      .getByRole("button", { name: "Back", exact: true })
  ).toBeVisible();
  await back(page);
  await expect(
    page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .getByRole("button", { name: "Add Reaction", exact: true })
  ).toBeVisible();
  await back(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("android-back-sheet-closed.png"),
  });
  await expectNoUnsafeSandboxMutations(baseURL);
});

test("Android Back closes single-drop content before the wave and minimizes only at root", async ({
  page,
  baseURL,
}) => {
  await page.goto(`/waves/${WAVE}?drop=${DROP}`, {
    waitUntil: "domcontentloaded",
  });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("button", { name: "Close panel", exact: true })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await back(page);
  await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
  await expect(
    page.getByRole("button", { name: "Close panel", exact: true })
  ).toHaveCount(0);
  expect(await nativeCalls(page)).not.toContain("App.minimizeApp");
  await back(page);
  await expect(page).toHaveURL(/\/waves$/);
  await expect(
    page.getByRole("button", { name: "Find a wave…", exact: true })
  ).toBeVisible();
  expect(await nativeCalls(page)).not.toContain("App.minimizeApp");
  await back(page);
  await expect.poll(() => nativeCalls(page)).toContain("App.minimizeApp");
  await expectNoUnsafeSandboxMutations(baseURL);
});

test("Android Back returns a direct-message deep link to Messages", async ({
  page,
  baseURL,
}) => {
  await openWave(page, `/messages/${DM}`);
  await back(page);
  await expect(page).toHaveURL(/\/messages$/);
  expect(await nativeCalls(page)).not.toContain("App.minimizeApp");
  await expectNoUnsafeSandboxMutations(baseURL);
});

test("Android Back keeps a direct profile link inside the app before root exit", async ({
  page,
  baseURL,
}) => {
  await page.goto("/playwright", { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await back(page);
  await expect(page).toHaveURL(new URL("/", baseURL).toString());
  expect(await nativeCalls(page)).not.toContain("App.minimizeApp");
  await expectNoUnsafeSandboxMutations(baseURL);
});

test("Android Back leaves the time-zone page when its inline map is visible", async ({
  page,
  baseURL,
}) => {
  await page.goto("/tools/time-zones", { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("listbox", { name: "Time zone map", exact: true })
  ).toBeVisible();
  await back(page);
  await expect(page).toHaveURL(new URL("/", baseURL).toString());
  expect(await nativeCalls(page)).not.toContain("App.minimizeApp");
  await expectNoUnsafeSandboxMutations(baseURL);
});
