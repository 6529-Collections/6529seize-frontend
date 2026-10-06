import { expect, test, type Page } from "@playwright/test";
import type {} from "../support/waveFeatureFixtureApi";

interface CapturedEvent {
  event: string;
  properties: Record<string, unknown>;
}

async function events(page: Page): Promise<CapturedEvent[]> {
  return page.evaluate(async () => {
    const response = await fetch("/events");
    return response.json();
  });
}
async function featureEvents(page: Page, event: string, value: string) {
  return (await events(page)).filter(
    (item) => item.event === event && item.properties["value"] === value
  );
}
const visibleTab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true }).filter({ visible: true });
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, request, baseURL }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  expect(new URL(baseURL ?? "").hostname).toBe("127.0.0.1");
  await request.get("/clear");
  await page.route("**/*", async (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host !== "127.0.0.1") {
      await route.abort();
      throw new Error(
        `The synthetic fixture attempted non-loopback traffic: ${host}`
      );
    }
    await route.continue();
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      "mp_synthetic-wave-feature-pilot_mixpanel",
      JSON.stringify({
        distinct_id: "$device:synthetic-device",
        $device_id: "synthetic-device",
        $initial_referrer:
          "https://example.test/private-handle?wallet=private-wallet",
        $initial_referring_domain: "private-domain.test",
        mp_keyword: "private-content",
        utm_term: "private-content",
      })
    );
    if (new URLSearchParams(location.search).get("transport") === "batch") {
      localStorage.setItem(
        "__mpq_synthetic-wave-feature-pilot_ev",
        JSON.stringify([
          {
            id: "synthetic-queued-event",
            flushAfter: 0,
            payload: {
              event: "Synthetic Queued Product Event",
              properties: {
                token: "synthetic-wave-feature-pilot",
                distinct_id: "529",
                path: "/waves/:waveId",
                $current_url:
                  "https://example.test/private-wave?wallet=private-wallet",
                $initial_referrer: "https://example.test/private-handle",
                mp_keyword: "private-content",
              },
            },
          },
        ])
      );
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("foreground visibility signals and an occluding overlay interrupt exposure dwell", async ({
  page,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  // Headless Chromium keeps pages focused. Drive the visibility lifecycle signal explicitly.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1200);
  expect(await featureEvents(page, "Wave Feature Seen", "chat")).toHaveLength(
    0
  );
  await page.evaluate(() => {
    const overlay = document.createElement("div");
    overlay.id = "fixture-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:#111";
    document.body.appendChild(overlay);
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1200);
  expect(await featureEvents(page, "Wave Feature Seen", "chat")).toHaveLength(
    0
  );
  await page.evaluate(() =>
    document.getElementById("fixture-overlay")?.remove()
  );
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "chat")).length
    )
    .toBe(1);
});

test("sidebar collection and search controls count deliberate use without query content", async ({
  page,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await page.getByRole("button", { name: "Pinned", exact: true }).hover();
  await page.getByRole("button", { name: "Pinned", exact: true }).focus();
  expect(
    (await events(page)).filter(
      (event) => event.event === "Wave Feature Activated"
    )
  ).toHaveLength(0);
  await page.keyboard.press("Enter");
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "pinned")).length
    )
    .toBe(1);
  await page.getByRole("button", { name: "Find a wave…", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Find a wave…" })
    .fill("private-search-content");
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "search")).length
    )
    .toBe(1);
  expect(JSON.stringify(await events(page))).not.toContain(
    "private-search-content"
  );
});

test("production SDK strips automatic and persisted navigation properties for batched and direct delivery", async ({
  page,
}) => {
  for (const transport of ["batch", "direct"]) {
    await page.request.get("/clear");
    await page.goto(
      `/waves/private-wave?wallet=private-wallet&utm_term=private-content&transport=${transport}`,
      {
        referer: "https://example.test/private-handle?wallet=private-wallet",
      }
    );
    await page
      .getByRole("button", { name: "Enable synthetic telemetry" })
      .click();
    await expect
      .poll(
        async () =>
          (await events(page)).filter(
            (event) => event.event === "Wave Feature Seen"
          ).length
      )
      .toBeGreaterThan(0);
    const captured = await events(page);
    if (transport === "batch") {
      await expect
        .poll(
          async () =>
            (await events(page)).filter(
              (event) => event.event === "Synthetic Queued Product Event"
            ).length
        )
        .toBe(1);
      const queued = (await events(page)).find(
        (event) => event.event === "Synthetic Queued Product Event"
      );
      expect(queued?.properties).toMatchObject({
        distinct_id: "529",
        path: "/waves/:waveId",
      });
      expect(JSON.stringify(queued)).not.toMatch(
        /private-(?:wave|wallet|handle|content)/
      );
    }
    expect(
      captured.some(
        (event) =>
          event.event === "$identify" &&
          event.properties["distinct_id"] === "529"
      )
    ).toBe(true);
    for (const event of captured) {
      expect(event.properties).not.toHaveProperty("$current_url");
      expect(event.properties).not.toHaveProperty("$referrer");
      expect(event.properties).not.toHaveProperty("$initial_referrer");
      expect(event.properties).not.toHaveProperty("mp_keyword");
      expect(event.properties).not.toHaveProperty("utm_term");
      if (event.event.startsWith("Wave Feature")) {
        expect(JSON.stringify(event)).not.toMatch(
          /private-(?:wave|wallet|handle|content)|raw_path|profile_handle/
        );
        expect(event.properties["route_family"]).toBe("/waves/:waveId");
        expect(event.properties["token"]).toBe("synthetic-wave-feature-pilot");
      }
    }
    const persisted = await page.evaluate(() =>
      localStorage.getItem("mp_synthetic-wave-feature-pilot_mixpanel")
    );
    expect(persisted).not.toMatch(/\$initial_referrer|mp_keyword|utm_term/);
    await page.evaluate(() => window.featureFixture.revoke());
  }
});

