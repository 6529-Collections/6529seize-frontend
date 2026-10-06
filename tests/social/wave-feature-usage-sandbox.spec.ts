import { expect, test, type Page } from "@playwright/test";
import type {} from "../support/waveFeatureFixtureApi";

interface CapturedEvent {
  event: string;
  properties: Record<string, unknown>;
}

interface CapturedIdentity {
  $token: string;
  $distinct_id: string;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
}

async function peopleUpdates(page: Page): Promise<CapturedIdentity[]> {
  return page.evaluate(async () => (await fetch("/people")).json());
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
async function enableIdentifiedAnalytics(
  page: Page,
  transport: "batch" | "direct"
) {
  await page.goto(`/waves/private-wave?transport=${transport}`);
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) =>
          event.event === "$identify" &&
          event.properties["distinct_id"] === "529"
      )
    )
    .toBe(true);
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
      errors.push(
        `The synthetic fixture attempted non-loopback traffic: ${host}`
      );
      await route.abort();
      return;
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
      if (new URLSearchParams(location.search).get("people") === "1") {
        localStorage.setItem(
          "__mpq_synthetic-wave-feature-pilot_pp",
          JSON.stringify([
            {
              id: "synthetic-queued-identity",
              flushAfter: 0,
              payload: {
                $token: "synthetic-wave-feature-pilot",
                $distinct_id: "529",
                $set_once: {
                  fixture_trait: "recovered",
                  $initial_referrer: "https://example.test/private-handle",
                  initial_utm_source: "private-campaign-source",
                  initial_utm_campaign: "private-campaign-name",
                },
              },
            },
          ])
        );
      }
    }
  });
});

test("identity transports preserve explicit traits and strip recovered SDK attribution", async ({
  page,
}) => {
  for (const transport of ["batch", "direct"]) {
    await page.request.get("/clear");
    await page.goto(`/waves/private-wave?transport=${transport}&people=1`);
    await page
      .getByRole("button", { name: "Enable synthetic telemetry" })
      .click();
    await page.evaluate(() => window.featureFixture.updateTraits());
    await expect
      .poll(async () =>
        (await peopleUpdates(page)).some(
          (update) => update.$set?.["fixture_trait"] === "allowed"
        )
      )
      .toBe(true);
    if (transport === "batch") {
      await expect
        .poll(async () =>
          (await peopleUpdates(page)).some(
            (update) => update.$set_once?.["fixture_trait"] === "recovered"
          )
        )
        .toBe(true);
    }
    for (const update of await peopleUpdates(page)) {
      expect(update.$token).toBe("synthetic-wave-feature-pilot");
      expect(update.$distinct_id).toBe("529");
      expect(JSON.stringify(update)).not.toContain("private-handle");
      expect(JSON.stringify(update)).not.toContain("private-campaign");
      expect(update.$set_once ?? {}).not.toHaveProperty("$initial_referrer");
      expect(update.$set_once ?? {}).not.toHaveProperty("initial_utm_source");
      expect(update.$set_once ?? {}).not.toHaveProperty("initial_utm_campaign");
    }
    await page.request.get("/clear");
    await page.evaluate((mode) => {
      if (mode === "batch") window.featureFixture.updateTraits();
      document.cookie = "performance-cookies-consent=; Max-Age=0; path=/";
      if (mode === "direct") window.featureFixture.updateTraits();
    }, transport);
    // Prove non-delivery across two 300ms batch flush intervals.
    await page.waitForTimeout(700);
    expect(await peopleUpdates(page)).toEqual([]);
  }
});

