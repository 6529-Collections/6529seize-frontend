import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const RUN_SMOKE_ENV = "RUN_PROFILE_CMS_PHASE5_8_E2E";
const SMOKE_ENABLED = process.env[RUN_SMOKE_ENV] === "true";

test.describe("profile CMS Phase 5-8 browser smoke", () => {
  test("gallery builder flow exposes editor, preview, JSON, and validation affordances", async ({
    page,
  }, testInfo) => {
    const path = requireSmokePath("PROFILE_CMS_BUILDER_SMOKE_PATH");
    await gotoAndCheck(page, path);

    await expect(
      page.getByRole("heading", { name: "Profile CMS builder" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Editor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "JSON" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Validation" })
    ).toBeVisible();
    await captureSmokeScreenshot(page, testInfo, "builder-flow");
  });

  test("generated gallery home renders snapshot and featured routes", async ({
    page,
  }, testInfo) => {
    const path = requireSmokePath("PROFILE_CMS_GALLERY_HOME_PATH");
    await gotoAndCheck(page, path);

    await expect(page.getByRole("heading", { name: /Gallery/i })).toBeVisible();
    await expect(page.getByText("Wallet gallery")).toBeVisible();
    await expect(page.getByText(/wallets?/i)).toBeVisible();
    await captureSmokeScreenshot(page, testInfo, "gallery-home");
  });

  test("generated collection page renders contract context", async ({
    page,
  }, testInfo) => {
    const path = requireSmokePath("PROFILE_CMS_COLLECTION_PAGE_PATH");
    await gotoAndCheck(page, path);

    await expect(
      page.getByRole("heading", { name: /Memes|Collection/i })
    ).toBeVisible();
    await expect(page.getByText(/Chain \d+/)).toBeVisible();
    await captureSmokeScreenshot(page, testInfo, "collection-page");
  });

  test("generated NFT detail page renders artwork and token panel", async ({
    page,
  }, testInfo) => {
    const path = requireSmokePath("PROFILE_CMS_NFT_DETAIL_PATH");
    await gotoAndCheck(page, path);

    await expect(
      page.getByRole("heading", { name: /#|NFT|Token/i })
    ).toBeVisible();
    await expect(page.getByRole("img").first()).toBeVisible();
    await expect(page.getByText(/Token #|Chain \d+/)).toBeVisible();
    await captureSmokeScreenshot(page, testInfo, "nft-detail");
  });

  test("social preview metadata is populated for a generated CMS page", async ({
    page,
  }) => {
    const path = requireSmokePath("PROFILE_CMS_SOCIAL_PREVIEW_PATH");
    await gotoAndCheck(page, path);

    const metadata = await page.evaluate(() => ({
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ?? "",
      ogImage:
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content") ?? "",
      ogTitle:
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") ?? "",
      twitterCard:
        document
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute("content") ?? "",
    }));

    expect(metadata.ogTitle).not.toHaveLength(0);
    expect(metadata.description).not.toHaveLength(0);
    expect(metadata.ogImage).toMatch(/^https?:\/\//);
    expect(metadata.twitterCard).toContain("summary");
  });

  test("3D room route has either a nonblank canvas or mobile-safe fallback", async ({
    page,
  }, testInfo) => {
    const path = requireSmokePath("PROFILE_CMS_ROOM_PATH");
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndCheck(page, path);

    const canvas = page.locator("canvas").first();
    if (await canvas.count()) {
      await expectNonBlankCanvas(canvas);
    } else {
      await expect(
        page.getByText(/Room preview|Open source media/i)
      ).toBeVisible();
    }
    await captureSmokeScreenshot(page, testInfo, "room-mobile");
  });

  test("agent patch import flow keeps review and publish as separate actions", async ({
    page,
  }, testInfo) => {
    const path = requireSmokePath("PROFILE_CMS_AGENT_PATCH_PATH");
    await gotoAndCheck(page, path);

    await expect(page.getByText(/patch/i)).toBeVisible();
    await expect(page.getByText(/review|validate/i)).toBeVisible();
    await expect(page.getByText(/publish/i)).toBeVisible();
    await captureSmokeScreenshot(page, testInfo, "agent-patch-review");
  });
});

function requireSmokePath(envName: string): string {
  const value = process.env[envName]?.trim();
  test.skip(
    !SMOKE_ENABLED,
    `Set ${RUN_SMOKE_ENV}=true to run Phase 5-8 CMS smoke coverage.`
  );
  test.skip(!!SMOKE_ENABLED && !value, `Set ${envName} for this smoke test.`);
  return value ?? "/";
}

async function gotoAndCheck(page: Page, path: string): Promise<void> {
  const errors = collectPageErrors(page);
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(
    response?.ok(),
    `Expected ${path} to return a successful response.`
  ).toBe(true);
  expect(errors, `Unexpected page errors on ${path}.`).toEqual([]);
  await expectNoHorizontalOverflow(page);
}

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflowPixels = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflowPixels).toBeLessThanOrEqual(1);
}

async function expectNonBlankCanvas(canvas: Locator): Promise<void> {
  const sample = await canvas.evaluate((element) => {
    const node = element as HTMLCanvasElement;
    const width = node.width;
    const height = node.height;
    if (!width || !height) {
      return { nonBlank: false, reason: "canvas has zero size", width, height };
    }

    const sampleWidth = Math.min(width, 64);
    const sampleHeight = Math.min(height, 64);
    const gl = node.getContext("webgl2") ?? node.getContext("webgl");
    if (gl) {
      const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
      gl.readPixels(
        0,
        0,
        sampleWidth,
        sampleHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
      );
      return {
        nonBlank: pixels.some((value) => value !== 0),
        reason: "webgl pixels were all zero",
        width,
        height,
      };
    }

    const context = node.getContext("2d");
    if (!context) {
      return {
        nonBlank: false,
        reason: "canvas has no readable 2D or WebGL context",
        width,
        height,
      };
    }

    try {
      const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      return {
        nonBlank: Array.from(pixels).some((value) => value !== 0),
        reason: "2D pixels were all zero",
        width,
        height,
      };
    } catch {
      return {
        nonBlank: false,
        reason: "canvas pixels could not be read",
        width,
        height,
      };
    }
  });

  expect(sample.nonBlank, sample.reason).toBe(true);
}

async function captureSmokeScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`${name}.png`),
  });
}
