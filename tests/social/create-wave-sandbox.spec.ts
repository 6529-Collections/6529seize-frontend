import type { Page } from "@playwright/test";

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
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_WALLET = "0x0000000000000000000000000000000000000529";
const SANDBOX_CREATED_WAVE_ID = "00000000-0000-4000-8000-000000000536";
const SANDBOX_ADMIN_GROUP_ID = "00000000-0000-4000-8000-000000000537";
const SANDBOX_CREATED_WAVE_NAME = "Sandbox Created Wave";
const SANDBOX_CREATED_WAVE_DESCRIPTION =
  "Local-only create-wave description for Playwright.";
const SANDBOX_PERPETUAL_WAVE_NAME = "Sandbox Perpetual Rank Wave";
const SANDBOX_PERPETUAL_WAVE_DESCRIPTION =
  "Local-only perpetual rank wave description for Playwright.";
const SANDBOX_SCHEDULED_WAVE_NAME = "Sandbox Scheduled Rank Wave";
const SANDBOX_SCHEDULED_WAVE_DESCRIPTION =
  "Local-only scheduled rank wave description for Playwright.";
const SANDBOX_SCHEDULED_OUTCOME_TITLE = "Sandbox manual outcome";

test.describe.configure({ mode: "serial" });

test.describe("Create wave local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Create-wave sandbox requires the local mock API runner."
  );

  test("creates a chat wave with only explicit sandbox mutations", async ({
    baseURL,
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill(SANDBOX_CREATED_WAVE_NAME);
    await expect(nextStepButton(page)).toBeEnabled();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can view" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Who can chat" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByText("Anyone").first()).toBeVisible();
    await expect(page.getByText("Only me").first()).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await fillDescription(page, SANDBOX_CREATED_WAVE_DESCRIPTION);
    await page.getByRole("button", { name: "Complete" }).click();
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" &&
              ["/api/groups", "/api/waves"].includes(request.path)
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected create-wave submit to reach the sandbox mock API.",
        }
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/api/groups",
            kind: "allowed-sandbox-mutation",
          }),
          expect.objectContaining({
            path: "/api/waves",
            kind: "allowed-sandbox-mutation",
          }),
        ])
      );

    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: SANDBOX_CREATED_WAVE_NAME,
      })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(
      page.getByText(SANDBOX_CREATED_WAVE_DESCRIPTION).first()
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "POST",
          path: "/api/groups",
          kind: "allowed-sandbox-mutation",
          body: {
            name: "Only playwright",
            identity_addresses: [SANDBOX_WALLET],
          },
        }),
        expect.objectContaining({
          method: "POST",
          path: `/api/groups/${SANDBOX_ADMIN_GROUP_ID}/visible`,
          kind: "allowed-sandbox-mutation",
          body: {
            visible: true,
            old_version_id: null,
          },
        }),
        expect.objectContaining({
          method: "POST",
          path: "/api/waves",
          kind: "allowed-sandbox-mutation",
          body: expect.objectContaining({
            name: SANDBOX_CREATED_WAVE_NAME,
            admin_group_id: SANDBOX_ADMIN_GROUP_ID,
            description: SANDBOX_CREATED_WAVE_DESCRIPTION,
          }),
        }),
      ])
    );
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("creates a perpetual rank wave after choosing the mode on the overview", async ({
    baseURL,
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill(SANDBOX_PERPETUAL_WAVE_NAME);
    await page.getByText("Rank", { exact: true }).click();

    // The scheduling mode is chosen up front on the Overview step.
    const announceRadio = page.getByRole("radio", {
      name: "Announce Winners",
    });
    const perpetualRadio = page.getByRole("radio", {
      name: "Perpetual Ranking",
    });
    await expect(announceRadio).toBeChecked();
    await expect(perpetualRadio).not.toBeChecked();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    // Dates step in scheduled mode shows the announcement schedule, expanded
    // by default; mounting it also defaults the first announcement to a valid
    // future time, so Next proceeds to the Drops step.
    await expect(page.getByText("Wave Timeline")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeVisible();
    await expect(
      page.getByText("First Winners Announcement").first()
    ).toBeVisible();
    await nextStepButton(page).click();
    await expect(
      page.locator("#no-of-applications-allowed-per-participant")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });

    // Go back to the Overview and switch the wave to perpetual ranking.
    await previousStepButton(page).click();
    await expect(page.getByText("Wave Timeline")).toBeVisible();
    await previousStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await previousStepButton(page).click();
    await expect(perpetualRadio).toBeVisible();
    await page.getByText("Perpetual Ranking", { exact: true }).click();
    await expect(perpetualRadio).toBeChecked();
    await nextStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    // The dates step is now purely about dates: no announcement schedule.
    await expect(page.getByText("Wave Timeline")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeHidden();
    // A perpetual wave has no outcomes to configure, so the step disappears
    // from the flow entirely.
    await expect(
      page.getByRole("navigation", { name: "Progress" }).getByText("Outcomes")
    ).toBeHidden();

    await nextStepButton(page).click();
    await expect(
      page.locator("#no-of-applications-allowed-per-participant")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    // Voting step keeps its defaults (TDH + XTDH); Next goes straight to the
    // description step, skipping outcomes.
    await nextStepButton(page).click();

    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await fillDescription(page, SANDBOX_PERPETUAL_WAVE_DESCRIPTION);
    await page.getByRole("button", { name: "Complete" }).click();

    // The sandbox mock only whitelists a rank body with a null decision
    // strategy, open-ended periods and zero outcomes; anything else would be
    // rejected as an unsafe mutation and fail this poll.
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" && request.path === "/api/waves"
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message:
            "Expected the perpetual rank wave submit to reach the sandbox mock API.",
        }
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/api/waves",
            kind: "allowed-sandbox-mutation",
            body: expect.objectContaining({
              name: SANDBOX_PERPETUAL_WAVE_NAME,
              admin_group_id: SANDBOX_ADMIN_GROUP_ID,
              description: SANDBOX_PERPETUAL_WAVE_DESCRIPTION,
              wave_type: "RANK",
              decisions_strategy: null,
              voting_period_max: null,
              participation_period_max: null,
              outcomes_count: 0,
            }),
          }),
        ])
      );

    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("defaults the announcement a week out and enforces outcomes with a11y feedback", async ({
    page,
  }) => {
    await gotoCreateWave(page);
    // The compact progress header is a small-screen stand-in; the desktop
    // step rail owns progress here.
    await expect(page.getByText(/Step 1 of \d+/)).toBeHidden();

    await page.getByLabel(/Wave Name/).fill("Sandbox Rank Defaults Wave");
    await page.getByText("Rank", { exact: true }).click();
    await nextStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    // The first winners announcement defaults ONE WEEK out at 23:59 — the
    // old same-day default produced a wave that ended within hours.
    await expect(page.getByText("Wave Timeline")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const expectedDefault = new Date();
    expectedDefault.setDate(expectedDefault.getDate() + 7);
    const expectedDateText = expectedDefault.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    await expect(
      page.getByText(`${expectedDateText}, 11:59 PM`).first()
    ).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.locator("#no-of-applications-allowed-per-participant")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();
    // Voting keeps defaults; proceed to Outcomes.
    await nextStepButton(page).click();

    // The empty state explains what outcomes are before any error fires.
    await expect(
      page.getByText("No outcomes yet — add at least one to continue")
    ).toBeVisible();
    await expect(
      page.getByText(/Outcomes define what winners receive/)
    ).toBeVisible();
    const outcomesAlert = page
      .getByRole("alert")
      .filter({ hasText: "No outcomes yet" });
    expect(await outcomesAlert.count()).toBe(0);

    // Trying to advance without an outcome announces the requirement.
    await nextStepButton(page).click();
    await expect(outcomesAlert).toBeVisible();

    // Configuring an outcome clears the announcement and unblocks Next.
    await page.getByRole("button", { name: "Manual" }).click();
    await page.getByLabel("Manual action").fill("Coverage outcome");
    await page.getByLabel(/Winning Positions/).fill("1");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Coverage outcome").first()).toBeVisible();
    expect(await outcomesAlert.count()).toBe(0);
    await nextStepButton(page).click();

    // The description composer speaks to its context now.
    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText("Describe your wave").first()).toBeVisible();
    // No submit: this walk only verifies flow feedback, so the mutation
    // guard must stay silent throughout.
  });

  test("creates a scheduled rank wave with an announcement and a manual outcome", async ({
    baseURL,
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill(SANDBOX_SCHEDULED_WAVE_NAME);
    await page.getByText("Rank", { exact: true }).click();

    // "Announce Winners" is the default scheduling mode; keep it.
    await expect(
      page.getByRole("radio", { name: "Announce Winners" })
    ).toBeChecked();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    // The Dates step mounts the announcement schedule expanded and defaults
    // the first announcement to a valid future time.
    await expect(page.getByText("Wave Timeline")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.locator("#no-of-applications-allowed-per-participant")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    // Voting keeps its defaults; a scheduled rank wave then configures an
    // outcome on the Outcomes step (present in the stepper, unlike perpetual).
    await expect(
      page.getByRole("navigation", { name: "Progress" }).getByText("Outcomes")
    ).toBeVisible();
    await nextStepButton(page).click();

    await page.getByRole("button", { name: "Manual" }).click();
    await page
      .getByLabel("Manual action")
      .fill(SANDBOX_SCHEDULED_OUTCOME_TITLE);
    await page.getByLabel(/Winning Positions/).fill("1");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText(SANDBOX_SCHEDULED_OUTCOME_TITLE).first()
    ).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await fillDescription(page, SANDBOX_SCHEDULED_WAVE_DESCRIPTION);
    await page.getByRole("button", { name: "Complete" }).click();

    // The sandbox mock only whitelists a rank body with exactly one
    // non-rolling decision point and exactly this manual outcome; anything
    // else is rejected as an unsafe mutation and fails this poll.
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" && request.path === "/api/waves"
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message:
            "Expected the scheduled rank wave submit to reach the sandbox mock API.",
        }
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/api/waves",
            kind: "allowed-sandbox-mutation",
            body: expect.objectContaining({
              name: SANDBOX_SCHEDULED_WAVE_NAME,
              admin_group_id: SANDBOX_ADMIN_GROUP_ID,
              description: SANDBOX_SCHEDULED_WAVE_DESCRIPTION,
              wave_type: "RANK",
              decisions_strategy: expect.objectContaining({
                first_decision_time: expect.any(Number),
                subsequent_decisions: [],
                is_rolling: false,
              }),
              // The wave closes at its only announcement, so both periods
              // carry that timestamp as their end (asserted exactly by the
              // sandbox allowlist).
              voting_period_max: expect.any(Number),
              participation_period_max: expect.any(Number),
              outcomes_count: 1,
              outcomes: [
                {
                  type: "MANUAL",
                  description: SANDBOX_SCHEDULED_OUTCOME_TITLE,
                  distribution: [
                    {
                      amount: 1,
                      description: SANDBOX_SCHEDULED_OUTCOME_TITLE,
                    },
                  ],
                },
              ],
            }),
          }),
        ])
      );

    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps the ranking mode choice out of approve wave dates", async ({
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill("Sandbox Approve Wave");
    await page.getByText("Approve", { exact: true }).click();
    // The ranking-mode choice is a Rank-only concept, on Overview included.
    await expect(page.getByText("Perpetual Ranking")).toBeHidden();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Wave End", level: 3 })
    ).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("Perpetual Ranking")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeHidden();
  });
});

