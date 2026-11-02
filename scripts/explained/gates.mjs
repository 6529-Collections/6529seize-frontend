#!/usr/bin/env node
/**
 * The 6529 Explained gates (SCORECARD.md §3, §5): render, measure, states,
 * axe and the readers' checks, on every page of lib/explained/pages.json,
 * in headless Chromium, each step with a timeout.
 *
 *   6529 run explained:gates -- --base http://localhost:3201 [--pages kit,tdh-overview]
 *       [--checks render,measure,states,axe,readers] [--widths 1440,390] [--locale de-DE]
 *       [--out DIR] [--channel chrome] [--timeout MS] [--report-only] [--built-only]
 *
 * render   first-screen and full-page screenshots at 1440 and 390, overflow
 *          against the fixed width and every element's edge, text cut by its
 *          box, HTML and SVG text under 12 px, SVG label collisions, console
 *          errors, and requests the page made to other hosts
 * measure  words, first-screen words, words per screen, body size and line
 *          height, paragraph gap, text tones, figures per 1,000 words, lede,
 *          sentences over 30 words, gutters, numbers printed outside facts;
 *          each against the page's genre band (scripts/explained/lib/bands.mjs)
 * states   every interaction state the page lists (Break it included): its
 *          clicks, a screenshot of its element, overflow and collisions again
 * axe      WCAG 2.2 AA; serious or critical findings fail
 * readers  each reader task of pages.json: on the first screen at both widths,
 *          or reachable within its clicks by the page's links; plus a reader
 *          packet (screenshots and text) for the human readers of S11
 *
 * Writes DIR/report.json and the screenshots; exits 1 on any failure unless
 * --report-only. --built-only skips a page that is not built on the kit yet
 * (no 6529 Explained shell), so CI gates each page from the day it lands.
 * A dev server or `next start` must be running.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import { evaluate } from "./lib/bands.mjs";
import { measure, renderChecks } from "./lib/inpage.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const REGISTRY = JSON.parse(
  readFileSync(path.join(ROOT, "lib/explained/pages.json"), "utf8")
);
const FEED_INDEX = "https://d379duzqnomz3w.cloudfront.net/index.json";

const VIEWS = {
  1440: {
    label: "1440",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    // A desktop browser's agent: the art CDN refuses headless Chromium's,
    // which left the cards' art out of the 1440 screenshots.
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  },
  390: {
    label: "390",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },
};

function parseArgs(argv) {
  const args = {
    base: "http://localhost:3001",
    pages: null,
    checks: ["render", "measure", "states", "axe", "readers"],
    widths: ["1440", "390"],
    locale: null,
    out: path.join(ROOT, ".explained-gates"),
    channel: undefined,
    timeout: 90_000,
    reportOnly: false,
    builtOnly: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const next = () => argv[++i];
    const arg = argv[i];
    if (arg === "--base") args.base = next();
    else if (arg === "--pages") args.pages = next().split(",");
    else if (arg === "--checks") args.checks = next().split(",");
    else if (arg === "--widths") args.widths = next().split(",");
    else if (arg === "--locale") args.locale = next();
    else if (arg === "--out") args.out = path.resolve(next());
    else if (arg === "--channel") args.channel = next();
    else if (arg === "--timeout") args.timeout = Number(next());
    else if (arg === "--report-only") args.reportOnly = true;
    else if (arg === "--built-only") args.builtOnly = true;
  }
  return args;
}

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)
    ),
  ]);

async function latestDay() {
  try {
    const response = await withTimeout(fetch(FEED_INDEX), 15_000, "feed index");
    const index = await response.json();
    return String(Math.max(...index.days.map((day) => day.cycleDay)));
  } catch {
    return null;
  }
}

function routeOf(route, day, locale) {
  const resolved = route.replace("{latestDay}", day ?? "0");
  return locale
    ? `${resolved}${resolved.includes("?") ? "&" : "?"}locale=${locale}`
    : resolved;
}

/**
 * Scrolls through the page so lazy images load, waits for them (a few
 * seconds at most), and returns to the top.
 */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.9));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await withTimeout(
    page.evaluate(() =>
      Promise.all(
        [...document.images]
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
          )
      ).then(() => true)
    ),
    8_000,
    "images"
  ).catch(() => undefined);
  await page.waitForTimeout(500);
}