test("recovered identity batches are dropped if consent disappears before startup flush", async ({
  page,
}) => {
  await page.goto("/waves/private-wave?transport=batch&people=1");
  await page.evaluate(() => {
    window.featureFixture.enable();
    document.cookie = "performance-cookies-consent=; Max-Age=0; path=/";
  });
  await page.waitForTimeout(1200);
  expect(await peopleUpdates(page)).toEqual([]);
  await page.evaluate(() => {
    document.cookie = "performance-cookies-consent=true; path=/";
    window.featureFixture.lateEvent();
  });
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "chat")).length
    )
    .toBe(1);
  await page.waitForTimeout(400);
  expect(await peopleUpdates(page)).toEqual([]);
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
        token: "synthetic-wave-feature-pilot",
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
      expect(event.properties["token"]).toBe("synthetic-wave-feature-pilot");
      expect(event.properties).not.toHaveProperty("$current_url");
      expect(event.properties).not.toHaveProperty("$referrer");
      expect(event.properties).not.toHaveProperty("$initial_referrer");
      expect(event.properties).not.toHaveProperty("mp_keyword");
      expect(event.properties).not.toHaveProperty("utm_term");
      if (event.event.startsWith("Wave Feature")) {
        expect(event.properties["$lib_version"]).toBe("2.76.0");
        expect(JSON.stringify(event)).not.toMatch(
          /private-(?:wave|wallet|handle|content)|raw_path|profile_handle/
        );
        expect(event.properties["route_family"]).toBe("/waves/:waveId");
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
    (await events(page))
      .filter((event) => event.event === "Wave Feature Activated")
      .map((event) => event.properties["value"])
  ).toEqual(isMobile ? ["menu"] : []);
});

test("dropdown entry activation is independent from choosing a portal sort", async ({
  page,
  isMobile,
}) => {
  await page.goto("/waves/private-wave?dropdown=1");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  const trigger = page.getByRole("button", { name: "Sort: Current Vote" });
  if (isMobile) await trigger.tap();
  else await trigger.click();
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "menu")).length
    )
    .toBe(1);
  const [opened] = await featureEvents(page, "Wave Feature Activated", "menu");
  expect(opened?.properties).toMatchObject({
    action: "open",
    feature: "leaderboard_sort",
    placement: "leaderboard_dropdown",
  });
  if (isMobile) await page.getByRole("button", { name: "Close panel" }).tap();
  else await trigger.click();
  const initialActions = isMobile ? ["open"] : ["open", "collapse"];
  await expect(
    page.getByRole("menuitem", { name: "Newest", exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("CHAT:RANK");
  expect(
    (await events(page))
      .filter((event) => event.event === "Wave Feature Activated")
      .map((event) => event.properties["value"])
  ).toEqual(initialActions.map(() => "menu"));
  expect(
    (await featureEvents(page, "Wave Feature Activated", "menu")).map(
      (event) => event.properties["action"]
    )
  ).toEqual(initialActions);
  if (isMobile) await trigger.tap();
  else await trigger.click();
  const choice = page.getByRole("menuitem", { name: "Newest", exact: true });
  if (isMobile) await choice.tap();
  else await choice.click();
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "created_at"))
          .length
    )
    .toBe(1);
  expect(
    (await featureEvents(page, "Wave Feature Activated", "menu")).map(
      (event) => event.properties["action"]
    )
  ).toEqual([...initialActions, "open"]);
  expect(
    await featureEvents(page, "Wave Feature Seen", "created_at")
  ).toHaveLength(1);
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("CHAT:CREATED_AT");
});

test("logout clears persisted identity without consent before anonymous delivery resumes", async ({
  page,
}) => {
  for (const transport of ["batch", "direct"] as const) {
    await enableIdentifiedAnalytics(page, transport);
    await page.evaluate(() => {
      document.cookie = "performance-cookies-consent=; Max-Age=0; path=/";
      window.featureFixture.logout();
    });
    const identity = await page.evaluate(() => {
      const persisted = localStorage.getItem(
        "mp_synthetic-wave-feature-pilot_mixpanel"
      );
      return persisted ? JSON.parse(persisted).distinct_id : null;
    });
    expect(identity).toMatch(/^\$device:/);
    await page.request.get("/clear");
    await page.evaluate(() => {
      document.cookie = "performance-cookies-consent=true; path=/";
      window.featureFixture.lateEvent();
    });
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Activated", "chat")).length
      )
      .toBe(1);
    const [guest] = await featureEvents(page, "Wave Feature Activated", "chat");
    expect(guest?.properties["distinct_id"]).toBe(identity);
    expect(guest?.properties["$user_id"]).not.toBe("529");
  }
});

