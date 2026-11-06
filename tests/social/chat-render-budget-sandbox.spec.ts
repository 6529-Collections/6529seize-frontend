import type { Page, TestInfo } from "@playwright/test";
import { expect, test } from "../testHelpers";
import {
  armChatPerf,
  installChatPerfProbe,
  longTasksBetween,
  percentile,
  readChatPerf,
  rowLatencies,
  summarizeChatPerfWindow,
  trackApiRequests,
  type ApiRequestTracker,
  type ChatPerfSnapshot,
} from "../support/chatPerf";
import {
  installChatPerfFixture,
  PERF_OPEN_WAVE_INDEX,
  PERF_OTHER_WAVE_INDEX,
  perfMessageText,
  perfWaveName,
  type ChatPerfFixture,
} from "../support/chatPerfFixture";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

/**
 * Chat render budget (WAVES-PLAN Phase 0 item 0.1, Appendix A and B).
 *
 * Measures, per received message: components re-rendered, components
 * mounted, React commits and API requests; plus receive-to-row latency,
 * long tasks during a 50-message burst and own send-to-render time. Every
 * test attaches its numbers as `chat-perf-*.json`.
 *
 * CI asserts the render and request budgets on the development sandbox.
 * Lower each budget as Phase 0 PRs land; the Phase 0 target is fewer than 5
 * re-renders and 0 requests per message. PR numbers come from a production
 * build (see tests/README.md, "Chat render budget").
 */

// Production CSP rejects the plain-HTTP fixture API; this opt-in covers the
// production bundle only, with the loopback and mutation guards still active.
test.use({
  bypassCSP:
    process.env["PLAYWRIGHT_CHAT_PERF_PRODUCTION_SANDBOX"] === "1" &&
    process.env["PLAYWRIGHT_AUTH_SANDBOX"] === "1" &&
    process.env["PLAYWRIGHT_ENV"] === "local",
});

const MESSAGES = 20;
const MESSAGE_INTERVAL_MS = 200;
const BURST_MESSAGES = 50;
const BURST_INTERVAL_MS = 20;
const IDLE_SAMPLE_MS = 2000;
// Long enough for the trailing work a message starts (newest-drops fetch,
// read marker, list refetch cooldowns) to land inside the window.
const SETTLE_MS = 3500;
// Report-only runs (for before/after tables) skip the budget assertions.
const REPORT_ONLY = process.env["PLAYWRIGHT_CHAT_PERF_REPORT_ONLY"] === "1";
// Per-component counts (names are minified in production builds).
const REPORT_NAMES = process.env["PLAYWRIGHT_CHAT_PERF_NAMES"] === "1";

function topNames(
  before: ChatPerfSnapshot,
  after: ChatPerfSnapshot,
  messages: number
): Record<string, number> | undefined {
  if (!after.names) return undefined;
  return Object.fromEntries(
    Object.entries(after.names)
      .map(
        ([name, count]) =>
          [name, (count - (before.names?.[name] ?? 0)) / messages] as const
      )
      .filter(([, perMessage]) => perMessage > 0)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 40)
      .map(([name, perMessage]) => [name, Math.round(perMessage * 10) / 10])
  );
}

/**
 * Upper bounds per received message on the development sandbox: about twice
 * the highest of several runs on main on 2026-11-06, because render counts
 * move with how the work lands in frames (renders: open wave 2,279-3,507
 * desktop / 2,700 phone; another wave 269-313 / 8; wave list 114-130 / 126.
 * Requests: 5.4-7.2, 0.5-2.4, 0.1). Each Phase 0 PR that lowers a number
 * lowers its budget here. Phase 0 target: < 5 renders and 0 requests.
 */
const BUDGETS = {
  openWave: { renders: 7000, requests: 14 },
  otherWave: { renders: 650, requests: 5 },
  waveList: { renders: 260, requests: 1 },
} as const;

type Scenario = keyof typeof BUDGETS | "burst";

async function attachNumbers(
  testInfo: TestInfo,
  scenario: Scenario | "send",
  numbers: Record<string, unknown>
) {
  const body = JSON.stringify(
    { scenario, project: testInfo.project.name, ...numbers },
    null,
    2
  );
  // A single line per scenario so CI logs carry the numbers too.
  console.log(
    `chat-perf ${scenario} ${testInfo.project.name} ${JSON.stringify(numbers)}`
  );
  await testInfo.attach(`chat-perf-${scenario}.json`, {
    body,
    contentType: "application/json",
  });
}

async function idleRendersPerSecond(page: Page): Promise<number> {
  const start = await readChatPerf(page);
  await page.waitForTimeout(IDLE_SAMPLE_MS);
  const end = await readChatPerf(page);
  return ((end.renders - start.renders) * 1000) / (end.now - start.now);
}

