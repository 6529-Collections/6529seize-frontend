#!/usr/bin/env node
// Prepares the fe-polish-judge calibration cases.
//
// Usage (from the repository root):
//   node ops/workstreams/fe-polish-judge-calibration/scripts/prepare-cases.mjs [case...]
//
// With case ids, only those seeded cases are captured and historical cases are
// not re-sliced.
//
// Seeded cases capture public production pages and apply one defect in the
// browser before capture; production itself is never modified. Historical
// cases slice committed workstream evidence. Every page is cut into
// viewport-height tiles so a judge can read body text. Case folders are named
// neutrally; the answer key lives in labels.json, outside the case folders.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const sharp = require("sharp");

const ROOT = path.resolve(import.meta.dirname, "..");
const CASES = path.join(ROOT, "cases");
// Rubric 2.0 cases c01-c10 were captured with a bare touch context at 390 px,
// which rendered the desktop icon rail and ended the capture before the page
// did. Rubric 2.1 cases (c16 onward) use a phone device profile and scroll until
// the page height settles before capturing.
const VIEWPORTS = {
  "1440x1000": { width: 1440, height: 1000, device: null },
  "390x844": { width: 390, height: 844, device: devices["Pixel 7"] },
};

const ABOUT = "https://6529.io/museum/network/about";
const HOME = "https://6529.io/";

// One defect per seed, written into the live DOM before capture.
const SEEDS = {
  none: () => {},
  briefLeakage: () => {
    const intro = [...document.querySelectorAll("main p")].find((p) =>
      p.textContent.trim().startsWith("The 6529 Network Museum is a permanent")
    );
    intro.textContent =
      "A calm, premium, curator-grade experience: clear hierarchy, considered pacing, and actionable insight into the collection.";
  },
  fakeProfundity: () => {
    const heading = document.getElementById("museum-scholarship-title");
    heading.textContent = "Where art becomes possibility";
    const section = heading.closest("section") ?? heading.parentElement;
    const paragraph = section.querySelector("p:not(:empty)");
    paragraph.textContent =
      "Unlock a new era of connected culture, where every work opens a doorway to what comes next and meaning flows freely between people and ideas.";
  },
  governanceTheater: () => {
    const heading = document.getElementById("museum-works-title");
    const section = heading.closest("section") ?? heading.parentElement;
    const paragraph = section.querySelector("p:not(:empty)");
    paragraph.textContent =
      "The Museum is a sovereign, governed, and fully auditable institution: accountable, transparent, and defensible by design. Trust is built into every layer.";
  },
  inventedMetrics: () => {
    const intro = [...document.querySelectorAll("main p")].find((p) =>
      p.textContent.trim().startsWith("The 6529 Network Museum is a permanent")
    );
    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:24px 0;";
    for (const [value, label] of [
      ["12,483", "Collectors"],
      ["98.7%", "Visitor satisfaction"],
      ["4.2x", "Growth this quarter"],
      ["31", "Countries reached"],
    ]) {
      const tile = document.createElement("div");
      tile.style.cssText =
        "background:#0D0D0F;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;";
      tile.innerHTML = `<div style="font-size:28px;font-weight:600;color:#fff">${value}</div><div style="font-size:13px;color:#9ca3af;margin-top:4px">${label}</div>`;
      grid.appendChild(tile);
    }
    intro.after(grid);
  },
  internalLeakage: () => {
    const heading = document.getElementById("museum-about-art-title");
    heading.textContent = "records/entities/6529NM-W-0008.json @ 9aea66c07d";
    const note = document.createElement("p");
    const sibling = (heading.closest("section") ?? heading.parentElement).querySelector("p");
    note.className = sibling?.className ?? "";
    note.textContent = "TODO(curator): replace with final visitor copy before launch.";
    heading.after(note);
  },
  darkPattern: () => {
    const connect = [...document.querySelectorAll("main button")].find(
      (button) => button.textContent.trim() === "Connect wallet"
    );
    connect.textContent = "Claim your free Meme now";
    const banner = document.createElement("div");
    banner.style.cssText =
      "background:linear-gradient(90deg,#dc2626,#f97316);color:#fff;font-weight:700;border-radius:12px;padding:14px 18px;margin:16px 0;font-size:16px;";
    banner.textContent =
      "Mint closes in 04:59 - only 3 left! Connect your wallet to claim instantly. No fees, ever.";
    const anchor = document.getElementById("home-newcomer-title");
    (anchor?.closest("section") ?? connect.parentElement).before(banner);
  },
};

