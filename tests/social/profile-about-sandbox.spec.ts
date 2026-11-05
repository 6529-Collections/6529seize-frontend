import type { Page } from "@playwright/test";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WALLET = "0x0000000000000000000000000000000000000529";
const PROFILE_ID = "00000000-0000-4000-8000-000000000531";
const LONG_ABOUT = Array.from(
  { length: 10 },
  (_, i) => `Line ${i + 1}: collecting art and sharing ideas.`
).join("\n");

async function seedSession(page: Page, role: string | null = null) {
  const jwt = [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(
      JSON.stringify({ sub: WALLET, role, exp: 2000000000 })
    ).toString("base64url"),
    "",
  ].join(".");
  await page.addInitScript(
    ({ address, jwt, role, profileId }) => {
      document.cookie = "essential-cookies-consent=true; path=/";
      document.cookie = "performance-cookies-consent=false; path=/";
      localStorage.setItem("6529-wallet-active-address", address);
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt,
            role,
            refreshToken: null,
            authSessionVersion: "v2",
            profileId,
            profileHandle: "playwright",
          },
        ])
      );
    },
    { address: WALLET, jwt, role, profileId: PROFILE_ID }
  );
}

async function openOwnProfile(page: Page, expectOwnerAction = true) {
  // Match the existing profile fixture: enter from the hydrated shell to avoid
  // the unrelated cold-load profile navigation hydration defect.
  await page.goto("/about");
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  }
  const nativeProfile = page.getByRole("link", {
    name: "Open playwright profile",
    exact: true,
  });
  const accountMenu = page.getByRole("button", {
    name: "Open account and profiles menu",
    exact: true,
  });
  await expect(nativeProfile.or(accountMenu)).toBeVisible();
  if (await nativeProfile.isVisible()) await nativeProfile.click();
  else {
    await accountMenu.press("Enter");
    await page.getByRole("link", { name: "Profile", exact: true }).click();
  }
  await expect(page).toHaveURL(/\/playwright(?:[/?#]|$)/);
  if (expectOwnerAction) {
    await expect(
      page.getByRole("button", { name: "Edit profile", exact: true })
    ).toBeVisible();
  }
}

async function installStatements(page: Page, api: string) {
  let value: string | null = null;
  const statements = () =>
    value === null
      ? []
      : [
          {
            id: "about-statement",
            profile_id: PROFILE_ID,
            statement_group: "GENERAL",
            statement_type: "BIO",
            statement_value: value,
            statement_comment: null,
            created_at: 1713744000000,
            updated_at: null,
          },
        ];
  await page.route(`${api}/api/profiles/*/cic/statements`, async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body.statement_group).toBe("GENERAL");
      expect(body.statement_type).toBe("BIO");
      value = body.statement_value;
      await route.fulfill({ json: statements()[0] });
    } else {
      await route.fulfill({ json: statements() });
    }
  });
  await page.route(
    `${api}/api/profiles/*/cic/statements/about-statement`,
    async (route) => {
      expect(route.request().method()).toBe("DELETE");
      value = null;
      await route.fulfill({ json: {} });
    }
  );
}

async function openAboutEditor(page: Page) {
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  const aboutMenuItem = page.getByRole("button", {
    name: "About",
    exact: true,
  });
  if (await aboutMenuItem.isVisible()) await aboutMenuItem.click();
  await expect(
    page.getByRole("textbox", { name: "About statement", exact: true })
  ).toBeVisible();
}