async function measure({
  page,
  fixture,
  tracker,
  waveIndex,
  messages,
  intervalMs,
}: {
  readonly page: Page;
  readonly fixture: ChatPerfFixture;
  readonly tracker: ApiRequestTracker;
  readonly waveIndex: number;
  readonly messages: number;
  readonly intervalMs: number;
}) {
  await armChatPerf(page, { trackRows: true, names: REPORT_NAMES });
  const idleRate = await idleRendersPerSecond(page);
  tracker.reset();
  const before = await readChatPerf(page);
  await fixture.send(waveIndex, messages, intervalMs);
  await page.waitForTimeout(SETTLE_MS);
  const after = await readChatPerf(page);
  const summary = summarizeChatPerfWindow({
    messages,
    durationMs: after.now - before.now,
    renders: after.renders - before.renders,
    mounts: after.mounts - before.mounts,
    commits: after.commits - before.commits,
    requests: tracker.requests(),
    idleRendersPerSecond: idleRate,
  });
  const { toRowMs, toFrameMs } = rowLatencies(after);
  return {
    before,
    after,
    summary,
    idleRendersPerSecond: Math.round(idleRate * 10) / 10,
    receivedFrames: after.framesReceived - before.framesReceived,
    receiveToRowP50Ms: percentile(toRowMs, 50),
    receiveToFrameP50Ms: percentile(toFrameMs, 50),
    receiveToFrameP95Ms: percentile(toFrameMs, 95),
    longTasks: longTasksBetween(after, before.now, after.now),
    perMessageByComponent: topNames(before, after, messages),
  };
}

function expectProbeWorking(snapshot: ChatPerfSnapshot) {
  expect(snapshot.hookInstalled, "React did not attach to the probe hook").toBe(
    true
  );
  expect(snapshot.walkErrors).toBe(0);
  expect(snapshot.commits).toBeGreaterThan(0);
}

