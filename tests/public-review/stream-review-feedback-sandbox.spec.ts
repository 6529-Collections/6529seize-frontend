import type { Locator, Page } from "@playwright/test";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getStreamReviewPageHref,
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { STREAM_REVIEW_ENTRY_PAGES } from "@/lib/public-review/streamReviewEntryGuides";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  expectNoUnsafeSandboxMutations,
  fetchSandboxRequests,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  type SandboxRequest,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const PUBLIC_REVIEW_COMMENT =
  "The recovery trigger needs clearer reviewer guidance.";
const PUBLIC_REVIEW_WHY_IT_MATTERS = "Readers need to understand who can act.";
const PUBLIC_REVIEW_SUGGESTED_CHANGE = "Clarify the trigger and eligible role.";
const PUBLIC_REVIEW_METADATA_KEYS = [
  "review_schema",
  "type",
  "severity",
  "context",
] as const;

// Review titles, versions and page lists change with each review snapshot, so
// derive them from the review definition instead of copying rendered copy.
const ACTIVE_REVIEW_VERSION = STREAM_REVIEW_DEFINITION.activeVersion;
const OVERVIEW_GUIDE = STREAM_REVIEW_ENTRY_PAGES.find(
  (page) => page.id === "overview"
);
const SAVED_REVIEW_PAGES =
  getStreamReviewVersion(ACTIVE_REVIEW_VERSION)?.pages ?? [];

test.describe.configure({ mode: "serial" });

