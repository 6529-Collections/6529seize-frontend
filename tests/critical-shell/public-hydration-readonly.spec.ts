import { expect, test } from "../testHelpers";

test.use({ timezoneId: "Pacific/Auckland" });

for (const path of ["/punk6529", "/network", "/the-memes/1", "/nextgen"]) {
  test(`hydrates the public data shell before opening search at ${path} @performance @readonly`, async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const search = page.getByRole("button", { name: /^Search(?: 6529)?$/ });
    // Visibility alone only establishes that the server preview is present.
    await expect(search).toBeEnabled({ timeout: 15000 });
    await search.click();
    await expect(page.getByRole("dialog").getByRole("combobox")).toBeVisible();
    await page.keyboard.press("Escape");
  });
}

test("preserves the first calculator input after hydration @performance @readonly", async ({
  page,
}) => {
  await page.goto("/network/wave-score", { waitUntil: "domcontentloaded" });
  const input = page.getByLabel("Wave name or URL", { exact: true });
  await expect(input).toBeEnabled();
  await input.fill("x");
  await page.getByRole("button", { name: "Score", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Enter a wave name, wave id, or wave URL."
  );
});

test("keeps server-rendered calculator controls inactive until JavaScript is ready @performance @readonly", async ({
  page,
}) => {
  let releaseScripts: () => void = () => undefined;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/network/wave-score", { waitUntil: "commit" });
    await expect(
      page.getByRole("heading", {
        name: "Wave score transparency",
        exact: true,
      })
    ).toBeVisible();
    const input = page.getByLabel("Wave name or URL", { exact: true });
    const score = page.getByRole("button", { name: "Score", exact: true });
    await expect(input).toBeDisabled();
    await expect(score).toBeDisabled();
    // Native disabled controls keep their name/role/state in the accessibility
    // snapshot while unavailable, rather than advertising an inert action.
    await expect(input).toMatchAriaSnapshot(
      '- textbox "Wave name or URL" [disabled]'
    );
    await expect(score).toMatchAriaSnapshot('- button "Score" [disabled]');
    // Native public links remain usable in the preview; no global inert gate.
    await expect(
      page
        .getByRole("main")
        .getByRole("link")
        .filter({ hasText: "About" })
        .first()
    ).toBeVisible();
    releaseScripts();
    await input.fill("x");
    await score.click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Enter a wave name, wave id, or wave URL."
    );
  } finally {
    releaseScripts();
  }
});

test("hydrates browser-local calendar clocks with a different client time and timezone @performance @readonly", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(Date.now() + 90_000));
  await page.goto("/meme-calendar?locale=de-DE", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("table", { name: /Upcoming Mints for SZN/ })
  ).toBeVisible();
  await page.getByRole("tab", { name: "UTC", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "UTC", exact: true })
  ).toHaveAttribute("aria-selected", "true");
});