async function openPage(browser, view, url, timeout) {
  const context = await browser.newContext({
    viewport: view.viewport,
    deviceScaleFactor: view.deviceScaleFactor,
    isMobile: view.isMobile,
    hasTouch: view.hasTouch,
    ...(view.userAgent ? { userAgent: view.userAgent } : {}),
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const requests = new Set();
  const origin = new URL(url).origin;
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push(message.text().slice(0, 200));
  });
  page.on("pageerror", (error) =>
    consoleErrors.push(
      `uncaught: ${String(error?.message ?? error).slice(0, 200)}`
    )
  );
  page.on("request", (request) => {
    const host = new URL(request.url()).origin;
    if (host !== origin && !request.url().startsWith("data:"))
      requests.add(host);
  });
  await withTimeout(
    page.goto(url, { waitUntil: "load", timeout }),
    timeout + 5_000,
    `goto ${url}`
  );
  await withTimeout(
    page.evaluate(() => document.fonts.ready.then(() => true)),
    15_000,
    "fonts"
  );
  await settle(page);
  return { context, page, consoleErrors, requests };
}

async function runStates(page, view, pageDef, outDir, timeout) {
  const results = [];
  for (const state of (pageDef.states ?? []).filter(
    (entry) => !entry.widths || entry.widths.includes(view.label)
  )) {
    const result = { name: state.name, ok: true, problems: [] };
    try {
      await withTimeout(
        page.reload({ waitUntil: "load" }),
        timeout,
        `reload for ${state.name}`
      );
      await settle(page);
      for (const selector of state.clicks) {
        const handle = await page.$(selector);
        if (!handle) {
          result.ok = false;
          result.problems.push(`no element ${selector}`);
          continue;
        }
        await handle.scrollIntoViewIfNeeded();
        await handle.click();
        await page.waitForTimeout(200);
      }
      const target = state.el ? await page.$(state.el) : null;
      const file = path.join(
        outDir,
        "states",
        `${pageDef.id}.${state.name}.${view.label}.png`
      );
      if (target) await target.screenshot({ path: file });
      else await page.screenshot({ path: file, fullPage: true });
      const checks = await page.evaluate(renderChecks, view.viewport.width);
      if (checks.overflowPx > 0)
        result.problems.push(`overflow ${checks.overflowPx} px`);
      if (checks.collisions.length)
        result.problems.push(
          `collisions: ${checks.collisions.slice(0, 3).join("; ")}`
        );
      if (checks.minSvgText < 12)
        result.problems.push(`SVG text ${checks.minSvgText} px`);
      if (result.problems.length) result.ok = false;
    } catch (error) {
      result.ok = false;
      result.problems.push(String(error.message ?? error));
    }
    results.push(result);
  }
  return results;
}

async function runAxe(page) {
  const axe = await new AxeBuilder({ page })
    .include("[data-explained-shell]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return axe.violations
    .filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    )
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
    }));
}