const SEEDED_CASES = [
  ["c01", ABOUT, "none"],
  ["c02", ABOUT, "briefLeakage"],
  ["c03", ABOUT, "fakeProfundity"],
  ["c04", ABOUT, "governanceTheater"],
  ["c05", ABOUT, "inventedMetrics"],
  ["c06", ABOUT, "internalLeakage"],
  ["c07", HOME, "none"],
  ["c08", HOME, "darkPattern"],
  ["c09", ABOUT, "none"],
  ["c10", ABOUT, "none"],
  ["c16", ABOUT, "none"],
  ["c17", HOME, "none"],
];

// Scrolls to the end until the page height stops changing, so lazy content
// and media posters load before the full-page capture.
async function autoScroll(page) {
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let previous = -1;
    for (let pass = 0; pass < 5; pass += 1) {
      const height = document.documentElement.scrollHeight;
      if (height === previous) {
        break;
      }
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

async function sliceInto(buffer, dir, prefix, tileHeight) {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  const files = [];
  for (let top = 0, index = 1; top < height; top += tileHeight, index += 1) {
    const tile = Math.min(tileHeight, height - top);
    const file = `${prefix}-${String(index).padStart(2, "0")}.png`;
    await sharp(buffer)
      .extract({ left: 0, top, width, height: tile })
      .toFile(path.join(dir, file));
    files.push(file);
  }
  return files;
}

async function captureSeeded(browser, id, url, seed) {
  const evidence = path.join(CASES, id, "evidence");
  fs.mkdirSync(evidence, { recursive: true });
  for (const [size, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      ...(viewport.device ?? {}),
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(3000);
    await autoScroll(page);
    await page.waitForTimeout(1500);
    await page.evaluate(`(${SEEDS[seed].toString()})()`);
    await page.waitForTimeout(500);
    const buffer = await page.screenshot({ fullPage: true });
    await sliceInto(buffer, evidence, `page-${size}`, viewport.height);
    await context.close();
  }
}

const HISTORICAL = {
  c11: [
    ["museum-home-consolidation/evidence/homepage-desktop-1440x1000.png", "home-1440x1000", 1000],
    ["museum-home-consolidation/evidence/homepage-tablet-820x1000.png", "home-820x1000", 1000],
    ["museum-home-consolidation/evidence/homepage-mobile-390x844.png", "home-390x844", 844],
  ],
  c12: [
    ["museum-art-first-rebuild/evidence/current-production-desktop-viewport.png", "home-1440x1000", 1500],
    ["museum-art-first-rebuild/evidence/current-production-mobile.png", "home-390x844", 844],
    ["museum-art-first-rebuild/evidence/current-production-gift.png", "gift-1440x1000", 1000],
    ["museum-art-first-rebuild/evidence/current-production-object.png", "object-1440x1000", 1000],
    ["museum-art-first-rebuild/evidence/current-production-program.png", "program-1440x1000", 1000],
  ],
  c13: [
    ["museum-art-first-rebuild/evidence/release-verified-object-01-desktop.png", "object-1440x1000", 1000],
    ["museum-art-first-rebuild/evidence/release-verified-gift-mobile-ua.png", "gift-390x844", 844],
    ["museum-art-first-rebuild/evidence/release-verified-artist-mobile-fresh-v2.png", "artist-390x844", 844],
  ],
  c14: [
    ["mint-progress-modals/confirm_wallet-desktop.png", "confirm-wallet-1440x900", 900],
    ["mint-progress-modals/confirm_wallet-mobile.png", "confirm-wallet-390x844", 844],
    ["mint-progress-modals/submitted-desktop.png", "submitted-1440x900", 900],
    ["mint-progress-modals/submitted-mobile.png", "submitted-390x844", 844],
  ],
  c15: [
    ["mint-success-modal/evidence/desktop.png", "success-1440x900", 900],
    ["mint-success-modal/evidence/mobile.png", "success-390x844", 844],
  ],
};

async function sliceHistorical() {
  const workstreams = path.resolve(ROOT, "..");
  for (const [id, sources] of Object.entries(HISTORICAL)) {
    const evidence = path.join(CASES, id, "evidence");
    fs.mkdirSync(evidence, { recursive: true });
    for (const [source, prefix, tileHeight] of sources) {
      const buffer = fs.readFileSync(path.join(workstreams, source));
      await sliceInto(buffer, evidence, prefix, tileHeight);
    }
  }
}

const only = process.argv.slice(2);
const browser = await chromium.launch();
try {
  for (const [id, url, seed] of SEEDED_CASES) {
    if (only.length > 0 && !only.includes(id)) {
      continue;
    }
    await captureSeeded(browser, id, url, seed);
    process.stdout.write(`captured ${id}\n`);
  }
} finally {
  await browser.close();
}
if (only.length === 0) {
  await sliceHistorical();
  process.stdout.write("sliced historical cases\n");
}