test("failed logout reset keeps SDK delivery closed until anonymous reset succeeds", async ({
  page,
}) => {
  for (const transport of ["batch", "direct"] as const) {
    await enableIdentifiedAnalytics(page, transport);
    await page.evaluate(() => {
      window.featureFixture.failResetTwice();
      window.featureFixture.logout();
    });
    await page.request.get("/clear");
    await page.evaluate(() => {
      window.featureFixture.lateEvent();
      window.featureFixture.resumeAnalytics();
      window.featureFixture.lateEvent();
    });
    await visibleTab(page, "Winners").click();
    await expect(
      page.getByRole("status", { name: "Selected fixture state" })
    ).toHaveText("WINNERS:RANK");
    // No delivery during dwell or multiple batch flush intervals after both failures.
    await page.waitForTimeout(1200);
    expect(await events(page)).toHaveLength(0);
    expect(await peopleUpdates(page)).toHaveLength(0);
    await page.evaluate(() => {
      window.featureFixture.resumeAnalytics();
      window.featureFixture.lateEvent();
    });
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Activated", "chat")).length
      )
      .toBe(1);
    const [guest] = await featureEvents(page, "Wave Feature Activated", "chat");
    expect(guest?.properties["distinct_id"]).toMatch(/^\$device:/);
    expect(guest?.properties["$user_id"]).not.toBe("529");
    expect(
      (await events(page)).some(
        (event) => event.properties["distinct_id"] === "529"
      )
    ).toBe(false);
  }
});

test("failed profile switching closes real SDK delivery until identity setup succeeds", async ({
  page,
}) => {
  for (const transport of ["batch", "direct"] as const) {
    await enableIdentifiedAnalytics(page, transport);
    expect(
      await page.evaluate(() => {
        window.featureFixture.failIdentityOnce();
        return window.featureFixture.switchProfile("530");
      })
    ).toBe(false);
    await page.request.get("/clear");
    await page.evaluate(() => window.featureFixture.lateEvent());
    await visibleTab(page, "Winners").click();
    await expect(
      page.getByRole("status", { name: "Selected fixture state" })
    ).toHaveText("WINNERS:RANK");
    await page.waitForTimeout(1200);
    expect(await events(page)).toHaveLength(0);
    expect(await peopleUpdates(page)).toHaveLength(0);

    expect(
      await page.evaluate(() => {
        window.featureFixture.resumeAnalytics();
        return window.featureFixture.switchProfile("530");
      })
    ).toBe(true);
    await page.evaluate(() => window.featureFixture.lateEvent());
    await expect
      .poll(async () =>
        (await featureEvents(page, "Wave Feature Activated", "chat")).some(
          (event) => event.properties["distinct_id"] === "530"
        )
      )
      .toBe(true);
    expect(
      (await events(page)).some(
        (event) => event.properties["distinct_id"] === "529"
      )
    ).toBe(false);
  }
});

test("a chat-only Wave starts observing tabs that appear after content registration", async ({
  page,
}) => {
  await page.goto("/waves/private-wave?late-tabs=1");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await expect(visibleTab(page, "Chat")).toHaveCount(0);
  await page.evaluate(() => window.featureFixture.showTabs());
  await expect(visibleTab(page, "Chat")).toBeVisible();
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "chat")).length
    )
    .toBe(1);
  await visibleTab(page, "About").click();
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "about")).length
    )
    .toBe(1);
});

test("a failed direct Seen suppresses Activated until a later accepted exposure", async ({
  page,
}) => {
  for (const transport of ["batch", "direct"]) {
    await page.request.get("/clear");
    await page.goto(`/waves/private-wave?transport=${transport}`);
    await page.evaluate(() => window.featureFixture.failSeenOnce("winners"));
    await page
      .getByRole("button", { name: "Enable synthetic telemetry" })
      .click();
    await visibleTab(page, "Winners").click();
    await expect(
      page.getByRole("status", { name: "Selected fixture state" })
    ).toHaveText("WINNERS:RANK");
    await visibleTab(page, "Chat").click();
    await visibleTab(page, "Winners").click();
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Seen", "winners")).length
      )
      .toBe(1);
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Activated", "winners"))
            .length
      )
      .toBe(1);
  }
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