test("scripted selections retain product behavior without counting deliberate use", async ({
  page,
  isMobile,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await page
    .getByRole("button", { name: "Pinned", exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(
    page.getByRole("button", { name: "Pinned", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  if (isMobile) {
    await page.getByRole("button", { name: "Sort: Current Vote" }).tap();
    await page
      .getByRole("menuitem", { name: "Newest", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click());
  } else {
    await page
      .getByRole("tab", { name: "Newest", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click());
  }
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("CHAT:CREATED_AT");
  await page.waitForTimeout(1200);
  expect(
    (await events(page)).filter(
      (event) => event.event === "Wave Feature Activated"
    )
  ).toHaveLength(0);
});

test("missing or malformed cookie blocks delivery despite stale UI consent", async ({
  page,
}) => {
  for (const consent of [undefined, "invalid", "false"]) {
    await page.request.get("/clear");
    await page.goto("/waves/private-wave");
    await page
      .getByRole("button", { name: "Enable synthetic telemetry" })
      .click();
    await page.evaluate((value) => {
      document.cookie =
        value === undefined
          ? "performance-cookies-consent=; Max-Age=0; path=/"
          : `performance-cookies-consent=${value}; path=/`;
      window.featureFixture.lateEvent();
    }, consent);
    await visibleTab(page, "Winners").click();
    await expect(
      page.getByRole("status", { name: "Selected fixture state" })
    ).toHaveText("WINNERS:RANK");
    await page.waitForTimeout(1200);
    expect(
      (await events(page)).filter((event) =>
        event.event.startsWith("Wave Feature")
      )
    ).toHaveLength(0);
  }
});

test("counts only the visible responsive tab copy, and deduplicates remounts within a visit", async ({
  page,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "chat")).length
    )
    .toBe(1);
  expect(
    (await featureEvents(page, "Wave Feature Seen", "chat"))[0]?.properties
  ).toMatchObject({
    selected: true,
    selection_source: "automatic",
    exposure_kind: "foreground_dwell",
  });
  expect(
    (await events(page)).filter(
      (event) => event.event === "Wave Feature Activated"
    )
  ).toHaveLength(0);
  await page.evaluate(() => window.featureFixture.remount());
  await page.waitForTimeout(1200); // The full dwell window must pass before checking duplicate absence.
  expect(await featureEvents(page, "Wave Feature Seen", "chat")).toHaveLength(
    1
  );
});

test("fast deliberate tab and sort selections work with mouse, touch and keyboard", async ({
  page,
  isMobile,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await visibleTab(page, "Winners").click();
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("WINNERS:RANK");
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "winners")).length
    )
    .toBe(1);
  expect(
    (await featureEvents(page, "Wave Feature Seen", "winners"))[0]?.properties[
      "exposure_kind"
    ]
  ).toBe("direct_activation");
  expect(
    (await featureEvents(page, "Wave Feature Seen", "winners"))[0]?.properties[
      "selection_source"
    ]
  ).toBe("user");
  await visibleTab(page, "Chat").focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "chat")).length
    )
    .toBe(1);
  if (isMobile) {
    await page.getByRole("button", { name: "Sort: Current Vote" }).tap();
    await page.getByRole("menuitem", { name: "Newest", exact: true }).tap();
  } else {
    await page.getByRole("tab", { name: "Newest", exact: true }).click();
  }
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("CHAT:CREATED_AT");
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "created_at"))
          .length
    )
    .toBe(1);
  await page.evaluate(() =>
    window.featureFixture.navigate("/waves/another-private-wave")
  );
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "chat")).length
    )
    .toBe(2);
});

test("collapsed and nested-scroll rows stay unexposed until they are actually visible", async ({
  page,
}) => {
  await page.goto("/waves/private-wave");
  await page.getByRole("button", { name: "Collapse Active Votes" }).click();
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await page.waitForTimeout(1200);
  expect(
    await featureEvents(page, "Wave Feature Seen", "active_votes_wave")
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Expand Active Votes" }).click();
  await page.locator("#nested-scroll").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "active_votes_wave"))
          .length
    )
    .toBe(1);
  await page
    .locator('[data-wave-feature-list="active-votes"]')
    .evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  await page.waitForTimeout(1200);
  expect(
    await featureEvents(page, "Wave Feature Seen", "active_votes_wave")
  ).toHaveLength(1);
  expect(
    (await events(page)).filter(
      (event) =>
        event.event === "Wave Feature Activated" &&
        event.properties["value"] === "active_votes"
    )
  ).toHaveLength(1);
});

test("withdrawal cancels pending exposure and late sends, and SDK failure does not break controls", async ({
  page,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await page.evaluate(() => {
    window.featureFixture.revoke();
    window.featureFixture.lateEvent();
  });
  await page.waitForTimeout(1200);
  expect(
    (await events(page)).filter((event) =>
      event.event.startsWith("Wave Feature")
    )
  ).toHaveLength(0);
  await page.evaluate(() => window.featureFixture.enable());
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "chat")).length
    )
    .toBe(1);
  await page.evaluate(() => window.featureFixture.failSdk());
  await visibleTab(page, "Winners").click();
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("WINNERS:RANK");
});
