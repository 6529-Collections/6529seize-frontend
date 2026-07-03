import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

async function gotoReady(
  page: Page,
  path: string,
  options: { readySelector?: string } = {}
) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page, options);
  await expectNoHorizontalOverflow(page);
}

async function expectAnyVisible(
  candidates: readonly Locator[],
  description: string
) {
  for (const candidate of candidates) {
    if (
      await candidate
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false)
    ) {
      return;
    }
  }

  expect(false, `Expected one visible ${description}`).toBe(true);
}

async function expectSubscriptionsSettled(page: Page) {
  await expect(page.getByText(/Loading upcoming drops/i)).toBeHidden({
    timeout: 30000,
  });
  await expect(page.getByText(/Loading past drops/i)).toBeHidden({
    timeout: 30000,
  });
}

test.describe("Public groups, tools, and calendar read-only coverage @surface @medium @large @readonly", () => {
  test("renders the Tools index with grouped utility links", async ({
    page,
  }) => {
    await gotoReady(page, "/tools");

    await expect(page).toHaveURL((url) => url.pathname === "/tools");
    await expect(page).toHaveTitle("Tools");
    await expect(
      page.getByRole("heading", { level: 1, name: "6529 Tools" })
    ).toBeVisible();
    await expect(page.getByText("NFT Delegation")).toBeVisible();
    await expect(page.getByText("The Memes Tools")).toBeVisible();
    await expect(page.getByText("Builder Tools")).toBeVisible();
    await expect(page.getByText("Open Data")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open tool: API" })
    ).toHaveAttribute("href", "/tools/api");
    await expect(
      page.getByRole("link", { name: "Open tool: GDRC" })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("renders the public Groups browse surface without write controls", async ({
    page,
  }) => {
    await gotoReady(page, "/network/groups");

    await expect(page).toHaveURL((url) => url.pathname === "/network/groups");
    await expect(page).toHaveTitle(/Groups/i);
    await expect(
      page.getByRole("heading", { level: 1, name: "Groups" })
    ).toBeVisible();
    await expect(page.getByLabel("By Identity")).toBeVisible();
    await expect(page.getByLabel("By Group Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create New" })).toHaveCount(
      0
    );
    await expect(page.getByRole("button", { name: "My groups" })).toHaveCount(
      0
    );

    const groupNameInput = page.getByLabel("By Group Name");
    await groupNameInput.fill("6529");
    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === "/network/groups" &&
        url.searchParams.get("group") === "6529"
      );
    });
    await expectNoHorizontalOverflow(page);
  });

  test("renders the subscriptions report read-only and keeps download actions explicit", async ({
    page,
  }) => {
    await gotoReady(page, "/tools/subscriptions-report");

    await expect(page).toHaveURL(
      (url) => url.pathname === "/tools/subscriptions-report"
    );
    await expect(page).toHaveTitle(/Subscriptions Report/i);
    await expect(
      page.getByRole("heading", { level: 1, name: "Subscriptions Report" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Learn more about The Memes subscriptions",
      })
    ).toHaveAttribute("href", "/about/subscriptions");
    await expect(
      page.getByText("Upcoming Drops", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Past Drops", { exact: true })).toBeVisible();

    await expectSubscriptionsSettled(page);
    const upcomingDrops = page.getByTestId(
      "subscriptions-report-upcoming-drops"
    );
    const pastDrops = page.getByTestId("subscriptions-report-past-drops");
    await expectAnyVisible(
      [
        upcomingDrops.getByText(
          "Table listing upcoming meme card subscriptions"
        ),
        upcomingDrops.getByText("No Subscriptions Found"),
      ],
      "upcoming subscriptions table or empty state"
    );
    await expectAnyVisible(
      [
        pastDrops.getByText(
          "Table listing past meme card subscription redemptions"
        ),
        pastDrops.getByText("No Subscriptions Found"),
      ],
      "past subscriptions table or empty state"
    );
    await expect(
      page.getByRole("button", { name: /^Download$/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "My Subscriptions" })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("renders the Meme Calendar locale and timezone controls without downloads", async ({
    page,
  }) => {
    await gotoReady(page, "/meme-calendar?locale=de-DE");

    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === "/meme-calendar" &&
        url.searchParams.get("locale") === "de-DE"
      );
    });
    await expect(page).toHaveTitle(/Memes Minting Calendar/i);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "The Memes Minting Calendar",
      })
    ).toBeVisible();

    const localButton = page.getByRole("button", { name: "Show local time" });
    const utcButton = page.getByRole("button", { name: "Show UTC" });
    await expect(localButton).toHaveAttribute("aria-pressed", "true");
    await expect(utcButton).toHaveAttribute("aria-pressed", "false");
    await utcButton.click();
    await expect(utcButton).toHaveAttribute("aria-pressed", "true");
    await expect(localButton).toHaveAttribute("aria-pressed", "false");

    await expect(page.getByRole("button", { name: "Next Mint" })).toBeVisible();
    await expect(page.locator("#meme-overview-mint-input")).toBeVisible();
    await expect(page.locator("#meme-calendar-mint-input")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Screenshot" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^SZN / }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Year / }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Epoch / }).first()
    ).toBeVisible();

    const calendarLink = page
      .getByRole("link", { name: "Add to Calendar" })
      .first();
    const googleCalendarLink = page
      .getByRole("link", { name: "Add to Google Calendar" })
      .first();
    await expect(calendarLink).toHaveAttribute(
      "href",
      /^data:text\/calendar;charset=utf-8,/
    );
    await expect(googleCalendarLink).toHaveAttribute(
      "href",
      /^https:\/\/calendar\.google\.com\/calendar\/render/
    );
    await expectNoHorizontalOverflow(page);
  });
});