async function readerTask(browser, args, task, day) {
  const results = [];
  const targetRoute = routeOf(task.target.route, day, null);
  if (task.firstScreen) {
    for (const width of ["1440", "390"]) {
      const view = VIEWS[width];
      let opened;
      try {
        opened = await openPage(
          browser,
          view,
          new URL(routeOf(task.start, day, args.locale), args.base).toString(),
          args.timeout
        );
        const top = await opened.page.evaluate((selector) => {
          const el = document.querySelector(selector);
          return el ? el.getBoundingClientRect().top + window.scrollY : null;
        }, task.target.selector ?? "body");
        const ok = top !== null && top < view.viewport.height;
        results.push({
          width,
          ok,
          detail:
            top === null
              ? `no ${task.target.selector}`
              : `${Math.round(top)} px from the top`,
        });
      } catch (error) {
        results.push({
          width,
          ok: false,
          detail: String(error.message ?? error),
        });
      } finally {
        await opened?.context.close();
      }
    }
    return results;
  }
  // Breadth-first over the page's own links, up to the task's clicks.
  const view = VIEWS["1440"];
  const want = (href) => {
    const url = new URL(href, args.base);
    return (
      url.pathname === targetRoute &&
      (!task.target.anchor || url.hash === `#${task.target.anchor}`)
    );
  };
  let frontier = [routeOf(task.start, day, null)];
  const seen = new Set(frontier);
  for (let clicks = 0; clicks <= (task.clicks ?? 0); clicks += 1) {
    const next = [];
    for (const route of frontier) {
      let opened;
      try {
        opened = await openPage(
          browser,
          view,
          new URL(route, args.base).toString(),
          args.timeout
        );
        if (
          route.split("#")[0] === targetRoute &&
          (task.target.selector || task.target.anchor)
        ) {
          const present = await opened.page.evaluate(
            ({ selector, anchor }) =>
              Boolean(
                document.querySelector(selector ?? `#${CSS.escape(anchor)}`)
              ),
            {
              selector: task.target.selector ?? null,
              anchor: task.target.anchor ?? "",
            }
          );
          if (present && clicks <= (task.clicks ?? 0)) {
            return [
              {
                width: "1440",
                ok: true,
                detail: `found on ${route} after ${clicks} click(s)`,
              },
            ];
          }
        }
        const hrefs = await opened.page.$$eval(
          "[data-explained-shell] a[href]",
          (links) => links.map((link) => link.getAttribute("href"))
        );
        for (const href of hrefs) {
          if (!href || href.startsWith("http")) continue;
          if (want(href))
            return [
              {
                width: "1440",
                ok: true,
                detail: `a link on ${route} after ${clicks} click(s)`,
              },
            ];
          const plain = href.split("#")[0];
          if (plain && !seen.has(plain)) {
            seen.add(plain);
            next.push(plain);
          }
        }
      } catch {
        // an unreachable page counts as no path through it
      } finally {
        await opened?.context.close();
      }
    }
    frontier = next.slice(0, 12);
  }
  return [
    {
      width: "1440",
      ok: false,
      detail: `not reached within ${task.clicks ?? 0} click(s)`,
    },
  ];
}

