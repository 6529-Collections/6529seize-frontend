#!/usr/bin/env node
/**
 * Renders each kit component in the gallery (/explained/kit) beside the same
 * component in the final mockups, at 1440 and 390, in headless Chromium,
 * and writes one side-by-side image per pair: the check of the kit against
 * the mockups' look. The mockups are local HTML files rendered with every
 * network request refused.
 *
 *   6529 run explained:compare -- --base http://localhost:3201 --mockups <final/mockups> [--out DIR] [--widths 1440,390]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

/** [name, mockup file, mockup selector, gallery selector, clicks (mockup, gallery)] */
const PAIRS = [
  [
    "crumbs",
    "tdh-daily-check.html",
    ".crumbs",
    "[data-explained-shell] > div:first-child",
  ],
  [
    "chapter-bar",
    "tdh-daily-check.html",
    ".chapbar",
    "[data-explained-shell] > div:nth-child(2)",
  ],
  ["marks", "hub.html", ".legend", '[data-specimen="Mark"]'],
  [
    "verdict",
    "tdh-daily-check.html",
    "#side",
    '[data-specimen="Verdict + Equation"] [data-verdict]',
  ],
  [
    "ribbon",
    "tdh-daily-check.html",
    "#history .ribbon",
    '[data-specimen="DayRibbon, DayTile"] [data-fig="ribbon"]',
  ],
  [
    "failday",
    "tdh-daily-check.html",
    '[data-lens="failday"]',
    '[data-lens="kit-failday"]',
    ['[data-break="fail"]'],
    ['[data-lens="kit-failday"] [data-break="fail"]'],
  ],
  ["lanes", "tdh-daily-check.html", ".lanes2", '[data-fig="lanes"]'],
  [
    "honesty",
    "tdh-daily-check.html",
    ".honest",
    '[data-specimen="HonestyBox"] > div:last-child',
  ],
  ["trail", "tdh-daily-check.html", ".trail", "[data-trail]"],
  ["receipt", "tdh-day-20744.html", ".receipt", "[data-receipt]"],
  [
    "ladders",
    "tdh-how-sure.html",
    "#layers .cols2",
    '[data-specimen="AssuranceLadder"][data-state^="two"] > div:last-child',
  ],
  ["claim", "tdh-how-sure.html", ".claim3", "[data-claim-parts]"],
  ["scoreboard", "tdh-how-sure.html", ".score", "[data-scoreboard]"],
  ["loop", "hub.html", '[data-lens="loop"]', '[data-lens="kit-loop"]'],
  ["chapters", "hub.html", ".cindex", '[data-specimen="ChapterIndex"] > ol'],
  ["paths", "hub.html", ".paths", '[data-specimen="ReaderPaths"] > ul'],
  [
    "machine",
    "tdh-overview.html",
    '[data-lens="machine"]',
    '[data-lens="kit-area"]',
  ],
  [
    "machine-sold",
    "tdh-overview.html",
    '[data-lens="machine"]',
    '[data-lens="kit-area"]',
    ['[data-break="sell"]'],
    ['[data-lens="kit-area"] [data-break="sell"]'],
  ],
  [
    "equal-area",
    "tdh-overview.html",
    '[data-lens="equal"]',
    '[data-specimen="EqualAreaFigure"] [data-fig="equal"]',
  ],
  [
    "rates",
    "tdh-how-it-works.html",
    '[data-lens="rates"] [data-fig="rates"]',
    '[data-specimen="RateFigure"] [data-fig="rates"]',
  ],
  [
    "wallets",
    "tdh-wallets.html",
    '[data-lens="wallets"] [data-fig="wallets"]',
    '[data-specimen="WalletGraph"] [data-fig="wallets"]',
  ],
  ["how-we-know", "tdh-daily-check.html", "footer.hwk", "[data-ex-hwk]"],
];

