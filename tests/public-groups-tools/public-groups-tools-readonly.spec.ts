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

async function openGroupFilters(page: Page) {
  const openButton = page.getByRole("button", { name: "Open group filters" });
  if (
    await openButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
  ) {
    await openButton.first().click();
  }
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

test.describe("Public tools, calendar, and removed Groups route coverage @surface @medium @large @readonly", () => {
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
    await expect(
      page.getByRole("heading", { level: 2, name: "Open Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open tool: API" })
    ).toHaveAttribute("href", "/tools/api");
    await expect(
      page.getByRole("link", { name: "Open tool: 6529bot Usage" })
    ).toHaveAttribute("href", "/open-data/6529bot");
    await expect(
      page.getByRole("link", { name: "Open tool: GDRC" })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  for (const path of [
    "/network/groups",
    "/network/groups?edit=new",
    "/network/groups?edit=example-group",
  ]) {
    test(`keeps the removed Groups route unavailable at ${path}`, async ({
      page,
    }) => {
      await gotoDocumentWithTransientRetry(page, path);

      await expect(page).toHaveURL((url) => url.href.endsWith(path));
      await expect(page).toHaveTitle(/404/i);
      await expect(
        page.getByRole("heading", { name: /404.*PAGE NOT FOUND/i })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("activates and clears a network group filter through the active-group state", async ({
    page,
  }) => {
    await gotoReady(page, "/network");

    await openGroupFilters(page);
    const chooseGroupButton = page
      .getByRole("button", { name: "Choose group" })
      .filter({ visible: true });
    await expect(chooseGroupButton).toBeVisible({ timeout: 30000 });
    await chooseGroupButton.click();

    const groupSearch = page
      .getByRole("combobox", { name: /Search groups/i })
      .filter({ visible: true });
    await expect(groupSearch).toBeVisible();

    // Resolve a real group id from the saved-group search's unfiltered request
    // so the test stays portable across local, staging, and production data
    // sets. The criteria builder opens by default, so the request starts only
    // after switching to Choose group and focusing its search field.
    const groupsResponsePromise = page.waitForResponse(
      (response) => {
        const responseUrl = new URL(response.url());
        return (
          response.request().method() === "GET" &&
          /\/groups\/?$/.test(responseUrl.pathname) &&
          !responseUrl.searchParams.has("group_name") &&
          response.ok()
        );
      },
      { timeout: 30000 }
    );
    await groupSearch.focus();
    const groupsResponse = await groupsResponsePromise;
    const groupsPayload = (await groupsResponse.json()) as
      | { readonly id?: string; readonly name?: string }[]
      | { readonly data?: { readonly id?: string; readonly name?: string }[] };
    const groups = Array.isArray(groupsPayload)
      ? groupsPayload
      : (groupsPayload.data ?? []);
    expect(groups.length, "Expected at least one public group").toBeGreaterThan(
      0
    );
    const groupId = groups[0]?.id;
    if (typeof groupId !== "string") {
      throw new Error("Expected the first public group to have an id");
    }

    // Deep-link the group: the URL param hydrates the active-group state.
    await gotoReady(page, `/network?group=${groupId}`);
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("group") === groupId
    );

    // The current Network UI exposes the active state in the filter trigger and
    // the selected-group summary on both desktop and mobile layouts.
    await expect(
      page.getByRole("button", { name: "Open group filters (active)" })
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Selected group", { exact: true })).toBeVisible(
      {
        timeout: 30000,
      }
    );

    // Clearing the group exercises the state transition back to null and
    // must drop the URL param.
    const clearButton = page
      .getByRole("button", { name: "Clear selected group" })
      .filter({ visible: true });
    await expect(clearButton).toBeVisible({ timeout: 15000 });
    await clearButton.click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("group") === null,
      { timeout: 15000 }
    );

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
        upcomingDrops.getByRole("link", { name: /^View The Memes card #/ }),
        upcomingDrops.getByText("No Subscriptions Found", { exact: true }),
      ],
      "upcoming subscription rows or empty state"
    );
    await expectAnyVisible(
      [
        pastDrops.getByRole("link", { name: /^View The Memes card #/ }),
        pastDrops.getByText("No Subscriptions Found", { exact: true }),
      ],
      "past subscription rows or empty state"
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

    const timezoneTabs = page.getByRole("tablist", {
      name: "Calendar timezone",
    });
    const localTab = timezoneTabs.getByRole("tab", {
      name: "Local",
      exact: true,
    });
    const utcTab = timezoneTabs.getByRole("tab", {
      name: "UTC",
      exact: true,
    });
    await expect(localTab).toHaveAttribute("aria-selected", "true");
    await expect(utcTab).toHaveAttribute("aria-selected", "false");
    await utcTab.click();
    await expect(utcTab).toHaveAttribute("aria-selected", "true");
    await expect(localTab).toHaveAttribute("aria-selected", "false");

    await expect(page.getByRole("button", { name: "Next Mint" })).toBeVisible();
    await expect(page.locator("#meme-overview-mint-input")).toBeVisible();
    await expect(page.locator("#meme-calendar-mint-input")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Screenshot" })
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /^SZN \d+ / }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /^Year \d+ / }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /^Epoch \d+ / }).first()
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
