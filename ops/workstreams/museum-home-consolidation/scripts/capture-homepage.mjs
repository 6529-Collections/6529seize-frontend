import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MUSEUM_CAPTURE_BASE_URL ?? "http://localhost:3001";
const evidenceDir = path.resolve(
  "ops/workstreams/museum-home-consolidation/evidence"
);
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 820, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const expectedAcquisitions = [
  "The System in Seven States",
  "Keys and Gates",
  "Conflict at Its Edges",
  "A Gift of Themes and Variations #210",
];

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(`${baseUrl}/museum/network`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.evaluate(async () => {
      const pause = (milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await pause(80);
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1_000);

    const screenshotPath = path.join(
      evidenceDir,
      `homepage-${viewport.name}-${viewport.width}x${viewport.height}.png`
    );
    const screenshotBytes = await page.screenshot({
      fullPage: true,
      path: screenshotPath,
    });

    const pageEvidence = await page.evaluate((titles) => {
      const acquisitionTitles = [
        ...document.querySelectorAll(
          'section[aria-labelledby="museum-acquisition-stories-title"] article h3'
        ),
      ].map((heading) => heading.textContent?.trim() ?? "");
      const imageState = [...document.images].map((image) => ({
        alt: image.alt,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        currentSrc: image.currentSrc,
      }));
      return {
        title: document.title,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        acquisitionHeadingCount: [
          ...document.querySelectorAll("h1, h2, h3"),
        ].filter((heading) => heading.textContent?.trim() === "Acquisitions")
          .length,
        supersededSectionHeadingCount: [
          ...document.querySelectorAll("h1, h2, h3"),
        ].filter((heading) =>
          ["In the Collection", "Current acquisitions"].includes(
            heading.textContent?.trim() ?? ""
          )
        ).length,
        expectedAcquisitions: Object.fromEntries(
          titles.map((title) => [title, acquisitionTitles.includes(title)])
        ),
        decodedImageCount: imageState.filter(
          (image) => image.complete && image.naturalWidth > 0
        ).length,
        brokenImages: imageState.filter(
          (image) => !image.complete || image.naturalWidth === 0
        ),
      };
    }, expectedAcquisitions);
    results.push({
      viewport,
      screenshot: path
        .relative(process.cwd(), screenshotPath)
        .replaceAll("\\", "/"),
      sha256: createHash("sha256").update(screenshotBytes).digest("hex"),
      consoleErrors,
      ...pageEvidence,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = results.flatMap((result) => {
  const messages = [];
  if (result.scrollWidth > result.clientWidth) {
    messages.push(`${result.viewport.name}: horizontal overflow`);
  }
  if (result.acquisitionHeadingCount !== 1) {
    messages.push(
      `${result.viewport.name}: expected one Acquisitions heading, found ${result.acquisitionHeadingCount}`
    );
  }
  if (result.supersededSectionHeadingCount > 0) {
    messages.push(
      `${result.viewport.name}: superseded homepage section remains visible`
    );
  }
  for (const [title, present] of Object.entries(result.expectedAcquisitions)) {
    if (!present) messages.push(`${result.viewport.name}: missing ${title}`);
  }
  if (result.brokenImages.length > 0) {
    messages.push(
      `${result.viewport.name}: ${result.brokenImages.length} broken images`
    );
  }
  if (result.consoleErrors.length > 0) {
    messages.push(
      `${result.viewport.name}: ${result.consoleErrors.length} console errors`
    );
  }
  return messages;
});

const report = {
  capturedAt: new Date().toISOString(),
  route: "/museum/network",
  baseUrl,
  failures,
  results,
};
await writeFile(
  path.join(evidenceDir, "homepage-capture-report.json"),
  `${JSON.stringify(report, null, 2)}\n`
);
console.error(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exitCode = 1;
