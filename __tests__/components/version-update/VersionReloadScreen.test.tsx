/** @jest-environment node */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import VersionReloadScreen from "@/components/version-update/VersionReloadScreen";
import { VERSION_RELOAD_IMAGE_DATA } from "@/components/version-update/versionReloadImage";

it("ships a complete, small rocket in the initial cover HTML without an image request", async () => {
  const html = renderToStaticMarkup(<VersionReloadScreen />);
  expect(html).toContain(`src="${VERSION_RELOAD_IMAGE_DATA}"`);
  expect(html).not.toContain("/rocket-refresh-small.png");
  expect(html).not.toContain('rel="preload"');

  const bytes = Buffer.from(VERSION_RELOAD_IMAGE_DATA.split(",")[1]!, "base64");
  expect(bytes.length).toBeLessThan(25_000);
  const metadata = await sharp(bytes).metadata();
  expect(metadata).toMatchObject({
    format: "webp",
    width: 180,
    hasAlpha: true,
  });
});

it("keeps the embedded artwork synchronized with the current public rocket", () => {
  const source = readFileSync(
    path.join(process.cwd(), "public/rocket-refresh-small.png")
  );
  const hash = createHash("sha256").update(source).digest("hex");
  const generated = readFileSync(
    path.join(process.cwd(), "components/version-update/versionReloadImage.ts"),
    "utf8"
  );
  expect(generated).toContain(`Source SHA-256: ${hash}`);
});