test.describe("Create wave mobile reachability @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Create-wave sandbox requires the local mock API runner."
  );
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders the create form with a progress header on small screens", async ({
    page,
  }) => {
    // Regression guard: the mobile master-detail layout used to swallow the
    // create route entirely, rendering the wave list instead of the form.
    await installExternalDataFixtures(page);
    await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    await expect(page.getByLabel(/Wave Name/)).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    // The desktop step rail is hidden below lg; the compact progress header
    // stands in for it.
    await expect(page.getByText(/Step 1 of \d+/)).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // Walk one step to prove the flow is actually usable, not just visible.
    await page.getByLabel(/Wave Name/).fill("Mobile Sandbox Wave");
    await nextStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can view" })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText(/Step 2 of \d+/)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("tolerates a trailing slash on the create route", async ({ page }) => {
    await installExternalDataFixtures(page);
    await page.goto("/waves/create/", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    await expect(page.getByLabel(/Wave Name/)).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
  });

  test("creates a chat wave end-to-end on mobile", async ({
    baseURL,
    page,
  }) => {
    await installExternalDataFixtures(page);
    await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    // Overview: the progress bar carries an accessible name and a
    // human-readable position.
    const progressBar = page.getByRole("progressbar", {
      name: "Wave setup progress",
    });
    await expect(progressBar).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(progressBar).toHaveAttribute("aria-valuenow", "1");
    await page.getByLabel(/Wave Name/).fill(SANDBOX_CREATED_WAVE_NAME);
    await expectNoHorizontalOverflow(page);
    await nextStepButton(page).click();

    // Groups
    await expect(
      page.getByRole("heading", { name: "Who can view" })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText(/Step 2 of 4/)).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await nextStepButton(page).click();

    // Rules
    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText(/Step 3 of 4/)).toBeVisible();
    await expect(progressBar).toHaveAttribute("aria-valuenow", "3");
    await expectNoHorizontalOverflow(page);
    await nextStepButton(page).click();

    // Description + submit
    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText(/Step 4 of 4/)).toBeVisible();
    await fillDescription(page, SANDBOX_CREATED_WAVE_DESCRIPTION);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "Complete" }).click();

    // The exact-body allowlist accepts the same payload regardless of
    // viewport; landing on the wave page proves the whole mobile flow.
    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await waitForRouteReady(page);
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps rank date and outcome layouts stable on phone screens", async ({
    page,
  }) => {
    // Regression pack for the 2026-07 iPhone device-testing round: every
    // assertion here maps to a bug that shipped past desktop-only review.
    await installExternalDataFixtures(page);
    await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);
    await expect(page.getByLabel(/Wave Name/)).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    // Next on an empty Wave Name used to do nothing visible on phones (the
    // field and its error sit a full screen above the button): it must
    // surface the error and hand focus back to the field.
    await nextStepButton(page).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByLabel(/Wave Name/)).toBeFocused();

    await page.getByLabel(/Wave Name/).fill("Mobile Rank Layout Wave");
    await page.getByText("Rank", { exact: true }).click();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    // Dates: interacting inside the announcements section must not
    // auto-collapse the Wave Timeline section above it — that collapse
    // shifted the whole page mid-tap ("calendar jumping around").
    const timelineToggle = page.getByRole("button", { name: /Wave Timeline/ });
    await expect(timelineToggle).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    // Each step must start at the top: the layout scroller used to keep the
    // previous step's offset, landing users mid-page on this tall step.
    await expect(timelineToggle).toBeInViewport();
    await expect(timelineToggle).toHaveAttribute("aria-expanded", "true");
    await page.getByText("First Winners Announcement").first().click();
    await expect(timelineToggle).toHaveAttribute("aria-expanded", "true");

    // The Add to Timeline button used to overflow its card on 390px screens.
    const addToTimeline = page.getByRole("button", { name: "Add to Timeline" });
    await addToTimeline.scrollIntoViewIfNeeded();
    const addToTimelineBox = await addToTimeline.boundingBox();
    const viewport = page.viewportSize();
    expect(addToTimelineBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(addToTimelineBox!.x + addToTimelineBox!.width).toBeLessThanOrEqual(
      viewport!.width
    );
    await expectNoHorizontalOverflow(page);

    // Collapsing a dates card must not paint summary chips over the title.
    await timelineToggle.click();
    await expect(timelineToggle).toHaveAttribute("aria-expanded", "false");
    await expectNoHorizontalOverflow(page);
    await timelineToggle.click();
    await nextStepButton(page).click();

    // Drops: the submissions-per-participant label used to wrap over the
    // input and hide the typed value at phone width.
    const submissions = page.locator(
      "#no-of-applications-allowed-per-participant"
    );
    await expect(submissions).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await submissions.fill("5");
    await expect(submissions).toHaveValue("5");
    const submissionsLabelBox = await page
      .locator('label[for="no-of-applications-allowed-per-participant"]')
      .boundingBox();
    const submissionsInputBox = await submissions.boundingBox();
    expect(submissionsLabelBox).not.toBeNull();
    expect(submissionsInputBox).not.toBeNull();
    expect(submissionsLabelBox!.width).toBeLessThan(submissionsInputBox!.width);
    await expectNoHorizontalOverflow(page);
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();
    await nextStepButton(page).click();

    // Outcomes: the saved row's type label and entered name used to overlap
    // at phone width, hiding what was entered.
    const manualOption = page.getByRole("button", { name: "Manual" });
    await expect(manualOption).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await manualOption.click();
    await page.getByLabel("Manual action").fill("Mobile manual outcome");
    await page.getByLabel(/Winning Positions/).fill("1");
    await page.getByRole("button", { name: "Save" }).click();
    const savedOutcomeTitle = page.getByText("Mobile manual outcome").first();
    await expect(savedOutcomeTitle).toBeVisible();
    const savedLabelBox = await page
      .getByRole("heading", { name: "Manual" })
      .boundingBox();
    const savedTitleBox = await savedOutcomeTitle.boundingBox();
    expect(savedLabelBox).not.toBeNull();
    expect(savedTitleBox).not.toBeNull();
    expect(savedTitleBox!.x).toBeGreaterThanOrEqual(
      savedLabelBox!.x + savedLabelBox!.width
    );
    await expectNoHorizontalOverflow(page);
  });

  test("autosaves a draft after leaving Overview and resumes it", async ({
    page,
  }) => {
    await installExternalDataFixtures(page);
    await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);
    await expect(page.getByLabel(/Wave Name/)).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    // On the very first visit there is nothing to resume.
    await expect(
      page.getByRole("region", { name: "Draft waves" })
    ).toBeHidden();

    const draftName = "Draft Resume Wave";
    await page.getByLabel(/Wave Name/).fill(draftName);
    // Leaving Overview is what arms autosave.
    await nextStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can view" })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });

    // Wait for the debounced autosave to actually land on disk before
    // reloading — otherwise the test races the persist and the "tab death"
    // wipes a draft that was never written.
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            window.localStorage.getItem("create-wave-drafts:v1")
          ),
        { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
      )
      .toContain(draftName);

    // Reload the page: a real tab death / crash. The in-memory config is
    // gone, but the on-device draft must survive and be offered on Overview.
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    const draftsSection = page.getByRole("region", { name: "Draft waves" });
    await expect(draftsSection).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    // The empty name field proves the reload really reset in-memory state.
    await expect(page.getByLabel(/Wave Name/)).toHaveValue("");

    // Resuming restores the saved name into the flow. Anchor on the start
    // of the accessible name so the load button (name + "Saved …") wins
    // over the delete button ("Delete draft …").
    await draftsSection
      .getByRole("button", { name: new RegExp(`^${draftName}`) })
      .click();
    await expect(page.getByLabel(/Wave Name/)).toHaveValue(draftName);

    // Deleting the draft removes the section entirely.
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);
    await expect(draftsSection).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await draftsSection
      .getByRole("button", { name: new RegExp(`Delete draft.*${draftName}`) })
      .click();
    await expect(draftsSection).toBeHidden();
  });

  test("manages multiple drafts newest-first without overflow", async ({
    page,
  }) => {
    const nameField = page.locator("#create-wave-name");
    // Distinct names, one long enough to force truncation in the card. Kept
    // free of the literal "Wave Name" so it can't collide with the field's
    // own accessible name in selectors.
    const longName =
      "Extremely Long Draft Title That Must Truncate In The Card Without Overflowing Even On The Narrowest Phone";
    const drafts = ["Draft One", longName, "Draft Three"];

    // Persist three drafts. A draft is armed by leaving Overview, and the
    // autosave is debounced, so wait for each to land before starting the
    // next fresh visit.
    for (const name of drafts) {
      await installExternalDataFixtures(page);
      await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page);
      await dismissNextDevTools(page);
      await expect(nameField).toBeVisible({
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await nameField.fill(name);
      await nextStepButton(page).click();
      await expect(
        page.getByRole("heading", { name: "Who can view" })
      ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
      await expect
        .poll(
          async () =>
            page.evaluate(() =>
              window.localStorage.getItem("create-wave-drafts:v1")
            ),
          { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
        )
        .toContain(name);
    }

    await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);
    const draftsSection = page.getByRole("region", { name: "Draft waves" });
    await expect(draftsSection).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    // All three present, newest first (the last saved sits on top).
    const cards = draftsSection.getByRole("listitem");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText("Draft Three");
    await expectNoHorizontalOverflow(page);

    // The long title truncates rather than stretching the card past the page.
    const longTitle = draftsSection.getByText(longName);
    const truncated = await longTitle.evaluate(
      (el) => el.scrollWidth > el.clientWidth
    );
    expect(truncated).toBe(true);

    // Deleting one leaves the rest intact.
    await draftsSection
      .getByRole("button", { name: new RegExp(`Delete draft.*Draft One`) })
      .click();
    await expect(cards).toHaveCount(2);
    await expect(
      draftsSection.getByRole("button", { name: /Delete draft.*Draft One/ })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
});

async function gotoCreateWave(page: Page) {
  await installExternalDataFixtures(page);
  await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(/\/waves\/create$/);
  await expect(page.getByLabel(/Wave Name/)).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

async function fillDescription(page: Page, text: string) {
  const editor = page.locator('[contenteditable="true"]').last();
  await expect(editor).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await editor.fill(text);
}

function nextStepButton(page: Page) {
  return page.getByRole("button", { name: "Next", exact: true });
}

function previousStepButton(page: Page) {
  return page.getByRole("button", { name: "Previous", exact: true });
}

async function installExternalDataFixtures(page: Page) {
  await page.route("**/6529-emoji/emoji-list.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: [],
      status: 200,
    });
  });
}