test("a visit reset with the same context cancels previously accumulated dwell", async ({
  page,
}) => {
  await page.goto("/waves/private-wave");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.featureFixture.resetVisit());
  await page.waitForTimeout(600);
  expect(await featureEvents(page, "Wave Feature Seen", "chat")).toHaveLength(
    0
  );
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "chat")).length
    )
    .toBe(1);
});

for (const [name, pathname, query, routeFamily] of [
  ["message drop", "/messages/private-wave", "drop", "/messages/:waveId"],
  ["Wave serial number", "/waves/private-wave", "serialNo", "/waves/:waveId"],
] as const) {
  test(`${name} navigation cancels dwell and starts fresh exposure visits`, async ({
    page,
  }) => {
    await page.goto(pathname);
    await page
      .getByRole("button", { name: "Enable synthetic telemetry" })
      .click();
    await page.waitForTimeout(600);
    await page.evaluate((query) => {
      history.pushState({}, "", `?${query}=private-drop-one`);
      window.dispatchEvent(new Event("resize"));
    }, query);
    // The former dwell would have elapsed; the new visit has only 600ms.
    await page.waitForTimeout(600);
    expect(await featureEvents(page, "Wave Feature Seen", "chat")).toHaveLength(
      0
    );
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Seen", "chat")).length
      )
      .toBe(1);
    await page.evaluate((query) => {
      history.pushState({}, "", `?${query}=private-drop-two`);
      window.dispatchEvent(new Event("resize"));
    }, query);
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Seen", "chat")).length
      )
      .toBe(2);
    await page.evaluate((pathname) => {
      history.pushState({}, "", pathname);
      window.dispatchEvent(new Event("resize"));
    }, pathname);
    await expect
      .poll(
        async () =>
          (await featureEvents(page, "Wave Feature Seen", "chat")).length
      )
      .toBe(3);
    const captured = (await events(page)).filter((event) =>
      event.event.startsWith("Wave Feature")
    );
    for (const event of captured)
      expect(event.properties["route_family"]).toBe(routeFamily);
    expect(JSON.stringify(captured)).not.toContain("private-wave");
    expect(JSON.stringify(captured)).not.toContain("private-drop");
  });
}

test("recommendation telemetry preserves active state before keyboard and pointer toggles", async ({
  page,
}) => {
  await page.goto("/waves/private-wave?recommendations=1");
  const link = page.getByRole("link", {
    name: "Open Synthetic recommendation",
    exact: true,
  });
  await expect(link).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("button", { name: "Enable synthetic telemetry" })
    .click();
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "recommendations_wave"))
          .length
    )
    .toBe(1);
  expect(
    (await featureEvents(page, "Wave Feature Seen", "recommendations_wave"))[0]
      ?.properties["selected"]
  ).toBe(true);
  await link.focus();
  await link.press("Enter");
  await expect(link).not.toHaveAttribute("aria-current");
  await expect
    .poll(
      async () =>
        (
          await featureEvents(
            page,
            "Wave Feature Activated",
            "recommendations_wave"
          )
        ).length
    )
    .toBe(1);
  expect(
    (
      await featureEvents(
        page,
        "Wave Feature Activated",
        "recommendations_wave"
      )
    )[0]?.properties["selected"]
  ).toBe(true);
  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page");
  await expect
    .poll(
      async () =>
        (
          await featureEvents(
            page,
            "Wave Feature Activated",
            "recommendations_wave"
          )
        ).length
    )
    .toBe(2);
  expect(
    (
      await featureEvents(
        page,
        "Wave Feature Activated",
        "recommendations_wave"
      )
    )[1]?.properties["selected"]
  ).toBe(false);
  expect(
    JSON.stringify(
      await featureEvents(
        page,
        "Wave Feature Activated",
        "recommendations_wave"
      )
    )
  ).not.toContain("private-recommendation");
});

