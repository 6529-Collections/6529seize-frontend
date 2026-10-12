#!/usr/bin/env node
// Captures the Museum gate evidence for /museum/network/about.
//
// Usage (from the repository root, with a production build served locally):
//   node ops/workstreams/museum-about-polish/scripts/capture-about.mjs <run-dir> [base-url]
//
// Writes full-page captures, viewport-height tiles, one contact sheet per
// viewport, and automated-check results into <run-dir>/evidence/.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const sharp = require("sharp");

const [runDirArg, baseUrlArg = "http://localhost:3001"] = process.argv.slice(2);
if (!runDirArg) {
  console.error("usage: capture-about.mjs <run-dir> [base-url]");
  process.exit(2);
}
const EVIDENCE = path.join(path.resolve(runDirArg), "evidence");
const ROUTE = "/museum/network/about";
const SLUG = "about";

// The phone cell uses a device profile so the app renders its touch layout.
const VIEWPORTS = {
  "1440x1000": { width: 1440, height: 1000, device: null },
  "820x1000": { width: 820, height: 1000, device: null },
  "390x844": { width: 390, height: 844, device: devices["Pixel 7"] },
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let previous = -1;
    for (let pass = 0; pass < 5; pass += 1) {
      const height = document.documentElement.scrollHeight;
      if (height === previous) break;
      previous = height;
      for (let y = 0; y < height; y += 600) {
        window.scrollTo(0, y);
        await pause(150);
      }
      window.scrollTo(0, height);
      await pause(1500);
    }
    window.scrollTo(0, 0);
    await pause(1000);
  });
}

async function slice(buffer, prefix, tileHeight) {
  const { width, height } = await sharp(buffer).metadata();
  const files = [];
  for (let top = 0, index = 1; top < height; top += tileHeight, index += 1) {
    const file = `${prefix}-${String(index).padStart(2, "0")}.png`;
    await sharp(buffer)
      .extract({
        left: 0,
        top,
        width,
        height: Math.min(tileHeight, height - top),
      })
      .toFile(path.join(EVIDENCE, file));
    files.push(file);
  }
  return files;
}

// Lays the tiles out left to right at a reduced scale so the whole page reads
// as one sheet.
async function contactSheet(tiles, size, tileWidth) {
  const scale = Math.min(1, 360 / tileWidth);
  const scaled = await Promise.all(
    tiles.map(async (file) => {
      const buffer = await sharp(path.join(EVIDENCE, file))
        .resize({ width: Math.round(tileWidth * scale) })
        .toBuffer();
      const { width, height } = await sharp(buffer).metadata();
      return { buffer, width, height };
    })
  );
  const gap = 16;
  const width = scaled.reduce((sum, t) => sum + t.width + gap, gap);
  const height = Math.max(...scaled.map((t) => t.height)) + gap * 2;
  let left = gap;
  const composites = scaled.map((t) => {
    const entry = { input: t.buffer, left, top: gap };
    left += t.width + gap;
    return entry;
  });
  const file = `contact-sheet-${size}.png`;
  await sharp({
    create: { width, height, channels: 3, background: "#1f1f23" },
  })
    .composite(composites)
    .png()
    .toFile(path.join(EVIDENCE, file));
  return file;
}

async function automatedChecks(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const root = document.querySelector("main") ?? document.body;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const images = [...root.querySelectorAll("img")].map((img) => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
    }));
    const brokenImages = images.filter(
      (i) => i.complete && i.naturalWidth === 0
    );
    const clipped = [...root.querySelectorAll("h1,h2,h3,p,a,figcaption")]
      .filter((el) => {
        const style = getComputedStyle(el);
        return (
          el.scrollWidth > el.clientWidth + 1 &&
          style.overflow !== "visible" &&
          !style.webkitLineClamp
        );
      })
      .map((el) => el.textContent.trim().slice(0, 80));
    const collectionLinks = [...document.querySelectorAll("a")]
      .filter((a) => a.getAttribute("href") === "/museum/network/collection")
      .map((a) => a.textContent.trim());
    const sections = [...root.querySelectorAll("section")].map((section) => {
      const style = getComputedStyle(section);
      const heading = section.querySelector("h2");
      return {
        heading: heading?.textContent.trim() ?? null,
        border: {
          top: style.borderTopWidth,
          right: style.borderRightWidth,
          bottom: style.borderBottomWidth,
          left: style.borderLeftWidth,
        },
        radius: style.borderRadius,
        padding: {
          top: style.paddingTop,
          right: style.paddingRight,
          bottom: style.paddingBottom,
          left: style.paddingLeft,
        },
      };
    });
    const footerLines = (() => {
      const footer = document.getElementById("footer");
      if (!footer) return null;
      return [...footer.children].map((row) => {
        const lines = new Map();
        for (const child of row.children) {
          const key = Math.round(child.getBoundingClientRect().top);
          lines.set(key, [...(lines.get(key) ?? []), child.textContent.trim()]);
        }
        return [...lines.values()].map((items) => items.join(" "));
      });
    })();
    return {
      horizontalOverflowPx: overflow,
      imageCount: images.length,
      brokenImages,
      clippedText: clipped,
      collectionLinks,
      sections,
      footerLines,
    };
  });
}

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const browser = await chromium.launch();
  const report = { route: ROUTE, baseUrl: baseUrlArg, viewports: {} };
  try {
    for (const [size, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({
        ...(viewport.device ?? {}),
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        locale: "en-US",
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(String(error)));
      const response = await page.goto(`${baseUrlArg}${ROUTE}`, {
        waitUntil: "networkidle",
        timeout: 180000,
      });
      await page.waitForTimeout(3000);
      await autoScroll(page);
      await page.waitForTimeout(1500);
      const checks = await automatedChecks(page);
      const buffer = await page.screenshot({ fullPage: true });
      const full = `${SLUG}-${size}-full.png`;
      fs.writeFileSync(path.join(EVIDENCE, full), buffer);
      const tiles = await slice(buffer, `${SLUG}-${size}`, viewport.height);
      const sheet = await contactSheet(tiles, size, viewport.width);
      report.viewports[size] = {
        status: response?.status() ?? null,
        full,
        tiles,
        contactSheet: sheet,
        consoleErrors,
        ...checks,
      };
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(EVIDENCE, "automated-checks.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  for (const [size, result] of Object.entries(report.viewports)) {
    console.log(
      size,
      `status=${result.status}`,
      `overflow=${result.horizontalOverflowPx}`,
      `broken=${result.brokenImages.length}`,
      `clipped=${result.clippedText.length}`,
      `console=${result.consoleErrors.length}`,
      `tiles=${result.tiles.length}`
    );
  }
}

await main();
