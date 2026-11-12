import { test, expect } from "../testHelpers";

const STAGING_DEPLOYMENT_HOSTNAME = /^[a-z0-9-]*staging\.6529\.io$/;

function isStagingDeployment(baseURL: string | undefined): boolean {
  return (
    baseURL !== undefined &&
    STAGING_DEPLOYMENT_HOSTNAME.test(new URL(baseURL).hostname)
  );
}

// The staging check enters a real team access code.
test.use({ trace: "off", screenshot: "off", video: "off" });

test.describe("Access Page", () => {
  test("preserves the requested page through API access when required", async ({
    context,
    baseURL,
  }) => {
    const page = await context.newPage();
    const path = "/the-memes?accessReturnCheck=1";
    const hash = "#access-return-check";

    if (!isStagingDeployment(baseURL)) {
      await page.goto(path + hash);
      await expect(page).toHaveURL(path + hash);
      return;
    }

    const accessCode =
      process.env["PLAYWRIGHT_STAGING_ACCESS_CODE"] ??
      process.env["STAGING_AUTH"];
    if (!accessCode) throw new Error("Staging access code is required.");

    await context.clearCookies();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/" &&
          response.status() === 401
      ),
      page.goto(path + hash),
    ]);
    const gateUrl = new URL(page.url());
    expect(gateUrl.pathname).toBe("/access");
    expect(gateUrl.searchParams.get("returnTo")).toBe(path);
    await expect(page).toHaveTitle("Access Page");

    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    const input = page.getByRole("textbox", { name: "Team access code" });
    await input.fill(accessCode);
    await input.press("Enter");

    await expect(page).toHaveURL(path + hash);
    expect(dialogs).toEqual([]);
  });
});