test("rapid consent regrant waits for all real SDK queue deletions", async ({
  page,
}) => {
  await enableIdentifiedAnalytics(page, "batch");
  await page.request.get("/clear");
  await page.evaluate(async () => {
    await window.featureFixture.seedPendingQueues();
    window.featureFixture.holdQueueClears();
    window.featureFixture.revoke();
    window.featureFixture.enable();
    window.featureFixture.lateEvent();
    window.featureFixture.updateTraits();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.featureFixture.pendingQueueClears().length)
    )
    .toBe(3);
  await visibleTab(page, "Winners").click();
  await expect(
    page.getByRole("status", { name: "Selected fixture state" })
  ).toHaveText("WINNERS:RANK");
  // No delivery through several flush intervals while deletion is pending.
  await page.waitForTimeout(1200);
  expect(await events(page)).toEqual([]);
  expect(await peopleUpdates(page)).toEqual([]);
  expect(
    await page.evaluate(async () => (await fetch("/groups")).json())
  ).toEqual([]);
  await page.evaluate(() => {
    window.featureFixture.releaseQueueClear("events");
    window.featureFixture.releaseQueueClear("people");
    window.featureFixture.resumeAnalytics();
    window.featureFixture.lateEvent();
  });
  await page.waitForTimeout(700);
  expect(await events(page)).toEqual([]);
  await page.evaluate(() => window.featureFixture.releaseQueueClear("groups"));
  await expect
    .poll(() =>
      page.evaluate(() =>
        ["ev", "pp", "gr"].every(
          (kind) =>
            localStorage.getItem(
              `__mpq_synthetic-wave-feature-pilot_${kind}`
            ) === null
        )
      )
    )
    .toBe(true);
  await page.evaluate(() => {
    window.featureFixture.enable();
    window.featureFixture.lateEvent();
    window.featureFixture.updateTraits();
  });
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "chat")).length
    )
    .toBe(1);
  await expect
    .poll(async () =>
      (await peopleUpdates(page)).some(
        (update) => update.$set?.["fixture_trait"] === "allowed"
      )
    )
    .toBe(true);
  expect(JSON.stringify(await events(page))).not.toContain("withdrawn");
  expect(JSON.stringify(await peopleUpdates(page))).not.toContain("withdrawn");
  expect(
    await page.evaluate(async () => (await fetch("/groups")).json())
  ).toEqual([]);
});

test("failed real SDK persisted deletion stays closed until clearing succeeds", async ({
  page,
}) => {
  await enableIdentifiedAnalytics(page, "batch");
  await page.request.get("/clear");
  await page.evaluate(async () => {
    await window.featureFixture.seedPendingQueues();
    window.featureFixture.failQueueClearOnce();
    window.featureFixture.revoke();
    window.featureFixture.enable();
    window.featureFixture.lateEvent();
  });
  await page.waitForTimeout(1200);
  expect(await events(page)).toEqual([]);
  expect(await peopleUpdates(page)).toEqual([]);
  await page.evaluate(() => {
    window.featureFixture.resumeAnalytics();
    window.featureFixture.lateEvent();
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("__mpq_synthetic-wave-feature-pilot_ev")
      )
    )
    .toBeNull();
  await page.evaluate(() => {
    window.featureFixture.enable();
    window.featureFixture.lateEvent();
  });
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Activated", "chat")).length
    )
    .toBe(1);
  expect(JSON.stringify(await events(page))).not.toContain("withdrawn");
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
  await page
    .getByRole("region", { name: "Wave discovery", exact: true })
    .evaluate((element) => {
      const scroller = element.parentElement;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
  await expect
    .poll(
      async () =>
        (await featureEvents(page, "Wave Feature Seen", "active_votes_wave"))
          .length
    )
    .toBe(1);
  await page
    .getByRole("region", { name: "Active voting waves", exact: true })
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
