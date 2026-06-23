import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  fetchSandboxRequests,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

test.describe("Notifications local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Notifications sandbox requires the local mock API runner."
  );

  test("renders positive notification states and keeps mark-read local", async ({
    baseURL,
    page,
  }) => {
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("button", { name: "All", exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText("mentioned you")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("New reactions").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sandbox Notifications Wave" }).last()
    ).toBeVisible();

    await page.getByRole("button", { name: "Reactions", exact: true }).click();
    await expect(page.getByText("New reactions").first()).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("mentioned you")).toHaveCount(0);

    await page.getByRole("button", { name: "Invites", exact: true }).click();
    await expect(page.getByText("invited you to a wave:")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("link", { name: "Sandbox Notifications Wave" }).first()
    ).toHaveAttribute("href", "/waves/00000000-0000-4000-8000-000000000533");
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.path === "/api/notifications/read" &&
          request.kind === "allowed-sandbox-mutation"
      )
    ).toBe(true);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});
