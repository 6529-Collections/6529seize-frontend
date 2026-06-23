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

const SANDBOX_DM_WAVE_ID = "00000000-0000-4000-8000-000000000532";
const SANDBOX_DM_RECIPIENT_WALLET =
  "0x0000000000000000000000000000000000000532";

test.describe("Direct message local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Direct message sandbox requires the local mock API runner."
  );

  test("selects a recipient and creates a synthetic direct-message wave", async ({
    baseURL,
    page,
  }) => {
    await page.goto("/messages/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(page.getByText("Search Identity")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    const createButton = page.getByRole("button", { name: "Create" }).last();
    await expect(createButton).toBeDisabled();

    await page.getByLabel("Identity").fill("sandbox");
    await page.getByRole("button", { name: /sandbox-recipient/i }).click();
    await expect(page.getByText("sandbox-recipient").last()).toBeVisible();

    await expect(createButton).toBeEnabled();
    await createButton.click();

    await expect(page).toHaveURL(
      new RegExp(`/messages/${escapeRegExp(SANDBOX_DM_WAVE_ID)}$`),
      {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      }
    );
    await expect(page.getByText("Sandbox Direct Message")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.path === "/api/waves/direct-message/new"
    );
    expect(createRequest).toMatchObject({
      kind: "allowed-sandbox-mutation",
      body: { identity_addresses: [SANDBOX_DM_RECIPIENT_WALLET] },
    });
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