test.describe("Profile editing @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Profile edits require the isolated mock API."
  );

  test("adds, edits and removes About through the profile editor", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    await seedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await openOwnProfile(page);
    const edit = page.getByRole("button", {
      name: "Edit profile",
      exact: true,
    });
    await expect(
      page.getByRole("button", { name: /^(Add|Edit) About statement$/ })
    ).toHaveCount(0);
    if (isMobile)
      expect((await edit.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    else {
      await edit.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(edit).toBeFocused();
    }
    await page.screenshot({ path: testInfo.outputPath("empty-profile.png") });
    await openAboutEditor(page);
    const input = page.getByRole("textbox", {
      name: "About statement",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save", exact: true });
    if (!isMobile) {
      await expect(
        page.getByRole("textbox", { name: "Profile name", exact: true })
      ).toBeVisible();
      for (const name of ["Profile cover", "Profile picture"])
        await expect(
          page.getByRole("heading", { name, exact: true })
        ).toBeVisible();
    }
    await expect(save).toBeDisabled();
    await input.fill(LONG_ABOUT);
    await save.click();
    await expect(input).toHaveCount(0);
    await expect(page.getByText(LONG_ABOUT, { exact: true })).toBeVisible();
    if (isMobile) {
      await page.getByRole("button", { name: "See more", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "See less", exact: true })
      ).toBeVisible();
      await page.getByRole("button", { name: "See less", exact: true }).click();
      await expect(input).toHaveCount(0);
    }
    await openAboutEditor(page);
    await expect(input).toHaveValue(LONG_ABOUT);
    await input.fill("Updated About statement for this isolated test.");
    await save.click();
    await expect(input).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page, { include: ["#profile-about"] });
    await openAboutEditor(page);
    await input.fill("");
    await save.click();
    await expect(input).toHaveCount(0);
    await expect(
      page.getByText("Updated About statement for this isolated test.", {
        exact: true,
      })
    ).toHaveCount(0);
    await openAboutEditor(page);
    await expect(input).toBeEmpty();
    await expect(save).toBeDisabled();
  });

  test("retains the draft on save errors and moderation warnings", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    await seedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await openOwnProfile(page);
    await openAboutEditor(page);
    const input = page.getByRole("textbox", {
      name: "About statement",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save", exact: true });
    const failures = [
      ["Unavailable", "Couldn't save About"],
      ["hate speech", "Hate speech warning"],
      ["personal insults", "Personal insult warning"],
      ["inappropriate language", "Language warning"],
      ["doxxing of another person", "Privacy warning"],
    ];
    for (const [error, title] of failures) {
      await page.route(
        `${getSandboxApiOrigin(baseURL)}/api/profiles/*/cic/statements`,
        (route) =>
          route.request().method() === "POST"
            ? route.fulfill({ status: 400, json: { error } })
            : route.fallback()
      );
      await input.fill(`Safe draft for the ${title} fixture.`);
      const draft = await input.inputValue();
      await save.click();
      await expect(
        page.getByRole("heading", { name: title, exact: true })
      ).toBeVisible();
      await expect(input).toHaveValue(draft);
      await expect(input).toHaveAttribute(
        "aria-describedby",
        /profile-about-error/
      );
      await expect(save).toBeEnabled();
    }
    await page.keyboard.press("Escape");
    if (!isMobile) {
      await expect(
        page.getByRole("heading", { name: "Discard your changes?" })
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Keep editing", exact: true })
        .click();
      await expect(input).toBeVisible();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
    }
    await expect(input).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Edit profile", exact: true })
    ).toBeFocused();
  });

  test("uses the existing field menu in narrow desktop windows", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "The mobile owner journey covers the small-screen menu."
    );
    await seedSession(page);
    await openOwnProfile(page);
    await page.setViewportSize({ width: 600, height: 850 });
    await page
      .getByRole("button", { name: "Edit profile", exact: true })
      .press("Enter");
    for (const name of [
      "Profile cover",
      "Profile picture",
      "Profile name",
      "Classification",
      "About",
    ])
      await expect(
        page.getByRole("button", { name, exact: true })
      ).toBeVisible();
    await page.getByRole("button", { name: "About", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "About statement", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "About", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expectNoHorizontalOverflow(page);
  });

  test("opens all fields on wide touch and hybrid screens", async ({
    page,
    isMobile,
  }) => {
    if (!isMobile)
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "maxTouchPoints", {
          configurable: true,
          get: () => 5,
        });
      });
    await seedSession(page);
    await openOwnProfile(page);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page
      .getByRole("button", { name: "Edit profile", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Edit profile", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Profile name", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "About statement", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expectNoHorizontalOverflow(page);
  });

  for (const viewer of ["visitor", "logged out", "proxy"] as const) {
    test(`never flashes owner actions for ${viewer}`, async ({
      page,
      baseURL,
    }) => {
      if (viewer !== "logged out")
        await seedSession(page, viewer === "proxy" ? "grantor" : null);
      if (viewer === "proxy") {
        await page.route(
          `${getSandboxApiOrigin(baseURL)}/api/profiles/*/proxies/**`,
          (route) =>
            route.fulfill({
              json: [
                {
                  id: "proxy",
                  created_by: { id: "grantor", handle: "grantor", pfp: null },
                  granted_to: {
                    id: PROFILE_ID,
                    handle: "playwright",
                    pfp: null,
                  },
                  actions: [
                    {
                      action_type: "ALLOCATE_REP",
                      credit_amount: 50,
                      credit_spent: 0,
                      is_active: true,
                      accepted_at: 1,
                    },
                  ],
                },
              ],
            })
        );
      }
      await page.addInitScript(() => {
        const observer = new MutationObserver(() => {
          if (document.querySelector('[aria-label="Edit profile"]')) {
            document.documentElement.dataset["aboutControlFlashed"] = "true";
          }
        });
        observer.observe(document, { childList: true, subtree: true });
      });
      if (viewer === "proxy") {
        await openOwnProfile(page, false);
      } else {
        await page.goto(
          viewer === "visitor" ? "/following-artist-0" : "/playwright"
        );
      }
      await expect(
        page.getByRole("navigation", { name: "Profile sections" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Edit profile", exact: true })
      ).toHaveCount(0);
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-about-control-flashed"
      );
    });
  }
});
