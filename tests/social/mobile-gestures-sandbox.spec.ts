import {
  expectNativeNavigation,
  sampleNativeNavigation,
} from "../support/nativePhoneNavigation";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import { devices, type Locator, type Page } from "@playwright/test";
import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  getSandboxApiOrigin,
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import { longPressMessage } from "../support/longPressMessage";

const WAVE = "00000000-0000-4000-8000-000000000529";
const DM = "00000000-0000-4000-8000-000000000532";
useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_AUTH_SANDBOX",
  "Requires the local mock API."
);

interface TouchOffset {
  readonly x: number;
  readonly y: number;
}

interface FeedReturnPaint {
  readonly scrollTop: number;
  readonly readableCard: boolean;
  readonly outgoingChatPreserved?: boolean;
  readonly readingCardTop?: number | undefined;
}

async function touchDrag(
  page: Page,
  target: Locator,
  movement: number | readonly TouchOffset[],
  dy = 0,
  advanceFrame: () => Promise<void> = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    )
) {
  await target.click({ trial: true });
  const box = await target.boundingBox();
  if (!box) throw new Error("Swipe target must be visible");
  const rightwardDistance =
    typeof movement === "number"
      ? Math.max(0, movement)
      : Math.max(0, ...movement.map((offset) => offset.x));
  const viewportWidth = page.viewportSize()?.width ?? box.x + box.width;
  const x = Math.max(
    50,
    box.x + 1,
    Math.min(
      300,
      box.x + box.width * 0.65,
      viewportWidth - rightwardDistance - 8
    )
  );
  const y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  // Deliver input at frame cadence, as a real finger does, instead of sending
  // the entire drag before the page has processed the initial touch.
  const path =
    typeof movement === "number"
      ? Array.from({ length: 8 }, (_, index) => ({
          x: (movement * (index + 1)) / 8,
          y: (dy * (index + 1)) / 8,
        }))
      : movement;
  for (const offset of path) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + offset.x, y: y + offset.y }],
    });
    await advanceFrame();
  }
  return {
    release: async () => {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await client.detach();
    },
    reverse: async () => {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + ((path.at(-1)?.x ?? 0) > 0 ? 10 : -10), y }],
      });
    },
  };
}

