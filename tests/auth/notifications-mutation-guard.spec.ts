import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow } from "../support/pageAssertions";
import { installReadonlyMutationGuard } from "../support/readonlyMutationGuard";

const DEV_AUTH_SKIP_MESSAGE =
  "Notification mutation-guard E2E requires PLAYWRIGHT_READONLY=1, USE_DEV_AUTH=true, DEV_MODE_WALLET_ADDRESS, DEV_MODE_AUTH_JWT, and PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE.";

const NOTIFICATION_READ_RULE_IDS = new Set([
  "notification-read-all",
  "notification-read-all-loopback",
  "staging-notification-read-all",
  "production-notification-read-all",
]);

function hasDevAuthConfig() {
  return (
    process.env["PLAYWRIGHT_READONLY"] === "1" &&
    process.env["USE_DEV_AUTH"] === "true" &&
    Boolean(process.env["DEV_MODE_WALLET_ADDRESS"]) &&
    Boolean(process.env["DEV_MODE_AUTH_JWT"]) &&
    Boolean(process.env["PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE"])
  );
}

test.describe("Notification mutation guard @auth @medium @readonly", () => {
  test.skip(!hasDevAuthConfig(), DEV_AUTH_SKIP_MESSAGE);

  test("blocks the authenticated notifications mark-read side effect", async ({
    baseURL,
    context,
    page,
  }) => {
    const guard = await installReadonlyMutationGuard(context, baseURL);

    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "All" })).toBeVisible({
      timeout: 10000,
    });
    await expectNoHorizontalOverflow(page);

    const findMarkReadMutation = () =>
      guard.blockedRequests.find((request) =>
        request.url.endsWith("/api/notifications/read")
      );

    await expect
      .poll(() => findMarkReadMutation() !== undefined, {
        message:
          "Expected /notifications to attempt its current mark-read mutation.",
        timeout: 10000,
      })
      .toBe(true);

    const markReadMutation = findMarkReadMutation();

    expect(markReadMutation).toBeDefined();
    expect(markReadMutation).toMatchObject({
      method: "POST",
      reason: "registered-mutation-endpoint",
    });
    expect(markReadMutation?.ruleId).toBeDefined();
    expect(NOTIFICATION_READ_RULE_IDS.has(markReadMutation?.ruleId ?? "")).toBe(
      true
    );
    expect(() => guard.assertNoBlockedRequests()).toThrow(
      /Read-only Playwright run blocked/
    );
  });
});
