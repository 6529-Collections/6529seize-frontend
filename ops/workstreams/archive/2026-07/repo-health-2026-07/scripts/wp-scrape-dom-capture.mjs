// Capture hydrated, normalized DOM for a list of routes.
// usage: node dom-capture.mjs <outDir> <routesFile>
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
// Resolve playwright from the repo the script runs in.
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { chromium } = require("playwright");

const [outDir, routesFile] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const routes = fs.readFileSync(routesFile, "utf8").trim().split(/\s+/);

const browser = await chromium.launch();
const page = await browser.newPage();

for (const route of routes) {
  const name = route.replaceAll("/", "_");
  try {
    await page.goto(`http://localhost:3001/${route}`, { waitUntil: "networkidle", timeout: 120000 });
  } catch {
    // capture whatever state we reached; static pages settle fast
  }
  await page.waitForTimeout(2500);
  const dom = await page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true);
    for (const s of clone.querySelectorAll("script")) s.remove();
    // next dev toolbar / portals are environment noise
    for (const s of clone.querySelectorAll("nextjs-portal, next-route-announcer")) s.remove();
    return clone.outerHTML;
  });
  const normalized = dom
    .replaceAll(/\/_next\/[^"'\s)]+/g, "/_next/X")
    .replaceAll(/<link rel="preload" as="script"[^>]*>/g, "")
    .replaceAll(">", ">\n");
  fs.writeFileSync(path.join(outDir, `${name}.dom.html`), normalized);
  console.log(`captured ${route} (${normalized.length} bytes)`);
}
await browser.close();
