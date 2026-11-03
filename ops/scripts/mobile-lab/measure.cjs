#!/usr/bin/env node
"use strict";

// Phone-emulated load measurement of public 6529.io pages (mobile plan,
// stage 0). Chromium in Pixel 7 emulation with CPU throttling and a DevTools
// network profile, signed out: per page, cold loads in fresh contexts, then
// one warm reload and an idle window in the last context. No clicks, no
// sign-in, no consent choice. See README.md in this folder.

const fs = require("node:fs");
const path = require("node:path");
const { chromium, devices } = require("playwright");
const { parseArgs } = require("../cli-args.cjs");

const PAGES = {
  home: "/",
  waves: "/waves",
  meme: "/the-memes/1",
  museum: "/museum",
};

// Chrome DevTools presets (bytes per second, milliseconds).
const NETWORKS = {
  fast4g: {
    latency: 60 * 2.75,
    downloadThroughput: ((9 * 1000 * 1000) / 8) * 0.9,
    uploadThroughput: ((1.5 * 1000 * 1000) / 8) * 0.9,
  },
  slow4g: {
    latency: 150 * 3.75,
    downloadThroughput: ((1.6 * 1000 * 1000) / 8) * 0.9,
    uploadThroughput: ((0.75 * 1000 * 1000) / 8) * 0.9,
  },
};

const STAGING_HOSTNAME = "staging.6529.io";
const STAGING_ACCESS_COOKIE_NAME = "x-6529-auth";

const PERF_INIT_SCRIPT = `
(() => {
  const s = (window.__labPerf = { lcp: [], lt: [], paint: [], cls: 0 });
  const observe = (type, cb) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(cb)).observe({ type, buffered: true });
    } catch (e) {}
  };
  observe('largest-contentful-paint', (e) => s.lcp.push({ t: e.startTime, size: e.size, tag: e.element ? e.element.tagName : null, url: e.url || null }));
  observe('longtask', (e) => s.lt.push({ s: e.startTime, d: e.duration }));
  observe('paint', (e) => s.paint.push({ n: e.name, t: e.startTime }));
  observe('layout-shift', (e) => { if (!e.hadRecentInput) s.cls += e.value; });
})();
`;

function readOptions(argv) {
  const args = parseArgs(argv);
  const base = new URL(String(args.base || "https://6529.io"));
  const network = String(args.net || "fast4g");
  if (!NETWORKS[network]) {
    throw new Error(
      `Unknown --net ${network}; use ${Object.keys(NETWORKS).join(" or ")}.`
    );
  }
  const pages = String(args.pages || Object.keys(PAGES).join(","))
    .split(",")
    .filter(Boolean);
  for (const key of pages) {
    if (!PAGES[key]) {
      throw new Error(
        `Unknown page ${key}; use ${Object.keys(PAGES).join(", ")}.`
      );
    }
  }
  return {
    base,
    pages,
    network,
    cpu: Number(args.cpu ?? 4),
    cold: Number(args.cold ?? 3),
    warm: Number(args.warm ?? 1),
    idleSeconds: Number(args.idle ?? 60),
    coverage: new Set(
      String(args.coverage || "")
        .split(",")
        .filter(Boolean)
    ),
    outDir: path.resolve(String(args["out-dir"] || "tmp/mobile-lab")),
  };
}

function hostClass(url, baseHost) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return "other";
  }
  if (host === baseHost || host === `www.${baseHost}`) return "site";
  return host;
}