async function isBuilt(browser, args, route) {
  let opened;
  try {
    opened = await openPage(
      browser,
      VIEWS["1440"],
      new URL(route, args.base).toString(),
      args.timeout
    );
    return await opened.page.evaluate(
      () => document.querySelector("[data-explained-shell]") !== null
    );
  } catch {
    return false;
  } finally {
    await opened?.context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(path.join(args.out, "states"), { recursive: true });
  mkdirSync(path.join(args.out, "readers"), { recursive: true });
  const pages = REGISTRY.pages.filter(
    (page) => !args.pages || args.pages.includes(page.id)
  );
  const day =
    pages.some((page) => page.route.includes("{latestDay}")) ||
    args.checks.includes("readers")
      ? await latestDay()
      : null;
  const browser = await chromium.launch({
    headless: true,
    channel: args.channel,
    timeout: 60_000,
  });
  const report = {
    base: args.base,
    locale: args.locale,
    at: new Date().toISOString(),
    pages: {},
    readers: [],
  };
  let failed = 0;
  try {
    for (const pageDef of pages) {
      report.pages[pageDef.id] = {};
      for (const width of args.widths) {
        const view = VIEWS[width];
        const url = new URL(
          routeOf(pageDef.route, day, args.locale),
          args.base
        ).toString();
        const entry = { url, fails: [] };
        let opened;
        try {
          opened = await openPage(browser, view, url, args.timeout);
          const { page } = opened;
          const built = await page.evaluate(
            () => document.querySelector("[data-explained-shell]") !== null
          );
          if (!built && args.builtOnly) {
            entry.skipped = "not built on the kit yet";
            report.pages[pageDef.id][width] = entry;
            console.log(
              `${`${pageDef.id}.${width}`.padEnd(30)} skipped: not built on the kit yet`
            );
            continue;
          }
          if (!built)
            entry.fails.push({
              axis: "all",
              check: "not built on the kit",
              detail: "no [data-explained-shell] on the page",
            });
          const tag = `${pageDef.id}.${view.label}${args.locale ? `.${args.locale}` : ""}`;
          if (args.checks.includes("render")) {
            await page.screenshot({
              path: path.join(args.out, `${tag}.first.png`),
            });
            await page.screenshot({
              path: path.join(args.out, `${tag}.png`),
              fullPage: true,
            });
          }
          const render = await page.evaluate(renderChecks, view.viewport.width);
          const metrics = args.checks.includes("measure")
            ? await page.evaluate(measure, view.viewport.height)
            : null;
          entry.render = render;
          entry.measure = metrics;
          entry.requests = [...opened.requests];
          entry.consoleErrors = opened.consoleErrors;
          entry.fails.push(
            ...evaluate(pageDef.genre, pageDef.budget, view.label, {
              ...render,
              consoleErrors: opened.consoleErrors,
              ...(metrics ?? {
                tones: 0,
                paragraphGap: null,
                gutter: null,
                body: null,
                firstScreenWords: 0,
                wordsPerScreen: 0,
                words: 0,
                figuresPer1000: 0,
                ledeWords: null,
                ledeSentences: 0,
                sentences: 0,
                longSentences: 0,
                numbersOutsideFacts: [],
              }),
            }).filter((fail) => metrics || fail.axis === "polish")
          );
          if (args.checks.includes("axe")) {
            entry.axe = await runAxe(page);
            for (const violation of entry.axe)
              entry.fails.push({
                axis: "all",
                check: `axe:${violation.id}`,
                detail: violation.nodes.join(", "),
              });
          }
          if (args.checks.includes("states")) {
            entry.states = await runStates(
              page,
              view,
              pageDef,
              args.out,
              args.timeout
            );
            for (const state of entry.states.filter((s) => !s.ok))
              entry.fails.push({
                axis: "trust",
                check: `state ${state.name}`,
                detail: state.problems.join("; "),
              });
          }
          if (args.checks.includes("readers")) {
            const text = await page.evaluate(
              () =>
                (document.querySelector("[data-ex-article]") ?? document.body)
                  .innerText
            );
            writeFileSync(path.join(args.out, "readers", `${tag}.txt`), text);
          }
        } catch (error) {
          entry.fails.push({
            axis: "all",
            check: "render",
            detail: String(error.message ?? error),
          });
        } finally {
          await opened?.context.close();
        }
        report.pages[pageDef.id][width] = entry;
        failed += entry.fails.length;
        const m = entry.measure;
        console.log(
          `${`${pageDef.id}.${width}`.padEnd(30)} over ${entry.render?.overflowPx ?? "-"}  html ${entry.render?.minHtmlText ?? "-"}  svg ${entry.render?.minSvgText ?? "-"}  coll ${entry.render?.collisions.length ?? "-"}` +
            (m
              ? `  words ${m.words}  first ${m.firstScreenWords}  w/scr ${m.wordsPerScreen}  body ${m.body}  gap ${m.paragraphGap}  tones ${m.tones}  figs/1k ${m.figuresPer1000}  gutter ${m.gutter}`
              : "") +
            `  ${entry.fails.length ? `FAIL ${entry.fails.map((f) => f.check).join(", ")}` : "ok"}`
        );
      }
    }
    if (args.checks.includes("readers")) {
      const ids = new Set(pages.map((page) => page.route));
      for (const task of REGISTRY.readers.filter(
        (t) => !args.pages || ids.has(t.start)
      )) {
        if (
          args.builtOnly &&
          !(await isBuilt(browser, args, routeOf(task.start, day, null)))
        ) {
          report.readers.push({
            ...task,
            skipped: "start page not built on the kit yet",
          });
          console.log(
            `reader ${task.persona.padEnd(13)} ${task.task.padEnd(40)} skipped: not built on the kit yet`
          );
          continue;
        }
        const results = await readerTask(browser, args, task, day);
        const ok = results.every((result) => result.ok);
        report.readers.push({ ...task, ok, results });
        if (!ok) failed += 1;
        console.log(
          `reader ${task.persona.padEnd(13)} ${task.task.padEnd(40)} ${ok ? "ok" : "FAIL"}  ${results.map((r) => `${r.width}: ${r.detail}`).join(" | ")}`
        );
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(
    path.join(args.out, "report.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(
    `\n${failed} failure(s); report in ${path.relative(ROOT, path.join(args.out, "report.json"))}`
  );
  if (failed && !args.reportOnly) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