function parseArgs(argv) {
  const args = {
    base: "http://localhost:3001",
    mockups: null,
    out: path.join(ROOT, ".explained-compare"),
    widths: ["1440", "390"],
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base") args.base = argv[++i];
    else if (argv[i] === "--mockups") args.mockups = path.resolve(argv[++i]);
    else if (argv[i] === "--out") args.out = path.resolve(argv[++i]);
    else if (argv[i] === "--widths") args.widths = argv[++i].split(",");
  }
  if (!args.mockups) {
    console.error(
      "usage: compare-mockups.mjs --base URL --mockups <final/mockups folder> [--out DIR]"
    );
    process.exit(2);
  }
  return args;
}

async function shoot(browser, url, width, selector, clicks, file, offline) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile: width < 500,
    hasTouch: width < 500,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  if (offline) {
    await page.route("**/*", (route) =>
      route.request().url().startsWith("file:")
        ? route.continue()
        : route.abort()
    );
  }
  try {
    await page.goto(url, { waitUntil: "load", timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    for (const click of clicks ?? []) {
      const handle = await page.$(click);
      if (handle) {
        await handle.evaluate((element) =>
          element.scrollIntoView({ block: "center" })
        );
        await handle.evaluate((element) => element.click());
        await page.waitForTimeout(250);
      }
    }
    // A component drawn twice (a phone and a desktop layout) shows one.
    let handle = null;
    for (const candidate of await page.$$(selector)) {
      if (await candidate.isVisible()) {
        handle = candidate;
        break;
      }
    }
    if (!handle) return false;
    await handle.screenshot({ path: file });
    return true;
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const work = path.join(args.out, "parts");
  mkdirSync(work, { recursive: true });
  const browser = await chromium.launch({ headless: true, timeout: 60_000 });
  const results = [];
  try {
    for (const width of args.widths.map(Number)) {
      for (const [
        name,
        file,
        mockSelector,
        kitSelector,
        mockClicks,
        kitClicks,
      ] of PAIRS) {
        const mockPng = path.join(work, `${name}.${width}.mockup.png`);
        const kitPng = path.join(work, `${name}.${width}.kit.png`);
        const mockOk = await shoot(
          browser,
          pathToFileURL(path.join(args.mockups, file)).href,
          width,
          mockSelector,
          mockClicks,
          mockPng,
          true
        );
        const kitOk = await shoot(
          browser,
          new URL("/explained/kit", args.base).toString(),
          width,
          kitSelector,
          kitClicks,
          kitPng,
          false
        );
        results.push({ name, width, mockOk, kitOk });
        if (!mockOk || !kitOk) {
          console.log(
            `${name}.${width}: missing ${mockOk ? "" : "mockup "}${kitOk ? "" : "kit"}`
          );
          continue;
        }
        const sheet = path.join(work, `${name}.${width}.html`);
        const side = width >= 1000 ? "column" : "row";
        writeFileSync(
          sheet,
          `<!doctype html><html><body style="margin:0;background:#3c003c;font:600 14px system-ui;color:#fff">
<div style="display:flex;flex-direction:${side};gap:12px;padding:12px;align-items:flex-start">
<figure style="margin:0"><figcaption style="padding:4px 0">mockup · ${name} · ${width}</figcaption><img src="${pathToFileURL(mockPng).href}"></figure>
<figure style="margin:0"><figcaption style="padding:4px 0">kit · ${name} · ${width}</figcaption><img src="${pathToFileURL(kitPng).href}"></figure>
</div></body></html>`
        );
        const context = await browser.newContext({
          viewport: { width: 400, height: 300 },
        });
        const page = await context.newPage();
        await page.goto(pathToFileURL(sheet).href, { waitUntil: "load" });
        await page.screenshot({
          path: path.join(args.out, `${name}.${width}.png`),
          fullPage: true,
        });
        await context.close();
        console.log(
          `${name}.${width}: ${path.relative(ROOT, path.join(args.out, `${name}.${width}.png`))}`
        );
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(
    path.join(args.out, "compare.json"),
    JSON.stringify(results, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