function typeOf(request) {
  const type = (request.type || "").toLowerCase();
  const map = {
    script: "js",
    stylesheet: "css",
    image: "img",
    font: "font",
    document: "doc",
    media: "media",
    fetch: "api",
    xhr: "api",
    websocket: "ws",
  };
  return map[type] || type || "other";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function instrument(context, page, options) {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Performance.enable", { timeDomain: "timeTicks" });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: options.cpu });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    connectionType: "cellular4g",
    ...NETWORKS[options.network],
  });
  const log = { requests: new Map(), lastActivity: Date.now(), inflight: 0 };
  cdp.on("Network.requestWillBeSent", (event) => {
    if (!log.requests.has(event.requestId)) log.inflight++;
    log.requests.set(event.requestId, {
      ...log.requests.get(event.requestId),
      url: event.request.url,
      type: event.type,
      startWall: Date.now(),
      enc: 0,
      dec: 0,
    });
    log.lastActivity = Date.now();
  });
  cdp.on("Network.responseReceived", (event) => {
    const request = log.requests.get(event.requestId);
    if (!request) return;
    const headers = Object.fromEntries(
      Object.entries(event.response.headers || {}).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ])
    );
    request.status = event.response.status;
    request.fromCache =
      request.fromCache ||
      Boolean(
        event.response.fromDiskCache ||
        event.response.fromMemoryCache ||
        event.response.fromPrefetchCache
      );
    request.cacheControl = headers["cache-control"] || null;
    request.type = event.type || request.type;
  });
  cdp.on("Network.requestServedFromCache", (event) => {
    const request = log.requests.get(event.requestId);
    if (request) request.fromCache = true;
  });
  cdp.on("Network.dataReceived", (event) => {
    const request = log.requests.get(event.requestId);
    if (request) request.dec += event.dataLength;
    log.lastActivity = Date.now();
  });
  const finish = (event, failed) => {
    const request = log.requests.get(event.requestId);
    if (!request) return;
    if (!request.done) log.inflight = Math.max(0, log.inflight - 1);
    request.done = true;
    if (failed) request.failed = true;
    else request.enc = event.encodedDataLength;
    log.lastActivity = Date.now();
  };
  cdp.on("Network.loadingFinished", (event) => finish(event, false));
  cdp.on("Network.loadingFailed", (event) => finish(event, true));
  return { cdp, log };
}

function summarizeRequests(list, baseHost) {
  const byType = {};
  const byHost = {};
  let enc = 0;
  let dec = 0;
  let cached = 0;
  for (const request of list) {
    const type = typeOf(request);
    byType[type] ??= { n: 0, enc: 0, dec: 0 };
    byType[type].n++;
    byType[type].enc += request.enc || 0;
    byType[type].dec += request.dec || 0;
    const host = hostClass(request.url, baseHost);
    byHost[host] ??= { n: 0, enc: 0 };
    byHost[host].n++;
    byHost[host].enc += request.enc || 0;
    enc += request.enc || 0;
    dec += request.dec || 0;
    if (request.fromCache) cached++;
  }
  return { n: list.length, enc, dec, cached, byType, byHost };
}

async function settle(page, log, capMs) {
  // Settled after 5 s without a long task and 2 s with at most two requests
  // in flight, capped.
  const start = Date.now();
  while (Date.now() - start < capMs) {
    await sleep(500);
    const state = await page.evaluate(() => {
      const perf = window.__labPerf || { lt: [] };
      const lastLongTask = perf.lt.reduce(
        (max, task) => Math.max(max, task.s + task.d),
        0
      );
      return { now: performance.now(), lastLongTask };
    });
    const quietMain = state.now - state.lastLongTask >= 5000;
    const quietNetwork =
      log.inflight <= 2 && Date.now() - log.lastActivity >= 2000;
    if (quietMain && quietNetwork)
      return { capped: false, waitedMs: Date.now() - start };
  }
  return { capped: true, waitedMs: Date.now() - start };
}

async function cdpMetrics(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(
    metrics.map((metric) => [metric.name, metric.value])
  );
}