async function openWaveList(page: Page) {
  await page.goto("/waves", { waitUntil: "domcontentloaded" });
  await expect(
    page
      .getByRole("link", {
        name: perfWaveName(PERF_OPEN_WAVE_INDEX),
        exact: true,
      })
      .first()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await dismissNextDevTools(page);
}

async function openPerfWave(page: Page) {
  await openWaveList(page);
  // A client-side open, like a user's: the document load stays on /waves.
  await page
    .getByRole("link", {
      name: perfWaveName(PERF_OPEN_WAVE_INDEX),
      exact: true,
    })
    .first()
    .click();
  await expect(
    page.getByText(perfMessageText(40), { exact: true }).last()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
}

test.describe("Chat render budget @auth @local-only", () => {
  test.describe.configure({ mode: "serial" });
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "The chat render budget requires the isolated local mock API."
  );

  let fixture: ChatPerfFixture;
  let tracker: ApiRequestTracker;

  test.beforeEach(async ({ page, baseURL }) => {
    await installChatPerfProbe(page);
    fixture = await installChatPerfFixture(page, baseURL);
    tracker = trackApiRequests(page, getSandboxApiOrigin(baseURL));
  });

  test.afterEach(async ({ page }) => {
    tracker.dispose();
    await page.unrouteAll({ behavior: "wait" });
  });

  test("an incoming message in the open wave", async ({ page }, testInfo) => {
    await openPerfWave(page);
    await fixture.waitForSockets();
    await page.waitForTimeout(1500);
    const result = await measure({
      page,
      fixture,
      tracker,
      waveIndex: PERF_OPEN_WAVE_INDEX,
      messages: MESSAGES,
      intervalMs: MESSAGE_INTERVAL_MS,
    });
    expectProbeWorking(result.after);
    // Every injected message reached the app and rendered its row.
    await expect(
      page.getByText(perfMessageText(40 + MESSAGES), { exact: true }).last()
    ).toBeVisible();
    expect(result.receivedFrames).toBeGreaterThanOrEqual(MESSAGES);
    await attachNumbers(testInfo, "openWave", {
      ...result.summary,
      idleRendersPerSecond: result.idleRendersPerSecond,
      receivedFrames: result.receivedFrames,
      perMessageByComponent: result.perMessageByComponent,
      receiveToRowP50Ms: result.receiveToRowP50Ms,
      receiveToFrameP50Ms: result.receiveToFrameP50Ms,
      receiveToFrameP95Ms: result.receiveToFrameP95Ms,
    });
    if (REPORT_ONLY) return;
    expect(result.summary.rendersPerMessage).toBeLessThanOrEqual(
      BUDGETS.openWave.renders
    );
    expect(result.summary.requestsPerMessage).toBeLessThanOrEqual(
      BUDGETS.openWave.requests
    );
  });

  test("an incoming message in another wave while a wave is open", async ({
    page,
  }, testInfo) => {
    await openPerfWave(page);
    await fixture.waitForSockets();
    await page.waitForTimeout(1500);
    const result = await measure({
      page,
      fixture,
      tracker,
      waveIndex: PERF_OTHER_WAVE_INDEX,
      messages: MESSAGES,
      intervalMs: MESSAGE_INTERVAL_MS,
    });
    expectProbeWorking(result.after);
    expect(result.receivedFrames).toBeGreaterThanOrEqual(MESSAGES);
    await attachNumbers(testInfo, "otherWave", {
      ...result.summary,
      idleRendersPerSecond: result.idleRendersPerSecond,
      receivedFrames: result.receivedFrames,
      perMessageByComponent: result.perMessageByComponent,
    });
    if (REPORT_ONLY) return;
    expect(result.summary.rendersPerMessage).toBeLessThanOrEqual(
      BUDGETS.otherWave.renders
    );
    expect(result.summary.requestsPerMessage).toBeLessThanOrEqual(
      BUDGETS.otherWave.requests
    );
  });

  test("an incoming message on the wave list", async ({ page }, testInfo) => {
    await openWaveList(page);
    await fixture.waitForSockets();
    await page.waitForTimeout(1500);
    const result = await measure({
      page,
      fixture,
      tracker,
      waveIndex: PERF_OTHER_WAVE_INDEX,
      messages: MESSAGES,
      intervalMs: MESSAGE_INTERVAL_MS,
    });
    expectProbeWorking(result.after);
    expect(result.receivedFrames).toBeGreaterThanOrEqual(MESSAGES);
    await attachNumbers(testInfo, "waveList", {
      ...result.summary,
      idleRendersPerSecond: result.idleRendersPerSecond,
      receivedFrames: result.receivedFrames,
      perMessageByComponent: result.perMessageByComponent,
    });
    if (REPORT_ONLY) return;
    expect(result.summary.rendersPerMessage).toBeLessThanOrEqual(
      BUDGETS.waveList.renders
    );
    expect(result.summary.requestsPerMessage).toBeLessThanOrEqual(
      BUDGETS.waveList.requests
    );
  });

  test("a burst of 50 messages in the open wave", async ({
    page,
  }, testInfo) => {
    await openPerfWave(page);
    await fixture.waitForSockets();
    await page.waitForTimeout(1500);
    const result = await measure({
      page,
      fixture,
      tracker,
      waveIndex: PERF_OPEN_WAVE_INDEX,
      messages: BURST_MESSAGES,
      intervalMs: BURST_INTERVAL_MS,
    });
    expectProbeWorking(result.after);
    await expect(
      page
        .getByText(perfMessageText(40 + BURST_MESSAGES), { exact: true })
        .last()
    ).toBeVisible();
    // Long tasks are reported, not asserted: development builds are slower.
    await attachNumbers(testInfo, "burst", {
      ...result.summary,
      receivedFrames: result.receivedFrames,
      perMessageByComponent: result.perMessageByComponent,
      receiveToFrameP50Ms: result.receiveToFrameP50Ms,
      receiveToFrameP95Ms: result.receiveToFrameP95Ms,
      longTasks: result.longTasks,
    });
  });

  test("own message send to render", async ({ page }, testInfo) => {
    const content = "Own perf message from the composer";
    await openPerfWave(page);
    await fixture.waitForSockets();
    const composer = page
      .getByRole("textbox", { name: "Write a message" })
      .last();
    await expect(composer).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await composer.fill(content);
    const post = page.getByRole("button", { name: "Post" }).last();
    await expect(post).toBeEnabled();
    await page.waitForTimeout(1500);
    await armChatPerf(page, {
      trackRows: true,
      submitLabel: "Post",
      ownText: content,
      names: REPORT_NAMES,
    });
    tracker.reset();
    const before = await readChatPerf(page);
    if (testInfo.project.use.isMobile) await post.tap();
    else await post.click();
    await expect
      .poll(async () => (await readChatPerf(page)).ownFrameAt, {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      })
      .not.toBeNull();
    await page.waitForTimeout(SETTLE_MS);
    const after = await readChatPerf(page);
    expectProbeWorking(after);
    expect(after.submitAt).not.toBeNull();
    const requests = tracker.requests();
    expect(
      requests.filter((request) => request === "POST /api/drops")
    ).toHaveLength(1);
    await expect(page.getByText(content, { exact: true }).last()).toBeVisible();
    await attachNumbers(testInfo, "send", {
      submitToRowMs: Math.round(after.ownRenderAt! - after.submitAt!),
      submitToFrameMs: Math.round(after.ownFrameAt! - after.submitAt!),
      renders: after.renders - before.renders,
      mounts: after.mounts - before.mounts,
      requestsAfterSend: requests.length,
      requests,
      perMessageByComponent: topNames(before, after, 1),
    });
  });
});