async function openWave(page: Page) {
  await page.goto(`/waves/${WAVE}`, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("textbox", { name: "Write a message" }).last()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await expect(
    page
      .getByRole("tabpanel")
      .locator("[data-wave-drop-id][data-reply-enabled=true]")
      .first()
  ).toBeVisible();
}

async function keyboardEvent(page: Page, name: string, height = 0) {
  await page.waitForFunction(
    (eventName) =>
      (
        globalThis as typeof globalThis & {
          __playwrightKeyboardListeners?: string[];
        }
      ).__playwrightKeyboardListeners?.includes(eventName),
    name
  );
  const delivered = await page.evaluate(
    ({ eventName, keyboardHeight }) =>
      !dispatchEvent(
        new CustomEvent(`playwright:${eventName}`, {
          detail: { keyboardHeight },
          cancelable: true,
        })
      ),
    { eventName: name, keyboardHeight: height }
  );
  expect(delivered).toBe(true);
}

async function installMessageFixture(page: Page, baseURL: string | undefined) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("**/api/waves/*/curations**", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/drops/*/curations**", (route) =>
    route.fulfill({ json: [] })
  );
  const origin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${origin}/api/v2/waves/${WAVE}/drops?limit=50`
  );
  const feed = (await response.json()) as ApiWaveDropsFeedV2;
  const template = feed.drops[0];
  if (!template) throw new Error("Missing local message fixture");
  const drops = [
    { ...template, content: "Gesture fixture message one" },
    {
      ...template,
      id: "00000000-0000-4000-8000-000000000610",
      serial_no: 2,
      created_at: template.created_at + 1000,
      content: "Gesture fixture message two",
    },
  ].reverse();
  await page.route(`**/api/v2/waves/${WAVE}/drops?**`, (route) =>
    route.fulfill({ json: { ...feed, drops } })
  );
  await page.route("**/api/v2/curated-profile-wave-drops?**", (route) =>
    route.fulfill({
      json: {
        page: 1,
        next: false,
        data: Array.from({ length: 8 }, (_, index) => ({
          ...template,
          id: `00000000-0000-4000-8000-${String(700 + index).padStart(12, "0")}`,
          serial_no: 1,
          content: `Profile feed gesture fixture ${index + 1}. A longer post gives the feed a real reading position to restore after opening its chat. Keep reading here after returning.`,
          author: {
            ...template.author,
            badges: {
              ...template.author.badges,
              profile_wave_id: WAVE,
              profile_wave_name: "Gesture profile wave",
            },
          },
        })),
      },
    })
  );
  await page.routeWebSocket(
    (url) => url.port === new URL(origin).port,
    (socket) => {
      socket.onMessage((message) => {
        if (JSON.parse(String(message)).type === "AUTHENTICATE")
          socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
      });
    }
  );
}

for (const platform of ["ios", "android"] as const) {
  test.describe(`${platform} gesture browser simulation`, () => {
    test.beforeEach(async ({ context, baseURL, page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "Trusted touch input uses mobile Chromium; native bridge is simulated."
      );
      await installSurfaceSimulation(
        context,
        `capacitor-${platform}-sim`,
        baseURL
      );
      await hideNextDevOverlay(context);
      await page.setViewportSize({ width: 412, height: 840 });
      await installMessageFixture(page, baseURL);
    });

    if (platform === "ios") {
      test("short landscape keeps the composer, reply preview and messages above the keyboard", async ({
        page,
        baseURL,
      }) => {
        await page.setViewportSize({ width: 932, height: 430 });
        await openWave(page);
        const tabs = page.getByRole("navigation", {
          name: "Wave sections",
          exact: true,
        });
        const editor = page.getByRole("textbox").last();
        const cancelReply = page.getByRole("button", {
          name: "Cancel reply",
          exact: true,
        });
        const draft = "Unsent landscape QA draft";
        await expect(tabs).toBeVisible();
        await editor.fill(draft);

        const expectKeyboardLayout = async () => {
          await expect(editor).toBeFocused();
          await keyboardEvent(page, "keyboardWillShow", 244);
          await keyboardEvent(page, "keyboardDidShow", 244);
          await expect
            .poll(() =>
              editor.evaluate(
                (element) => element.getBoundingClientRect().bottom
              )
            )
            .toBeLessThanOrEqual(186);
          await expect(tabs).toBeHidden();
          await expect
            .poll(() =>
              page
                .getByRole("tabpanel")
                .locator('[data-wave-drops-scroll-container="true"]')
                .last()
                .evaluate((element) => element.clientHeight)
            )
            .toBeGreaterThanOrEqual(24);
          await expect(editor).toHaveText(draft);
        };
        const dismissKeyboard = async (expectReplyBlur = false) => {
          await keyboardEvent(page, "keyboardWillHide");
          await keyboardEvent(page, "keyboardDidHide");
          await expect(tabs).toBeVisible();
          if (expectReplyBlur) await expect(editor).not.toBeFocused();
        };

        await expectKeyboardLayout();
        await dismissKeyboard();
        for (const method of ["swipe", "sheet"] as const) {
          const row = page
            .getByTestId("wave-swipe-surface")
            .locator("[data-wave-drop-id][data-reply-enabled=true]")
            .last();
          if (method === "swipe") {
            const swipe = await touchDrag(page, row, -120);
            await swipe.release();
          } else {
            await longPressMessage(page, row);
            await page
              .getByRole("dialog", { name: "Drop actions", exact: true })
              .getByRole("button", { name: "Reply", exact: true })
              .click();
          }
          await expect(cancelReply).toBeVisible();
          await expectKeyboardLayout();
          await expect
            .poll(() =>
              cancelReply.evaluate(
                (element) => element.getBoundingClientRect().bottom
              )
            )
            .toBeLessThanOrEqual(186);
          await dismissKeyboard(true);
          await expect(cancelReply).toBeVisible();
          await cancelReply.click();
          await expect(editor).toHaveText(draft);
        }

        await page.setViewportSize({ width: 430, height: 932 });
        await editor.click();
        await keyboardEvent(page, "keyboardWillShow", 388);
        await keyboardEvent(page, "keyboardDidShow", 388);
        await expect(tabs).toBeVisible();
        await expect
          .poll(() =>
            editor.evaluate((element) => element.getBoundingClientRect().bottom)
          )
          .toBeLessThanOrEqual(544);
        await dismissKeyboard();
        await editor.fill("");
        await expectNoUnsafeSandboxMutations(baseURL);
      });

      for (const [screen, path] of [
        ["Wave", `/waves/${WAVE}`],
        ["DM", `/messages/${DM}`],
      ] as const) {
        test(`${screen} composer stays still from its first frame on list entry`, async ({
          page,
          baseURL,
        }) => {
          // Reopening a cached chat exposes stale list measurements immediately.
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await waitForRouteReady(page);
          await expect(
            page.getByRole("textbox", { name: "Write a message" }).last()
          ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
          await page.getByRole("button", { name: "Back", exact: true }).tap();
          const listPath = screen === "Wave" ? "/waves" : "/messages";
          await expect(page).toHaveURL(new RegExp(`${listPath}$`, "u"));
          const row = page
            .getByRole("link", {
              name:
                screen === "Wave"
                  ? /Local Composer Sandbox Wave/u
                  : /Sandbox Direct Message/u,
            })
            .first();
          await expect(row).toBeVisible();

          const entryFrames = page.evaluate(
            () =>
              new Promise<number[]>((resolve, reject) => {
                const positions: number[] = [];
                const deadline = performance.now() + 10_000;
                const sample = () => {
                  const editor = document.querySelector<HTMLElement>(
                    '[data-ios-chat-composer] [role="textbox"]'
                  );
                  const box = editor?.getBoundingClientRect();
                  if (box && box.height > 0) positions.push(box.top);
                  if (positions.length >= 20) resolve(positions);
                  else if (performance.now() > deadline)
                    reject(new Error("Conversation composer did not paint"));
                  else requestAnimationFrame(sample);
                };
                requestAnimationFrame(sample);
              })
          );
          await row.tap();
          const positions = await entryFrames;
          expect(
            Math.max(...positions) - Math.min(...positions)
          ).toBeLessThanOrEqual(1);
          await expectNoUnsafeSandboxMutations(baseURL);
        });

        test(`${screen} keyboard keeps the header in the iPhone safe area`, async ({
          context,
          page,
          baseURL,
        }) => {
          const client = await context.newCDPSession(page);
          await client.send("Emulation.setSafeAreaInsetsOverride", {
            insets: { top: 59, bottom: 34 },
          });
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await waitForRouteReady(page);
          const editor = page
            .getByRole("textbox", { name: "Write a message" })
            .last();
          await expect(editor).toBeVisible({
            timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          });
          const back = page.getByRole("button", { name: "Back", exact: true });
          const headerTop = () =>
            back.evaluate((element) => element.getBoundingClientRect().top);
          const top = await headerTop();
          expect(top).toBeGreaterThanOrEqual(59);
          const expectPageToFit = () =>
            expect
              .poll(() =>
                page.evaluate(
                  () =>
                    document.documentElement.scrollHeight -
                    document.documentElement.clientHeight
                )
              )
              .toBeLessThanOrEqual(1);
          await expectPageToFit();

          await editor.focus();
          await keyboardEvent(page, "keyboardWillShow", 340);
          await keyboardEvent(page, "keyboardDidShow", 340);
          await expect
            .poll(() =>
              editor.evaluate(
                (element) => element.getBoundingClientRect().bottom
              )
            )
            .toBeLessThanOrEqual(500);
          await expect.poll(headerTop).toBeCloseTo(top, 0);
          await expectPageToFit();

          await editor.blur();
          await keyboardEvent(page, "keyboardWillHide");
          await keyboardEvent(page, "keyboardDidHide");
          await expectPageToFit();
          await expect.poll(headerTop).toBeCloseTo(top, 0);
          await expectNoUnsafeSandboxMutations(baseURL);
        });
      }

      test("DM header follows the finger during swipe Back", async ({
        page,
        baseURL,
      }) => {
        const conversation = `/messages/${DM}`;
        await page.goto(conversation, { waitUntil: "domcontentloaded" });
        await waitForRouteReady(page);
        await expect(
          page.getByRole("textbox", { name: "Write a message" }).last()
        ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });

        const headerBack = page.getByRole("button", {
          name: "Back",
          exact: true,
        });
        const surface = page.getByTestId("wave-swipe-surface");
        const horizontalPosition = (element: Locator) =>
          element.evaluate((node) => node.getBoundingClientRect().x);
        const headerStart = await horizontalPosition(headerBack);
        const contentStart = await horizontalPosition(surface);
        const drag = await touchDrag(page, surface, 115);
        await expect
          .poll(async () => (await horizontalPosition(surface)) - contentStart)
          .toBeGreaterThan(80);
        const contentTravel =
          (await horizontalPosition(surface)) - contentStart;
        expect(
          (await horizontalPosition(headerBack)) - headerStart
        ).toBeCloseTo(contentTravel, 0);

        await drag.reverse();
        await drag.release();
        await expect(page).toHaveURL(new RegExp(`${conversation}$`, "u"));
        await expect
          .poll(() => horizontalPosition(headerBack))
          .toBeCloseTo(headerStart, 0);
        await expect
          .poll(() =>
            surface.evaluate((node) => {
              const pageSurface = node.closest<HTMLElement>(
                "[data-wave-swipe-page]"
              );
              return [
                node.style.transform,
                node.style.willChange,
                pageSurface?.style.transform,
                pageSurface?.style.willChange,
              ];
            })
          )
          .toEqual(["", "", "", ""]);

        const committed = await touchDrag(page, surface, 240);
        await committed.release();
        await expect(page).toHaveURL(/\/messages$/u);
        await expectNoHorizontalOverflow(page);
        await expectNoUnsafeSandboxMutations(baseURL);
      });
    }

    test("wave-back follows interior touch, reverses and then commits without a second transition", async ({
      page,
      baseURL,
    }, testInfo) => {
      await openWave(page);
      const visibleBack = page.getByRole("button", {
        name: "Back",
        exact: true,
      });
      await visibleBack.focus();
      await expect(visibleBack).toBeFocused();
      await visibleBack.press("Enter");
      await expect(page).toHaveURL(/\/waves$/);
      await openWave(page);
      const title = page.getByRole("button", {
        name: "About Local Composer Sandbox Wave",
        exact: true,
      });
      const join = page.getByRole("button", {
        name: "Join Local Composer Sandbox Wave",
        exact: true,
      });
      const titleStart = await title.evaluate(
        (element) => element.getBoundingClientRect().x
      );
      const joinStart = await join.evaluate(
        (element) => element.getBoundingClientRect().x
      );
      const row = page
        .getByTestId("wave-swipe-surface")
        .locator("[data-wave-drop-id][data-reply-enabled=true]")
        .first();
      const dragging = await touchDrag(page, row, 115);
      await expect
        .poll(() =>
          page
            .getByTestId("wave-swipe-surface")
            .evaluate((element) => element.getBoundingClientRect().x)
        )
        .toBeGreaterThan(80);
      const contentOffset = await page
        .getByTestId("wave-swipe-surface")
        .evaluate((element) => element.getBoundingClientRect().x);
      for (const [control, start] of [
        [title, titleStart],
        [join, joinStart],
      ] as const) {
        expect(
          await control.evaluate((element) => element.getBoundingClientRect().x)
        ).toBeCloseTo(start + contentOffset, 0);
      }
      await page.screenshot({
        path: testInfo.outputPath("wave-back-tracking.png"),
      });
      await dragging.reverse();
      await dragging.release();
      await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}`));
      await expect
        .poll(() =>
          title.evaluate((element) => element.getBoundingClientRect().x)
        )
        .toBeCloseTo(titleStart, 0);
      await page.evaluate(() => {
        const start = document.startViewTransition.bind(document);
        document.startViewTransition = (...args) => {
          document.documentElement.dataset["waveSwipeCaptured"] = "true";
          return start(...args);
        };
      });
      // Slow drags now require half the viewport; short flicks are checked separately.
      const committed = await touchDrag(page, row, 240);
      await committed.release();
      await expect(page).toHaveURL(/\/waves$/);
      await expect(
        page.getByRole("button", { name: "Find a wave…", exact: true })
      ).toBeVisible();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-wave-navigation-transition"
      );
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-wave-swipe-captured"
      );
      await expectNoHorizontalOverflow(page);
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("quick back flick keeps ownership through a small first move and release jitter", async ({
      page,
      baseURL,
    }) => {
      await openWave(page);
      const row = page
        .getByRole("tabpanel")
        .locator("[data-wave-drop-id][data-reply-enabled=true]")
        .first();
      await page.clock.install();
      await page.clock.pauseAt(Date.now() + 10_000);
      const flick = await touchDrag(
        page,
        row,
        [
          { x: 9, y: -2 },
          { x: 20, y: -2 },
          { x: 35, y: -1 },
          { x: 52, y: 2 },
          { x: 76.3, y: 7 },
          { x: 76.4, y: 7 },
        ],
        0,
        () => page.clock.runFor(16)
      );
      await flick.release();
      await page.clock.resume();
      await expect(page).toHaveURL(/\/waves$/);
      await expect(
        page.getByRole("button", { name: "Find a wave…", exact: true })
      ).toBeVisible();
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("profile feed swipes back to Waves and chat returns to the same reading position", async ({
      page,
      baseURL,
    }) => {
      await page.addInitScript(() => {
        const browser = globalThis as typeof globalThis & {
          __feedReturnPaints?: FeedReturnPaint[];
        };
        browser.__feedReturnPaints = [];
        let readyForReturn = false;
        let currentPaint:
          | { -readonly [K in keyof FeedReturnPaint]: FeedReturnPaint[K] }
          | undefined;
        const sample = () => {
          const chat = document.querySelector<HTMLElement>(
            '[data-phone-navigation-screen="conversation"]'
          );
          const underlay = document.querySelector<HTMLElement>(
            '[data-phone-navigation-screen="feed"]'
          );
          const feed = underlay?.querySelector("main section");
          if (chat && underlay && feed) {
            const visible =
              getComputedStyle(underlay).visibility === "visible" &&
              Number(getComputedStyle(underlay).opacity) > 0;
            const x = chat.getBoundingClientRect().x;
            if (!visible && x < 0.5) {
              readyForReturn = true;
              currentPaint = undefined;
            }
            if (visible && readyForReturn && x > 0.5) {
              // Assert the first real exposed frame instead of a browser snapshot.
              const viewport = feed.getBoundingClientRect();
              const cards = Array.from(feed.querySelectorAll("article"));
              currentPaint = {
                scrollTop: feed.scrollTop,
                readableCard: cards.some((card) => {
                  const rect = card.getBoundingClientRect();
                  return (
                    rect.bottom > viewport.top &&
                    rect.top < viewport.bottom &&
                    getComputedStyle(card).visibility !== "hidden"
                  );
                }),
                outgoingChatPreserved: true,
                readingCardTop: cards
                  .find((card) =>
                    card.textContent?.includes(
                      "Profile feed gesture fixture 6."
                    )
                  )
                  ?.getBoundingClientRect().top,
              };
              browser.__feedReturnPaints?.push(currentPaint);
              readyForReturn = false;
            }
            if (currentPaint)
              currentPaint.outgoingChatPreserved &&= Boolean(
                chat.querySelector("[data-wave-drop-content]")
              );
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      let checkingReturn = false;
      let returnRouteRequests = 0;
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (
          checkingReturn &&
          url.pathname === "/waves" &&
          ((request.isNavigationRequest() &&
            request.frame() === page.mainFrame()) ||
            (url.searchParams.has("_rsc") &&
              request.headers()["next-router-prefetch"] !== "1"))
        )
          returnRouteRequests += 1;
      });
      await page.goto("/waves?view=profile-feed", {
        waitUntil: "domcontentloaded",
      });
      await waitForRouteReady(page);
      const feedHeading = page.getByRole("heading", {
        name: "Latest From Profile Waves",
        exact: true,
      });
      const feed = page
        .getByTestId("wave-swipe-surface")
        .locator("section")
        .filter({ has: feedHeading });
      const post = page.getByText("Profile feed gesture fixture 6.", {
        exact: false,
      });
      const surface = page.getByTestId("wave-swipe-surface");
      const grid = page.getByRole("grid");
      await expect(grid).toBeVisible();
      await feed.evaluate((element) => element.scrollTo({ top: 800 }));
      await expect(post).toBeVisible();
      await post.scrollIntoViewIfNeeded();
      await expect(post).toBeInViewport();
      await expect(grid).toHaveCSS("pointer-events", "auto");
      await expect(page).toHaveURL(/\/waves\?view=profile-feed$/);
      await expect
        .poll(() => feed.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(100);
      const cancelled = await touchDrag(page, post, 115);
      await expect
        .poll(() =>
          surface.evaluate((element) => element.getBoundingClientRect().x)
        )
        .toBeGreaterThan(80);
      await cancelled.reverse();
      await cancelled.release();
      await expect(page).toHaveURL(/\/waves\?view=profile-feed$/);
      await expect(surface).toHaveCSS("transform", "none");
      await expect
        .poll(() =>
          surface.evaluate((element) => element.getBoundingClientRect().x)
        )
        .toBeCloseTo(0, 0);

      for (const [index, method] of (
        ["swipe", "button", "wave-link"] as const
      ).entries()) {
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-wave-navigation-transition"
        );
        await expect(grid).toHaveCSS("pointer-events", "auto");
        const tapTarget =
          method === "wave-link"
            ? page
                .getByText("Profile feed gesture fixture 6.", { exact: false })
                .locator("xpath=ancestor::article[1]")
                .getByRole("link", {
                  name: "Gesture profile wave",
                  exact: true,
                })
            : post;
        await tapTarget.scrollIntoViewIfNeeded();
        const readingPosition = await feed.evaluate(
          (element) => element.scrollTop
        );
        const readingCardTop = await post.evaluate(
          (element) => element.closest("article")!.getBoundingClientRect().top
        );
        await tapTarget.tap();
        // The local mock server compiles the detail route on first entry.
        await expect(page).toHaveURL(
          new RegExp(`/waves/${WAVE}\\?.*returnTo=`),
          { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
        );
        await expect(
          page.getByRole("textbox", { name: "Write a message" }).last()
        ).toBeVisible();
        const messages = page
          .getByTestId("wave-swipe-surface")
          .locator("[data-wave-drops-scroll-container='true']");
        await expect(messages).toHaveCSS("mask-image", "none");
        const fade = page
          .getByTestId("wave-swipe-surface")
          .locator("[data-wave-drops-scroll-container='true']")
          .locator("..")
          .locator(':scope > [aria-hidden="true"]');
        await expect(fade).toHaveCSS("height", "24px");
        await expect(fade).toHaveCSS("background-image", /^linear-gradient\(/);
        checkingReturn = true;
        if (method === "swipe") {
          const row = page
            .getByTestId("wave-swipe-surface")
            .locator("[data-wave-drop-id][data-reply-enabled=true]")
            .first();
          const back = await touchDrag(page, row, 240);
          await back.release();
        } else {
          await page.getByRole("button", { name: "Back", exact: true }).tap();
        }
        await expect(page).toHaveURL(/\/waves\?view=profile-feed$/);
        await expect(post).toBeVisible();
        await expect
          .poll(async () =>
            Math.abs(
              (await feed.evaluate((element) => element.scrollTop)) -
                readingPosition
            )
          )
          .toBeLessThanOrEqual(2);
        await expect(surface).toHaveCSS("transform", "none");
        {
          // Both Back methods must expose the saved cards on their first frame.
          await expect
            .poll(() =>
              page.evaluate(
                () =>
                  (
                    globalThis as typeof globalThis & {
                      __feedReturnPaints?: FeedReturnPaint[];
                    }
                  ).__feedReturnPaints?.length ?? 0
              )
            )
            .toBeGreaterThan(index);
          const paint = await page.evaluate(
            (paintIndex) =>
              (
                globalThis as typeof globalThis & {
                  __feedReturnPaints?: FeedReturnPaint[];
                }
              ).__feedReturnPaints?.[paintIndex],
            index
          );
          expect(paint, JSON.stringify(paint)).toMatchObject({
            readableCard: true,
            outgoingChatPreserved: true,
          });
          expect(
            Math.abs(paint!.scrollTop - readingPosition)
          ).toBeLessThanOrEqual(2);
          expect(paint?.readingCardTop).toBeDefined();
          expect(
            Math.abs(paint!.readingCardTop! - readingCardTop)
          ).toBeLessThanOrEqual(2);
        }
        await expect(
          page.getByRole("button", { name: "Back", exact: true })
        ).toBeVisible();
        checkingReturn = false;
        expect(returnRouteRequests).toBe(0);
      }

      await page.emulateMedia({ reducedMotion: "reduce" });
      checkingReturn = true;
      const exit = await touchDrag(page, post, 240);
      await exit.release();
      await expect(page).toHaveURL(/\/waves$/);
      await expect(
        page.getByRole("button", { name: "Find a wave…", exact: true })
      ).toBeVisible();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-wave-navigation-transition"
      );
      await expectNoHorizontalOverflow(page);
      checkingReturn = false;
      expect(returnRouteRequests).toBe(0);
      await page.getByLabel("More", { exact: true }).tap();
      await page
        .getByRole("dialog", { name: "More", exact: true })
        .getByRole("button", { name: "Profile Waves Feed", exact: true })
        .tap();
      await expect(feedHeading).toBeVisible();
      await expect
        .poll(() => feed.evaluate((element) => element.scrollTop))
        .toBe(0);
      checkingReturn = true;
      await page.getByRole("button", { name: "Back", exact: true }).tap();
      await expect(page).toHaveURL(/\/waves$/);
      await expect(
        page.getByRole("button", { name: "Find a wave…", exact: true })
      ).toBeVisible();
      checkingReturn = false;
      expect(returnRouteRequests).toBe(0);
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("cold Feed returns fill the viewport without another scroll", async ({
      page,
      baseURL,
    }) => {
      const origin = getSandboxApiOrigin(baseURL);
      const response = await page.request.get(
        `${origin}/api/v2/waves/${WAVE}/drops?limit=50`
      );
      const fixture = (await response.json()) as ApiWaveDropsFeedV2;
      const template = fixture.drops[0]!;
      await page.route("**/api/v2/curated-profile-wave-drops?**", (route) =>
        route.fulfill({
          json: {
            page: 1,
            next: false,
            data: Array.from({ length: 40 }, (_, index) => ({
              ...template,
              id: `00000000-0000-4000-8000-${String(800 + index).padStart(12, "0")}`,
              serial_no: 1,
              content: `Compact feed post ${index + 1}.`,
              author: {
                ...template.author,
                badges: {
                  ...template.author.badges,
                  profile_wave_id: WAVE,
                  profile_wave_name: "Gesture profile wave",
                },
              },
            })),
          },
        })
      );
      await page.goto("/waves?view=profile-feed", {
        waitUntil: "domcontentloaded",
      });
      await waitForRouteReady(page);
      const feed = page.getByTestId("wave-swipe-surface").locator("section");
      await expect(page.getByRole("grid")).toBeVisible();
      await feed.evaluate((element) => element.scrollTo({ top: 1600 }));
      const post = page.getByText("Compact feed post 10.", { exact: true });
      await expect(post).toBeVisible();
      await post.scrollIntoViewIfNeeded();
      for (let visit = 0; visit < 3; visit += 1) {
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-wave-navigation-transition"
        );
        await expect(page.getByRole("grid")).toHaveCSS(
          "pointer-events",
          "auto"
        );
        await post.tap({ trial: true });
        const readingPosition = await feed.evaluate(
          (element) => element.scrollTop
        );
        await post.tap();
        await expect(page).toHaveURL(
          new RegExp(`/waves/${WAVE}\\?.*returnTo=`),
          {
            timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          }
        );
        await expect(
          page.getByRole("textbox", { name: "Write a message" }).last()
        ).toBeVisible();
        await page.getByRole("button", { name: "Back", exact: true }).tap();
        await expect(page).toHaveURL(/\/waves\?view=profile-feed$/);
        // No scroll input on return: compact rows must finish measuring on their own.
        await expect
          .poll(() =>
            feed.evaluate((element) => {
              const viewport = element.getBoundingClientRect();
              const visible = Array.from(element.querySelectorAll("article"))
                .filter(
                  (card) => getComputedStyle(card).visibility !== "hidden"
                )
                .map((card) => card.getBoundingClientRect())
                .filter(
                  (rect) =>
                    rect.bottom > viewport.top && rect.top < viewport.bottom
                )
                .sort((left, right) => left.top - right.top);
              const first = visible[0];
              const last = visible.at(-1);
              return Boolean(
                first &&
                last &&
                first.top <= viewport.top + 16 &&
                last.bottom >= Math.min(viewport.bottom, innerHeight) - 16 &&
                visible.every(
                  (rect, index) =>
                    index === 0 || rect.top <= visible[index - 1]!.bottom + 16
                )
              );
            })
          )
          .toBe(true);
        expect(await feed.evaluate((element) => element.scrollTop)).toBeCloseTo(
          readingPosition,
          0
        );
      }
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("Discovery opened from Profile Waves Feed keeps a Back path to the reading position", async ({
      page,
      baseURL,
    }) => {
      await page.goto("/waves?view=profile-feed", {
        waitUntil: "domcontentloaded",
      });
      await waitForRouteReady(page);
      const feed = page
        .getByTestId("wave-swipe-surface")
        .locator("section")
        .filter({
          has: page.getByRole("heading", {
            name: "Latest From Profile Waves",
            exact: true,
          }),
        });
      await expect(page.getByRole("grid")).toBeVisible();
      await expect(
        page.getByText("Profile feed gesture fixture 1.", { exact: false })
      ).toBeVisible();
      await expect
        .poll(() =>
          feed.evaluate(
            (element) => element.scrollHeight - element.clientHeight
          )
        )
        .toBeGreaterThan(64);
      await feed.evaluate((element) => element.scrollTo({ top: 64 }));
      const discover = page.getByRole("link", {
        name: "Discover Waves",
        exact: true,
      });
      await discover.click({ trial: true });
      const readingPosition = await feed.evaluate(
        (element) => element.scrollTop
      );
      expect(readingPosition).toBeGreaterThan(0);
      await discover.tap();
      await expect(page).toHaveURL(/\/discover\?returnTo=/, {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      const back = page.getByRole("button", { name: "Back", exact: true });
      await expect(back).toBeVisible();
      await page.getByRole("tab", { name: "Active Votes", exact: true }).tap();
      await expect(page).toHaveURL(
        /\/discover\?.*returnTo=.*view=active-votes/
      );
      await back.focus();
      await back.press("Enter");
      await expect(page).toHaveURL(/\/waves\?view=profile-feed$/);
      await expect(discover).toBeVisible();
      await expect
        .poll(async () =>
          Math.abs(
            (await feed.evaluate((element) => element.scrollTop)) -
              readingPosition
          )
        )
        .toBeLessThanOrEqual(2);

      await page.goto("/discover", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("button", { name: "Open menu", exact: true })
      ).toBeVisible();
      await expect(back).toBeHidden();
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("curved thumb paths can return after a diagonal start without stealing a scroll", async ({
      page,
      baseURL,
    }) => {
      for (const width of [360, 430]) {
        await test.step(`Phone width ${width}px`, async () => {
          await page.setViewportSize({ width, height: 840 });
          await openWave(page);
          const row = page
            .getByTestId("wave-swipe-surface")
            .getByText("Gesture fixture message one", { exact: true });
          const vertical = await touchDrag(page, row, [
            { x: 4, y: -24 },
            { x: 8, y: -48 },
            { x: 110, y: -52 },
          ]);
          await vertical.release();
          await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
          const curved = await touchDrag(page, row, [
            { x: 13, y: 10 },
            { x: 24, y: 15 },
            { x: 48, y: 21 },
            { x: 78, y: 29 },
            { x: 110, y: 34 },
            { x: 170, y: 38 },
            { x: 240, y: 42 },
          ]);
          await curved.release();
          await expect(page).toHaveURL(/\/waves$/);
          await expect(
            page.getByRole("button", { name: "Find a wave…", exact: true })
          ).toBeVisible();
        });
      }
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("left swipe starts the existing reply only on release and leaves actions reachable", async ({
      page,
      baseURL,
    }) => {
      await openWave(page);
      const row = page
        .getByTestId("wave-swipe-surface")
        .locator("[data-wave-drop-id][data-reply-enabled=true]")
        .last();
      const timestampPreview = await touchDrag(page, row, -64);
      await expect
        .poll(() =>
          row
            .getByTestId("grouped-drop-swipe-timestamp")
            .evaluate((element) => Number(getComputedStyle(element).opacity))
        )
        .toBeGreaterThan(0.9);
      await timestampPreview.release();
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toHaveCount(0);
      const swipe = await touchDrag(page, row, -120);
      await expect(row).toHaveAttribute("data-reply-ready", "true");
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toHaveCount(0);
      await swipe.release();
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Post a reply" }).last()
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Cancel reply", exact: true })
        .click();
      await expect(
        row.getByRole("button", { name: "Open drop actions", exact: true })
      ).toHaveCount(0);
      await longPressMessage(page, row);
      const sheet = page.getByRole("dialog", {
        name: "Drop actions",
        exact: true,
      });
      await expect(sheet).toBeAttached();
      await expect(
        sheet.getByRole("button", { name: "Reply", exact: true })
      ).toBeVisible();
      await sheet.getByRole("button", { name: "Reply", exact: true }).click();
      await expect(
        page.getByRole("textbox", { name: "Post a reply" }).last()
      ).toBeFocused();
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("vertical scrolling does not reply or navigate, including with reduced motion", async ({
      page,
      baseURL,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openWave(page);
      const swipe = await touchDrag(
        page,
        page
          .getByTestId("wave-swipe-surface")
          .locator("[data-wave-drop-id][data-reply-enabled=true]")
          .first(),
        -30,
        -120
      );
      await swipe.release();
      await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}`));
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await expectNoUnsafeSandboxMutations(baseURL);
    });
  });
}

test.describe("web message gesture regression", () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await hideNextDevOverlay(context);
    await installMessageFixture(page, baseURL);
  });

  test("desktop mouse selection, hover timestamps and reply controls keep their behavior", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop mouse and hover coverage."
    );
    await page.goto(`/waves/${WAVE}`);
    await waitForRouteReady(page);
    await expect(
      page.getByRole("textbox", { name: "Write a message" }).last()
    ).toBeVisible();
    const message = page.getByText("Gesture fixture message two", {
      exact: true,
    });
    await expect(message).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const row = page
      .getByRole("tabpanel")
      .locator("[data-wave-drop-id][data-serial-no]")
      .filter({ has: message });
    await row.hover();
    await expect(
      row.getByRole("button", { name: "Reply to drop", exact: true })
    ).toBeVisible();
    await message.click({ trial: true });
    const box = await message.boundingBox();
    if (!box) throw new Error("Desktop message must be visible");
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + Math.min(box.width - 8, 180),
      box.y + box.height / 2,
      { steps: 8 }
    );
    await page.mouse.up();
    await page.screenshot({
      path: testInfo.outputPath("desktop-selection.png"),
    });
    await expect
      .poll(() => page.evaluate(() => getSelection()?.toString().length ?? 0))
      .toBeGreaterThan(0);
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    await expect(row).not.toHaveAttribute("data-reply-swiping");
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toHaveCount(0);
    await page.evaluate(() => getSelection()?.removeAllRanges());
    await row.hover();
    await expect
      .poll(() =>
        row
          .getByTestId("grouped-drop-hover-timestamp")
          .evaluate((element) => Number(getComputedStyle(element).opacity))
      )
      .toBeGreaterThan(0.9);
    await row
      .getByRole("button", { name: "Reply to drop", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toBeVisible();
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("mobile web keeps right drags in the wave and supports swipe and long-press Reply", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Trusted mobile-web touch coverage."
    );
    await openWave(page);
    const row = page
      .getByRole("tabpanel")
      .locator("[data-wave-drop-id][data-reply-enabled=true]")
      .last();
    const back = await touchDrag(page, row, 130);
    await back.release();
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    const reply = await touchDrag(page, row, -120);
    await reply.release();
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cancel reply", exact: true })
      .click();
    await expect(
      row.getByRole("button", { name: "Open drop actions", exact: true })
    ).toHaveCount(0);
    await longPressMessage(page, row);
    await page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .getByRole("button", { name: "Reply", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

test.describe("phone chevron Back", () => {
  test.use({
    userAgent: devices["iPhone 14 Pro Max"].userAgent,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 412, height: 840 },
  });
  for (const [surface, destination] of [
    ["ios", "/waves"],
    ["android", "/waves"],
    ["web", "/waves"],
    ["ios", "/messages"],
    ["android", "/messages"],
    ["web", "/messages"],
  ] as const) {
    test(`phone ${surface} opens ${destination} with the complete conversation sliding over its list`, async ({
      context,
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        !["web-mobile-chromium", "web-desktop-webkit"].includes(
          testInfo.project.name
        ),
        "Phone entry is checked in Chromium and WebKit with touch input."
      );
      if (surface !== "web")
        await installSurfaceSimulation(
          context,
          `capacitor-${surface}-sim`,
          baseURL
        );
      await hideNextDevOverlay(context);
      await installMessageFixture(page, baseURL);
      const name =
        destination === "/waves"
          ? /Local Composer Sandbox Wave/u
          : /Sandbox Direct Message/u;
      const conversation = `${destination}/${destination === "/waves" ? WAVE : DM}`;
      await page.goto(conversation, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("textbox", { name: "Write a message" }).last()
      ).toBeVisible({
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await page.getByRole("button", { name: /^(Back|Go back)$/u }).tap();
      await expect(page).toHaveURL(new RegExp(`${destination}$`, "u"));
      const row = page.getByRole("link", { name }).first();
      await expect(row).toBeVisible();
      if (surface !== "web") {
        const retainedList = page
          .getByRole("main", { includeHidden: true })
          .locator(
            `xpath=ancestor::*[@data-phone-navigation-screen="${destination === "/waves" ? "waves" : "messages"}"]`
          );
        const source = await retainedList.elementHandle();
        if (!source) throw new Error("Missing native source screen");
        const frames = sampleNativeNavigation(page, destination, true);
        await row.tap();
        expectNativeNavigation(await frames);
        expect(await source.evaluate((element) => element.isConnected)).toBe(
          true
        );
        // Discovery descendants explicitly use visibility:visible. The retained
        // screen must suppress the whole subtree once the chat has settled.
        await expect(retainedList).toHaveCSS("opacity", "0");
        await expect(page).toHaveURL(new RegExp(`${conversation}$`, "u"));
        await source.dispose();
        await expectNoHorizontalOverflow(page);
        await expectNoUnsafeSandboxMutations(baseURL);
        return;
      }
      await page.evaluate(() => {
        const root = document.documentElement;
        const start = document.startViewTransition.bind(document);
        document.startViewTransition = (...args) => {
          const transition = start(...args);
          if (
            root.dataset["waveNavigationTransition"] === "conversation-entry"
          ) {
            void transition.ready.then(
              () => {
                for (const animation of document.getAnimations()) {
                  if (
                    animation.effect instanceof KeyframeEffect &&
                    animation.effect.pseudoElement?.includes("wave-navigation")
                  ) {
                    animation.pause();
                    animation.currentTime = 100;
                  }
                }
                const incoming = getComputedStyle(
                  root,
                  "::view-transition-new(wave-navigation)"
                );
                const list = getComputedStyle(
                  root,
                  "::view-transition-old(root)"
                );
                const captured = document.querySelector<HTMLElement>(
                  '[style*="view-transition-name: wave-navigation"]'
                );
                const back = Array.from(
                  document.querySelectorAll("button")
                ).find(
                  (button) =>
                    ["Back", "Go back"].includes(
                      button.getAttribute("aria-label") ?? ""
                    ) && button.getBoundingClientRect().width > 0
                );
                root.dataset["testConversationEntry"] = JSON.stringify({
                  x: new DOMMatrix(incoming.transform).m41,
                  listDisplay: list.display,
                  listOpacity: Number(list.opacity),
                  listAnimation: list.animationName,
                  includesHeader: Boolean(back && captured?.contains(back)),
                });
              },
              () => {}
            );
          }
          return transition;
        };
      });
      await row.tap();
      await expect(page).toHaveURL(new RegExp(`${conversation}$`, "u"));
      const root = page.locator("html");
      await expect(root).toHaveAttribute(
        "data-test-conversation-entry",
        /"x":/u
      );
      const entry = JSON.parse(
        (await root.getAttribute("data-test-conversation-entry")) ?? "null"
      ) as {
        x: number;
        listDisplay: string;
        listOpacity: number;
        listAnimation: string;
        includesHeader: boolean;
      };
      expect(entry.x).toBeGreaterThan(0);
      expect(entry.x).toBeLessThanOrEqual(412);
      expect(entry).toMatchObject({
        listDisplay: "block",
        listOpacity: 1,
        listAnimation: "wave-underlay-forward",
        includesHeader: true,
      });
      await page.screenshot({
        path: testInfo.outputPath("conversation-entering.png"),
      });
      await page.evaluate(() => {
        for (const animation of document.getAnimations()) {
          if (
            animation.effect instanceof KeyframeEffect &&
            animation.effect.pseudoElement?.includes("wave-navigation")
          )
            animation.finish();
        }
      });
      await expect(root).not.toHaveAttribute("data-wave-navigation-transition");
      await expectNoHorizontalOverflow(page);
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test(`phone ${surface} chevron Back slides the whole page over ${destination}`, async ({
      context,
      page,
      baseURL,
    }, testInfo) => {
      // This acceptance case requires phone input; other project capabilities
      // are covered by the gesture and desktop regressions above.
      test.skip(
        !["web-mobile-chromium", "web-desktop-webkit"].includes(
          testInfo.project.name
        ),
        "Phone viewport navigation acceptance in Chromium and WebKit."
      );
      if (surface !== "web") {
        await installSurfaceSimulation(
          context,
          `capacitor-${surface}-sim`,
          baseURL
        );
      }
      await hideNextDevOverlay(context);
      await page.setViewportSize({ width: 412, height: 840 });
      await installMessageFixture(page, baseURL);
      const isDm = destination === "/messages";
      const conversation = `${destination}/${isDm ? DM : WAVE}`;
      if (isDm) {
        const origin = getSandboxApiOrigin(baseURL);
        const response = await page.request.get(
          `${origin}/api/v2/waves/${DM}/drops`
        );
        const { wave } = (await response.json()) as ApiWaveDropsFeedV2;
        const dmList = new URL(`${origin}/api/v2/waves`).pathname;
        await page.route(
          (url) =>
            url.pathname === dmList &&
            url.searchParams.get("direct_message") === "true",
          (route) => route.fulfill({ json: { data: [wave], next: false } })
        );
      }
      const backName = surface !== "web" ? "Back" : "Go back";
      // Enter directly, with no preceding list history entry.
      await page.goto(conversation, { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page);
      await expect(
        page.getByRole("textbox", { name: "Write a message" }).last()
      ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
      await expect(
        page.getByRole("button", { name: /^(Back|Go back)$/u })
      ).toHaveCount(1);
      const backControl = page.getByRole("button", {
        name: backName,
        exact: true,
      });
      const listControl = isDm
        ? page.getByRole("link", { name: /Sandbox Direct Message/u }).first()
        : page.getByRole("button", { name: "Find a wave…", exact: true });
      // Check cold direct-entry Back, then return to that original history
      // position. The list is only a forward entry, while its client route is
      // now loaded for the strict motion checks below.
      await backControl.tap();
      await expect(page).toHaveURL(new RegExp(`${destination}$`, "u"));
      await expect(listControl).toBeVisible();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-wave-navigation-transition"
      );
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${conversation}$`, "u"));
      await expect(
        page.getByRole("textbox", { name: "Write a message" }).last()
      ).toBeVisible();
      await expect(backControl).toBeVisible();
      if (surface !== "web") {
        const frames = sampleNativeNavigation(page, destination, false);
        await backControl.tap();
        expectNativeNavigation(await frames);
        await expect(page).toHaveURL(new RegExp(`${destination}$`, "u"));
        await expect(listControl).toBeVisible();
        await page.goBack();
        await expect(backControl).toBeVisible();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await backControl.tap();
        await expect(page).toHaveURL(new RegExp(`${destination}$`, "u"));
        await expect(listControl).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectNoUnsafeSandboxMutations(baseURL);
        return;
      }
      await page.evaluate((label) => {
        const root = document.documentElement;
        const start = document.startViewTransition.bind(document);
        document.startViewTransition = (...args) => {
          const captured = document.querySelector<HTMLElement>(
            '[style*="view-transition-name: wave-navigation"]'
          );
          const back = Array.from(document.querySelectorAll("button")).find(
            (button) =>
              button.getAttribute("aria-label") === label &&
              button.getBoundingClientRect().width > 0
          );
          root.dataset["testChevronCaptures"] = String(
            Number(root.dataset["testChevronCaptures"] ?? 0) + 1
          );
          root.dataset["testChevronHeader"] = String(
            captured?.contains(back ?? null)
          );
          root.dataset["testChevronTop"] = String(
            captured?.getBoundingClientRect().top
          );
          const startedAt = performance.now();
          const transition = start(async () => {
            root.dataset["testChevronUpdate"] = "started";
            const update = args[0];
            if (typeof update === "function") await update();
            root.dataset["testChevronUpdate"] = "completed";
            root.dataset["testChevronDestinationInRoot"] = String(
              !captured?.style.viewTransitionName
            );
          });
          void transition.ready.then(
            () => {
              const sampleMotion = () => {
                const old = getComputedStyle(
                  root,
                  "::view-transition-old(wave-navigation)"
                );
                const incoming = getComputedStyle(
                  root,
                  "::view-transition-new(root)"
                );
                const x = new DOMMatrix(old.transform).m41;
                // Touch-triggered transitions can start on a later compositor frame.
                // Wait for movement while this transition still owns the page.
                if (
                  x === 0 &&
                  root.dataset["waveNavigationTransition"] === "chevron-back"
                ) {
                  requestAnimationFrame(sampleMotion);
                  return;
                }
                root.dataset["testChevronMotion"] = JSON.stringify({
                  x,
                  opacity: Number(old.opacity),
                  incomingAnimation: incoming.animationName,
                });
              };
              requestAnimationFrame(sampleMotion);
            },
            (error: unknown) => {
              root.dataset["testChevronReadyError"] = String(error);
              root.dataset["testChevronReadyElapsed"] = String(
                Math.round(performance.now() - startedAt)
              );
            }
          );
          return transition;
        };
      }, backName);
      await page.getByRole("button", { name: backName, exact: true }).tap();
      await expect(page).toHaveURL(new RegExp(`${destination}$`, "u"));
      const root = page.locator("html");
      await expect(root).toHaveAttribute("data-test-chevron-captures", "1");
      await expect(root).toHaveAttribute("data-test-chevron-header", "true");
      await expect(root).toHaveAttribute(
        "data-test-chevron-destination-in-root",
        "true"
      );
      await expect(root).toHaveAttribute("data-test-chevron-top", "0");
      await expect(root).toHaveAttribute("data-test-chevron-motion", /"x":/);
      const motion = JSON.parse(
        (await root.getAttribute("data-test-chevron-motion")) ?? "null"
      ) as {
        x: number;
        opacity: number;
        incomingAnimation: string;
      };
      expect(motion.x).toBeGreaterThan(0);
      expect(motion.x).toBeLessThanOrEqual(412);
      expect(motion.opacity).toBe(1);
      expect(motion.incomingAnimation).toBe("wave-underlay-back");
      await expect(listControl).toBeVisible();
      await expect(root).not.toHaveAttribute("data-wave-navigation-transition");
      await expectNoHorizontalOverflow(page);

      await page.goBack();
      await expect(page).toHaveURL(new RegExp(conversation, "u"));
      await expect(
        page.getByRole("textbox", { name: "Write a message" }).last()
      ).toBeVisible();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: backName, exact: true }).tap();
      await expect(page).toHaveURL(new RegExp(`${destination}$`, "u"));
      await expect(root).toHaveAttribute("data-test-chevron-captures", "2");
      await expect(root).not.toHaveAttribute("data-wave-navigation-transition");
      await expectNoUnsafeSandboxMutations(baseURL);
    });
  }

  test("phone web Back recovers when a slow inbox skips the optional slide", async ({
    context,
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      !["web-mobile-chromium", "web-desktop-webkit"].includes(
        testInfo.project.name
      ),
      "Slow phone navigation recovery in Chromium and WebKit."
    );
    await hideNextDevOverlay(context);
    await installMessageFixture(page, baseURL);
    const inbox = Promise.withResolvers<void>();
    await page.route(
      (url) => url.pathname === "/messages" && url.searchParams.has("_rsc"),
      async (route) => {
        await inbox.promise;
        await route.continue();
      }
    );
    await page.goto(`/messages/${DM}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(
      page.getByRole("textbox", { name: "Write a message" }).last()
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await page.evaluate(() => {
      const root = document.documentElement;
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (...args) => {
        const transition = start(...args);
        root.dataset["testSlowBackCaptures"] = String(
          Number(root.dataset["testSlowBackCaptures"] ?? 0) + 1
        );
        void transition.ready.catch((error: unknown) => {
          root.dataset["testSlowBackSkipped"] = String(error);
        });
        return transition;
      };
    });
    const root = page.locator("html");
    const back = page.getByRole("button", { name: "Go back", exact: true });
    try {
      await back.tap();
      await expect(root).toHaveAttribute(
        "data-test-slow-back-skipped",
        /skipTransition|skipped/iu
      );
      await expect(root).toHaveAttribute("data-test-slow-back-captures", "1");
    } finally {
      inbox.resolve();
    }
    await expect(page).toHaveURL(/\/messages$/u);
    const row = page
      .getByRole("link", { name: /Sandbox Direct Message/u })
      .first();
    await expect(row).toBeVisible();
    await expect(root).not.toHaveAttribute("data-wave-navigation-transition");
    await row.tap();
    await expect(page).toHaveURL(new RegExp(`/messages/${DM}$`, "u"));
    await expect(
      page.getByRole("textbox", { name: "Write a message" }).last()
    ).toBeVisible();
    await expect(root).not.toHaveAttribute("data-wave-navigation-transition");
    await back.tap();
    await expect(page).toHaveURL(/\/messages$/u);
    await expect(row).toBeVisible();
    await expect(root).toHaveAttribute("data-test-slow-back-captures", "3");
    await expect(root).not.toHaveAttribute("data-wave-navigation-transition");
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});