function coverageSummary(entries) {
  let total = 0;
  let used = 0;
  const files = [];
  for (const entry of entries) {
    if (!entry.url || !entry.source) continue;
    const length = entry.source.length;
    const marks = new Uint8Array(length);
    for (const fn of entry.functions) {
      for (const range of fn.ranges) {
        marks.fill(
          range.count > 0 ? 1 : 0,
          range.startOffset,
          Math.min(range.endOffset, length)
        );
      }
    }
    let usedChars = 0;
    for (let i = 0; i < length; i++) usedChars += marks[i];
    total += length;
    used += usedChars;
    files.push({
      url: entry.url.replace(/^https?:\/\//, "").slice(0, 120),
      length,
      used: usedChars,
    });
  }
  files.sort((a, b) => b.length - a.length);
  return {
    totalChars: total,
    usedChars: used,
    unusedPct: total ? Number((100 * (1 - used / total)).toFixed(1)) : null,
    top: files.slice(0, 15),
  };
}

async function measureLoad({ page, cdp, log, url, label, coverage, baseHost }) {
  log.requests.clear();
  log.inflight = 0;
  if (coverage)
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
  const startWall = Date.now();
  let response;
  let navigationError = null;
  try {
    response = await page.goto(url, { waitUntil: "load", timeout: 120000 });
  } catch (error) {
    navigationError = String(error.message || error).slice(0, 300);
  }
  const settled = await settle(page, log, 45000);
  // An access-gate redirect would be measured as if it were the page.
  if (!navigationError && new URL(page.url()).pathname.startsWith("/access")) {
    navigationError = `Redirected to the access gate: ${new URL(page.url()).pathname}`;
  }
  const perf = await page.evaluate(() => {
    const s = window.__labPerf || { lcp: [], lt: [], paint: [], cls: 0 };
    const nav = performance.getEntriesByType("navigation")[0] || {};
    return {
      lcp: s.lcp,
      lt: s.lt,
      paint: s.paint,
      cls: s.cls,
      ttfb: nav.responseStart,
      finalUrl: location.href,
      domNodes: document.getElementsByTagName("*").length,
    };
  });
  const fcp =
    perf.paint.find((p) => p.n === "first-contentful-paint")?.t ?? null;
  const lcpEntry = perf.lcp.length ? perf.lcp[perf.lcp.length - 1] : null;
  const longTasksAfterFcp = perf.lt.filter(
    (task) => fcp === null || task.s >= fcp
  );
  const tbt = longTasksAfterFcp.reduce(
    (sum, task) => sum + Math.max(0, task.d - 50),
    0
  );
  const metricsBeforeGc = await cdpMetrics(cdp);
  await cdp.send("HeapProfiler.enable").catch(() => {});
  await cdp.send("HeapProfiler.collectGarbage").catch(() => {});
  const metricsAfterGc = await cdpMetrics(cdp);
  let html = null;
  try {
    if (response) {
      const body = await response.text();
      const inlineRsc = (
        body.match(/self\.__next_f\.push\(\[[\s\S]*?\]\)<\/script>/g) || []
      ).reduce((sum, chunk) => sum + chunk.length, 0);
      html = { decoded: body.length, inlineRsc, status: response.status() };
    }
  } catch {
    html = null;
  }
  const coverageResult = coverage
    ? coverageSummary(await page.coverage.stopJSCoverage())
    : null;
  const list = [...log.requests.values()];
  // Scripts requested before first paint: what the HTML asks for up front,
  // close to the route's first-load JavaScript. Navigation start is
  // approximated by the goto call.
  const beforeFcp =
    fcp === null
      ? []
      : list.filter((r) => !r.failed && r.startWall - startWall <= fcp);
  const jsBeforeFcp = beforeFcp
    .filter((r) => typeOf(r) === "js")
    .reduce(
      (sum, r) => ({
        enc: sum.enc + (r.enc || 0),
        dec: sum.dec + (r.dec || 0),
      }),
      { enc: 0, dec: 0 }
    );
  return {
    label,
    url,
    navigationError,
    settle: settled,
    finalUrl: perf.finalUrl,
    ttfb: perf.ttfb,
    fcp,
    lcp: lcpEntry ? lcpEntry.t : null,
    lcpElement: lcpEntry
      ? {
          tag: lcpEntry.tag,
          size: lcpEntry.size,
          url: lcpEntry.url
            ? lcpEntry.url.replace(/^https?:\/\//, "").slice(0, 100)
            : null,
        }
      : null,
    tbt,
    longTasks: perf.lt.length,
    maxLongTask: perf.lt.reduce((max, task) => Math.max(max, task.d), 0),
    cls: perf.cls,
    domNodes: perf.domNodes,
    html,
    heap: {
      usedMB: Number((metricsBeforeGc.JSHeapUsedSize / 1048576).toFixed(1)),
      usedAfterGcMB: Number(
        (metricsAfterGc.JSHeapUsedSize / 1048576).toFixed(1)
      ),
    },
    jsBeforeFcp,
    net: summarizeRequests(list, baseHost),
    coverage: coverageResult,
    requests: list.map((r) => ({
      host: hostClass(r.url, baseHost),
      path: r.url
        .split("?")[0]
        .replace(/^[a-z]+:\/\/[^/]+/, "")
        .slice(0, 90),
      type: typeOf(r),
      status: r.status,
      enc: r.enc,
      dec: r.dec,
      cached: r.fromCache ? 1 : 0,
      failed: r.failed ? 1 : 0,
      startMs: r.startWall - startWall,
      cacheControl: r.cacheControl,
    })),
  };
}

async function idleWindow(log, seconds, baseHost) {
  log.requests.clear();
  const started = Date.now();
  await sleep(seconds * 1000);
  const list = [...log.requests.values()];
  const summary = summarizeRequests(list, baseHost);
  const endpoints = {};
  for (const request of list) {
    const key = `${hostClass(request.url, baseHost)} ${request.url
      .split("?")[0]
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/\/[0-9a-f-]{8,}|\/\d+/gi, "/:id")
      .slice(0, 80)}`;
    endpoints[key] = (endpoints[key] || 0) + 1;
  }
  const elapsed = (Date.now() - started) / 1000;
  return {
    seconds: elapsed,
    requests: summary.n,
    perMinute: Number(((summary.n * 60) / elapsed).toFixed(1)),
    encBytes: summary.enc,
    endpoints,
  };
}

async function newContext(browser, options) {
  const context = await browser.newContext({
    ...devices["Pixel 7"],
    locale: "en-US",
    timezoneId: "UTC",
  });
  const accessCode = stagingAccessCode();
  if (options.base.hostname === STAGING_HOSTNAME && accessCode) {
    await context.addCookies([
      {
        domain: STAGING_HOSTNAME,
        name: STAGING_ACCESS_COOKIE_NAME,
        path: "/",
        sameSite: "Strict",
        secure: true,
        value: accessCode,
      },
    ]);
  }
  await context.addInitScript(PERF_INIT_SCRIPT);
  return context;
}

async function readDeployedVersion(browser, options) {
  const context = await newContext(browser, options);
  try {
    const response = await context.request.get(
      new URL("/api/version", options.base).href,
      { timeout: 20000 }
    );
    const body = await response.json();
    return typeof body.version === "string" ? body.version : null;
  } catch {
    return null;
  } finally {
    await context.close();
  }
}

function report(line) {
  process.stdout.write(`${line}
`);
}

function progressLine(run) {
  return JSON.stringify({
    label: run.label,
    error: run.navigationError,
    fcp: run.fcp,
    lcp: run.lcp,
    tbt: run.tbt,
    requests: run.net.n,
    transfer: run.net.enc,
    heapMB: run.heap.usedMB,
    idlePerMinute: run.idle ? run.idle.perMinute : undefined,
  });
}

// Cold loads in fresh contexts; the last context also gets the warm reload,
// its idle window and, when asked, a warm load with coverage. Loads run one
// after another on purpose: concurrent loads would share the CPU and network
// budget being measured.
async function measurePage(browser, options, key, runs) {
  const baseHost = options.base.hostname;
  const url = new URL(PAGES[key], options.base).href;
  for (let i = 1; i <= options.cold; i++) {
    const context = await newContext(browser, options);
    const page = await context.newPage();
    const { cdp, log } = await instrument(context, page, options);
    const cold = await measureLoad({
      page,
      cdp,
      log,
      url,
      label: `${key}-cold-${i}`,
      baseHost,
    });
    runs.push(cold);
    report(progressLine(cold));
    if (i === options.cold && options.warm > 0) {
      await measureWarm({ page, cdp, log, url, key, options, runs });
    }
    await context.close();
    await sleep(3000);
  }
}

async function measureWarm({ page, cdp, log, url, key, options, runs }) {
  const baseHost = options.base.hostname;
  await sleep(2000);
  const warm = await measureLoad({
    page,
    cdp,
    log,
    url,
    label: `${key}-warm-1`,
    baseHost,
  });
  if (options.idleSeconds > 0)
    warm.idle = await idleWindow(log, options.idleSeconds, baseHost);
  runs.push(warm);
  report(progressLine(warm));
  if (!options.coverage.has(key)) return;
  await sleep(2000);
  const covered = await measureLoad({
    page,
    cdp,
    log,
    url,
    label: `${key}-warm-coverage`,
    coverage: true,
    baseHost,
  });
  runs.push(covered);
  report(
    JSON.stringify({
      label: covered.label,
      unusedPct: covered.coverage.unusedPct,
    })
  );
}

function stagingAccessCode() {
  return process.env.PLAYWRIGHT_STAGING_ACCESS_CODE || process.env.STAGING_AUTH;
}

async function main() {
  const options = readOptions(process.argv.slice(2));
  if (options.base.hostname === STAGING_HOSTNAME && !stagingAccessCode()) {
    // Without the access cookie every page is the staging access wall.
    throw new Error(
      "Measuring staging needs PLAYWRIGHT_STAGING_ACCESS_CODE or STAGING_AUTH."
    );
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes to the output folder it is given.
  fs.mkdirSync(options.outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = {
    schema: "mobile-lab-v1",
    when: new Date().toISOString(),
    base: options.base.origin,
    browser: browser.version(),
    device: "Pixel 7",
    cpuThrottle: options.cpu,
    network: options.network,
    networkParams: NETWORKS[options.network],
    deployedVersion: null,
    runs: [],
  };
  try {
    results.deployedVersion = await readDeployedVersion(browser, options);
    for (const key of options.pages) {
      await measurePage(browser, options, key, results.runs);
    }
  } finally {
    await browser.close();
    const outFile = path.join(options.outDir, "results.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes to the output folder it is given.
    fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
    report(`Results: ${outFile}`);
  }
}

async function runCli() {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

void runCli();