test.describe("Stream review feedback local sandbox @auth @medium @local-only", () => {
  test.skip(
    process.env["PLAYWRIGHT_PUBLIC_REVIEW_SANDBOX"] !== "1",
    "Stream review feedback sandbox requires the local mock API runner."
  );
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Stream review feedback sandbox requires the local mock API runner."
  );

  test("opens the feedback panel and submits structured feedback safely", async ({
    baseURL,
    page,
  }, testInfo) => {
    expect(OVERVIEW_GUIDE).toBeDefined();
    const overviewTitle = t(DEFAULT_LOCALE, OVERVIEW_GUIDE!.titleKey);
    const overviewHref = getStreamReviewPageHref({ page: OVERVIEW_GUIDE! });
    const isDesktop = testInfo.project.name === "web-desktop-chromium";
    const emulatesSafeArea = testInfo.project.name === "web-mobile-chromium";
    const safeAreaSession = emulatesSafeArea
      ? await page.context().newCDPSession(page)
      : null;
    await safeAreaSession?.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 44, right: 8, bottom: 34, left: 0 },
    });
    await page.addInitScript(() => {
      globalThis.localStorage.setItem(
        "public-review-comment-panel-open",
        "true"
      );
    });
    await gotoStreamReview(page, overviewHref, overviewTitle);

    const feedbackPanel = page.locator("#public-review-feedback");
    const feedbackToggle = page.locator(
      'button[aria-controls="public-review-feedback"]'
    );
    await expect(feedbackToggle).toBeVisible();
    if (!isDesktop) {
      // Current review guides use the compact menu; the page position appears
      // only on saved snapshots and is covered by the pagination test below.
      const mobileNavigationToggle = page
        .locator("summary")
        .filter({ hasText: "Contents" });
      const mobileNavigationDisclosure =
        mobileNavigationToggle.locator("xpath=..");
      await expectToolbarControlsAligned(
        mobileNavigationToggle,
        feedbackToggle
      );

      const reviewHeading = page.getByRole("heading", {
        level: 1,
        name: overviewTitle,
      });
      const reviewHeadingTop = await reviewHeading.evaluate(
        (element) => element.getBoundingClientRect().top
      );
      await mobileNavigationToggle.click();
      const mobileNavigationOverlay = mobileNavigationToggle
        .locator("xpath=..")
        .locator(":scope > div");
      await expect(mobileNavigationOverlay).toBeVisible();
      await expect(mobileNavigationOverlay).toHaveCSS(
        "background-color",
        "rgb(13, 13, 15)"
      );
      await expect
        .poll(async () => {
          const openReviewHeadingTop = await reviewHeading.evaluate(
            (element) => element.getBoundingClientRect().top
          );
          return Math.abs(openReviewHeadingTop - reviewHeadingTop);
        })
        .toBeLessThanOrEqual(1);

      await feedbackToggle.click();
      await expect(mobileNavigationDisclosure).not.toHaveAttribute("open", "");
      await expect(feedbackToggle).toHaveAttribute("aria-expanded", "true");
      await feedbackPanel
        .getByRole("button", { name: "Hide feedback" })
        .click();
      await expect(feedbackToggle).toHaveAttribute("aria-expanded", "false");

      await mobileNavigationToggle.click();
      await expect(mobileNavigationDisclosure).toHaveAttribute("open", "");
      const mobileViewport = page.viewportSize();
      expect(mobileViewport).not.toBeNull();
      await page.setViewportSize({
        width: 1100,
        height: mobileViewport!.height,
      });
      await page.setViewportSize({
        width: 900,
        height: mobileViewport!.height,
      });
      await expectReviewStatusStacked(page);

      await feedbackToggle.click();
      await expect(feedbackToggle).toHaveAttribute("aria-expanded", "true");
      await expect(feedbackPanel).toBeVisible();
      await mobileNavigationToggle.click();
      await expect(feedbackToggle).toHaveAttribute("aria-expanded", "false");
      await expect(mobileNavigationDisclosure).toHaveAttribute("open", "");
      await mobileNavigationToggle.click();
      await page.setViewportSize(mobileViewport!);
      await expect(mobileNavigationToggle).toBeVisible();
      await expect(mobileNavigationDisclosure).not.toHaveAttribute("open", "");
    }
    if ((await feedbackToggle.getAttribute("aria-expanded")) !== "true") {
      await feedbackToggle.click();
    }
    await expect(feedbackToggle).toHaveAttribute("aria-expanded", "true");

    if (!isDesktop) {
      const closeButton = feedbackPanel.getByRole("button", {
        name: "Hide feedback",
      });
      const closeButtonBounds = await closeButton.boundingBox();
      expect(closeButtonBounds).not.toBeNull();
      expect(closeButtonBounds!.width).toBeGreaterThanOrEqual(40);
      expect(closeButtonBounds!.height).toBeGreaterThanOrEqual(40);

      if (emulatesSafeArea) {
        const safeAreaGeometry = await feedbackPanel.evaluate((panel) => {
          const styles = getComputedStyle(panel);
          const header = panel.querySelector("header");
          return {
            headerTop: header?.getBoundingClientRect().top ?? -1,
            paddingBottom: styles.paddingBottom,
            paddingRight: styles.paddingRight,
            paddingTop: styles.paddingTop,
          };
        });
        expect(safeAreaGeometry).toEqual({
          headerTop: 44,
          paddingBottom: "34px",
          paddingRight: "8px",
          paddingTop: "44px",
        });
      }
    }

    await expect(feedbackPanel).toBeVisible();
    if (isDesktop) {
      await expect(
        page.getByRole("button", { name: /Open quick direct messages/ })
      ).toHaveCSS("pointer-events", "none", {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
    }
    await expect(
      feedbackPanel.getByText("No comments yet for this page.")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });

    const composerToggle = feedbackPanel.getByText("Send feedback", {
      exact: true,
    });
    await expect(composerToggle).toBeVisible();
    await expect(
      feedbackPanel.locator("textarea[data-public-review-feedback-primary]")
    ).toBeHidden();

    if (isDesktop) {
      await page.evaluate(() => {
        globalThis.location.hash = "public-review-feedback";
      });
    } else {
      await composerToggle.click();
    }

    const comment = feedbackPanel.locator(
      "textarea[data-public-review-feedback-primary]"
    );
    await expect(comment).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const expectedFieldFontSize = isDesktop ? "14px" : "16px";
    await expect(comment).toHaveCSS("font-size", expectedFieldFontSize);
    await expect(comment).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect
      .poll(() =>
        comment.evaluate(
          (element) =>
            getComputedStyle(element.parentElement?.parentElement as Element)
              .backgroundColor
        )
      )
      .toBe("rgb(28, 28, 33)");
    await expect(
      feedbackPanel.getByRole("button", {
        name: "Connect wallet to comment",
      })
    ).toBeHidden();
    await expect(
      feedbackPanel.getByRole("button", {
        name: "Preview Wave message",
      })
    ).toHaveCount(0);
    await comment.fill(PUBLIC_REVIEW_COMMENT);

    const commentTopBeforeTechnicalDetails = await comment.evaluate(
      (element) => element.getBoundingClientRect().top
    );
    await feedbackPanel
      .getByText("Add technical detail", { exact: true })
      .click();
    await expect
      .poll(async () => {
        const commentTopAfterTechnicalDetails = await comment.evaluate(
          (element) => element.getBoundingClientRect().top
        );
        return Math.abs(
          commentTopAfterTechnicalDetails - commentTopBeforeTechnicalDetails
        );
      })
      .toBeLessThanOrEqual(1);
    const commentOnSelect = feedbackPanel.getByLabel("Comment on");
    const feedbackTypeSelect = feedbackPanel.getByLabel("Feedback type");
    const severitySelect = feedbackPanel.getByLabel("Suspected severity");
    for (const select of [
      commentOnSelect,
      feedbackTypeSelect,
      severitySelect,
    ]) {
      await expect(select).toHaveCSS("font-size", expectedFieldFontSize);
      await expect(select).toHaveClass(/tw-appearance-none/);
    }
    const feedbackSection = await getFirstVisibleFeedbackSection(
      page,
      commentOnSelect
    );
    await commentOnSelect.selectOption(feedbackSection.id);
    await feedbackTypeSelect.selectOption("product-or-ux");
    await severitySelect.selectOption("medium");
    await feedbackPanel
      .getByLabel("Why this matters")
      .fill(PUBLIC_REVIEW_WHY_IT_MATTERS);
    await feedbackPanel
      .getByLabel("Suggested change")
      .fill(PUBLIC_REVIEW_SUGGESTED_CHANGE);

    const previewButton = feedbackPanel.getByRole("button", {
      name: "Preview Wave message",
    });
    await expect(previewButton).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.035)"
    );
    await expect(previewButton.locator("svg")).toHaveClass(/tw-text-iron-500/);
    await previewButton.click();
    await expect(
      feedbackPanel.getByRole("heading", { name: "Wave message preview" })
    ).toBeVisible();
    await expect(feedbackPanel).toContainText(PUBLIC_REVIEW_COMMENT);
    await expect(feedbackPanel).toContainText("Product or UX");
    await expect(feedbackPanel).toContainText("Medium");

    const submitButton = feedbackPanel.getByRole("button", {
      name: "Post to review Wave",
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await submitButton.click();
    await expect(comment).toHaveValue("");

    let dropRequests: SandboxRequest[] = [];
    await expect
      .poll(
        async () => {
          dropRequests = (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" && request.path === "/api/drops"
          );
          return dropRequests;
        },
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message:
            "Expected exactly one canonical public-review drop submission.",
        }
      )
      .toHaveLength(1);

    const expectedContent = [
      "## Product or UX",
      PUBLIC_REVIEW_COMMENT,
      `**Review:** ${STREAM_REVIEW_DEFINITION.title} (${ACTIVE_REVIEW_VERSION})`,
      `**Page:** [${overviewTitle}](${new URL(overviewHref, page.url()).toString()})`,
      "**Suspected severity:** Medium",
      `**Section:** ${feedbackSection.title}`,
      `### Why this matters\n\n${PUBLIC_REVIEW_WHY_IT_MATTERS}`,
      `### Suggested change\n\n${PUBLIC_REVIEW_SUGGESTED_CHANGE}`,
    ].join("\n\n");
    const [dropRequest] = dropRequests;
    expect(
      dropRequest,
      `Unexpected guarded public-review request: ${JSON.stringify(dropRequest)}`
    ).toMatchObject({
      kind: "allowed-sandbox-mutation",
      body: expect.objectContaining({
        wave_id: "00000000-0000-4000-8000-000000000529",
        drop_type: "CHAT",
        content: expectedContent,
        metadata_count: 4,
        metadata_keys: PUBLIC_REVIEW_METADATA_KEYS,
        review_type: "product-or-ux",
        review_severity: "medium",
        review_context: expect.objectContaining({
          reviewId: "6529-stream",
          reviewVersion: ACTIVE_REVIEW_VERSION,
          pageId: OVERVIEW_GUIDE!.id,
          sectionId: feedbackSection.id,
        }),
        signature: null,
        is_safe_signature: false,
        hide_link_preview: false,
      }),
    });

    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
    await safeAreaSession?.detach();
  });

  test("shows the saved snapshot page position and steps to the next page", async ({
    baseURL,
    page,
  }, testInfo) => {
    const [firstPage, secondPage] = SAVED_REVIEW_PAGES;
    expect(firstPage).toBeDefined();
    expect(secondPage).toBeDefined();
    const pageCount = SAVED_REVIEW_PAGES.length;
    const firstPageTitle = t(DEFAULT_LOCALE, firstPage!.titleKey);
    const secondPageTitle = t(DEFAULT_LOCALE, secondPage!.titleKey);
    const firstPageHref = getStreamReviewPageHref({
      page: firstPage!,
      version: ACTIVE_REVIEW_VERSION,
    });
    const secondPageHref = getStreamReviewPageHref({
      page: secondPage!,
      version: ACTIVE_REVIEW_VERSION,
    });
    await gotoStreamReview(page, firstPageHref, firstPageTitle);

    const pagePosition = page.getByText(`Page 1 of ${pageCount}`, {
      exact: true,
    });
    await expect(pagePosition).toBeVisible();
    if (testInfo.project.name !== "web-desktop-chromium") {
      const feedbackToggle = page.locator(
        'button[aria-controls="public-review-feedback"]'
      );
      await expectToolbarControlsAligned(
        page.locator("summary").filter({ hasText: "Review navigation" }),
        feedbackToggle,
        pagePosition
      );
    }

    const pageSequence = page.getByRole("navigation", {
      name: "Previous and next contract review pages",
    });
    await expect(pageSequence.getByRole("link")).toHaveCount(1);
    const nextPageLink = pageSequence.getByRole("link", {
      name: secondPageTitle,
    });
    await expect(nextPageLink).toHaveAttribute("href", secondPageHref);
    await nextPageLink.click();

    await expect(page).toHaveURL(new URL(secondPageHref, page.url()).href, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: secondPageTitle })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(
      page.getByText(`Page 2 of ${pageCount}`, { exact: true })
    ).toBeVisible();
    await expect(
      pageSequence.getByRole("link", { name: firstPageTitle })
    ).toHaveAttribute("href", firstPageHref);

    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

async function gotoStreamReview(page: Page, href: string, title: string) {
  await page.goto(href, {
    waitUntil: "domcontentloaded",
  });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(new URL(href, page.url()).href);
  await expect(
    page.getByRole("heading", { level: 1, name: title })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  // The app shell marks its first client render. Waiting for it keeps clicks
  // off server-rendered controls and lets hydrated chrome, such as the phone
  // app banner, settle before the spec measures review layout.
  await expect(page.getByRole("main").first().locator("..")).toHaveAttribute(
    "data-sidebar-ready",
    "true",
    { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
  );
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

/** Keeps the mobile review toolbar controls on one row. */
async function expectToolbarControlsAligned(
  navigationToggle: Locator,
  feedbackToggle: Locator,
  pagePosition?: Locator
) {
  const [navigationBounds, feedbackBounds, pagePositionBounds] =
    await Promise.all([
      navigationToggle.boundingBox(),
      feedbackToggle.boundingBox(),
      pagePosition?.boundingBox() ?? null,
    ]);
  expect(navigationBounds).not.toBeNull();
  expect(feedbackBounds).not.toBeNull();
  expect(Math.abs(navigationBounds!.y - feedbackBounds!.y)).toBeLessThanOrEqual(
    1
  );
  if (!pagePosition) {
    return;
  }
  expect(pagePositionBounds).not.toBeNull();
  expect(
    Math.abs(
      pagePositionBounds!.y +
        pagePositionBounds!.height / 2 -
        (feedbackBounds!.y + feedbackBounds!.height / 2)
    )
  ).toBeLessThanOrEqual(1);
}

/** Expects the narrow status layout, with status details below the explanation. */
async function expectReviewStatusStacked(page: Page) {
  const reviewStatusLayout = page.locator(
    'section[aria-label="Review status"] > div'
  );
  await expect
    .poll(
      () =>
        reviewStatusLayout.evaluate((layout) => {
          const [, explanation, statusDetails] = Array.from(layout.children);
          if (!explanation || !statusDetails) {
            return false;
          }
          return (
            statusDetails.getBoundingClientRect().top >=
            explanation.getBoundingClientRect().bottom
          );
        }),
      {
        message:
          "Expected review status details to stack below the explanation.",
      }
    )
    .toBe(true);
}

/** Returns the first section option, after checking every option targets a page heading. */
async function getFirstVisibleFeedbackSection(
  page: Page,
  commentOnSelect: Locator
) {
  const sectionOptions = (
    await commentOnSelect.locator("option").evaluateAll((options) =>
      options.map((option) => ({
        id: (option as HTMLOptionElement).value,
        title: option.textContent?.trim() ?? "",
      }))
    )
  ).filter((option) => option.id !== "");
  expect(sectionOptions.length).toBeGreaterThan(0);
  for (const option of sectionOptions) {
    await expect(
      page.locator(`article h2[id="${option.id}"]`),
      `Expected "Comment on" option ${option.id} to target a heading on this page.`
    ).toHaveCount(1);
  }
  return sectionOptions[0]!;
}
