/** @jest-environment node */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { checkCustomRoutes } from "next/dist/lib/load-custom-routes";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import VersionReloadScreen from "@/components/version-update/VersionReloadScreen";
import {
  VERSION_RELOAD_IMAGE_SRC,
  VERSION_UPDATE_ROCKET_IMAGE_SRC,
} from "@/components/version-update/versionReloadImage";
import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";
import { createSecurityHeaders } from "@/config/securityHeaders";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const artworkPath = path.join(PUBLIC_DIR, VERSION_RELOAD_IMAGE_SRC);

it("references the rocket as a short static URL instead of embedding the image bytes", () => {
  const html = renderToStaticMarkup(<VersionReloadScreen />);

  expect(html).toContain(`src="${VERSION_RELOAD_IMAGE_SRC}"`);
  expect(html).not.toContain("data:");
  expect(html).not.toContain("base64");
  expect(html).not.toContain("/rocket-refresh-small.png");
  expect(html).not.toContain('rel="preload"');
  // The cover ships in every HTML response, so it must stay a few KB at most.
  expect(html.length).toBeLessThan(4_000);
});

it("keeps the cover image decorative, eager, and layout-stable", () => {
  const html = renderToStaticMarkup(<VersionReloadScreen />);
  const image = /<img[^>]*>/.exec(html)?.[0] ?? "";

  expect(image).toContain('alt=""');
  expect(image).toContain('width="60"');
  expect(image).toContain('height="60"');
  expect(image).toContain('loading="eager"');
  expect(image).toContain('decoding="sync"');
  // Without a low priority React hoists a preload for the hidden image into every page.
  expect(image).toContain('fetchPriority="low"');
});

it("serves a complete, small, transparent rocket from a hash-named public file", async () => {
  expect(VERSION_RELOAD_IMAGE_SRC).toMatch(
    /^\/version-reload-rocket\.[0-9a-f]{12}\.webp$/
  );
  expect(existsSync(artworkPath)).toBe(true);

  const bytes = readFileSync(artworkPath);
  expect(bytes.length).toBeLessThan(25_000);
  const metadata = await sharp(bytes).metadata();
  expect(metadata).toMatchObject({
    format: "webp",
    width: 180,
    hasAlpha: true,
  });

  // The immutable cache header is only safe while the name tracks the content.
  const digest = createHash("sha256").update(bytes).digest("hex");
  expect(path.basename(artworkPath)).toBe(
    `version-reload-rocket.${digest.slice(0, 12)}.webp`
  );
});

it("leaves no stale hash-named rocket files behind in public", () => {
  const artwork = readdirSync(PUBLIC_DIR).filter(
    (name) =>
      name.startsWith("version-reload-rocket.") && name.endsWith(".webp")
  );
  expect(artwork).toEqual([path.basename(VERSION_RELOAD_IMAGE_SRC)]);
  expect(statSync(artworkPath).isFile()).toBe(true);
});

it("keeps the rocket synchronized with the current public source artwork", () => {
  const source = readFileSync(
    path.join(PUBLIC_DIR, "rocket-refresh-small.png")
  );
  const hash = createHash("sha256").update(source).digest("hex");
  const generated = readFileSync(
    path.join(process.cwd(), "components/version-update/versionReloadImage.ts"),
    "utf8"
  );
  expect(generated).toContain(`Source SHA-256: ${hash}`);
});

describe("new-version toast rocket", () => {
  const toastArtworkPath = path.join(
    PUBLIC_DIR,
    VERSION_UPDATE_ROCKET_IMAGE_SRC
  );

  it("is a small, transparent, hash-named WebP at 3x its 48px display height", async () => {
    expect(VERSION_UPDATE_ROCKET_IMAGE_SRC).toMatch(
      /^\/version-update-rocket\.[0-9a-f]{12}\.webp$/
    );
    const bytes = readFileSync(toastArtworkPath);
    // The 1.1 MB source PNG used to ship as-is to every user on each deploy.
    expect(bytes.length).toBeLessThan(25_000);
    const metadata = await sharp(bytes).metadata();
    expect(metadata).toMatchObject({
      format: "webp",
      height: 144,
      hasAlpha: true,
    });

    const digest = createHash("sha256").update(bytes).digest("hex");
    expect(path.basename(toastArtworkPath)).toBe(
      `version-update-rocket.${digest.slice(0, 12)}.webp`
    );
  });

  it("leaves no stale hash-named copies behind in public", () => {
    const artwork = readdirSync(PUBLIC_DIR).filter(
      (name) =>
        name.startsWith("version-update-rocket.") && name.endsWith(".webp")
    );
    expect(artwork).toEqual([path.basename(VERSION_UPDATE_ROCKET_IMAGE_SRC)]);
  });

  it("stays synchronized with its public source artwork", () => {
    const source = readFileSync(path.join(PUBLIC_DIR, "rocket-refresh.png"));
    const hash = createHash("sha256").update(source).digest("hex");
    const generated = readFileSync(
      path.join(
        process.cwd(),
        "components/version-update/versionReloadImage.ts"
      ),
      "utf8"
    );
    expect(generated).toContain(`Source SHA-256: ${hash}`);
  });
});

describe("deployment delivery", () => {
  const publicEnv = {
    API_ENDPOINT: "https://api.6529.io",
    BASE_ENDPOINT: "https://6529.io",
    IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
  } as PublicEnv;

  it.each(["", "https://dnclu2fna0b2b.cloudfront.net/web_build/1.2.3"])(
    "caches the rocket as immutable on the page origin with asset prefix %j",
    async (assetPrefix) => {
      const rules =
        (await sharedConfig(publicEnv, assetPrefix).headers?.()) ?? [];
      const rule = rules.find(
        (entry) => entry.source === VERSION_RELOAD_IMAGE_SRC
      );

      expect(rule?.headers).toEqual([
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ]);
      // Next validates header sources at build time; reject a rule it would refuse.
      expect(() => checkCustomRoutes(rules, "header")).not.toThrow();
    }
  );

  it("is allowed by the same-origin image policy", () => {
    const csp = createSecurityHeaders(
      publicEnv.API_ENDPOINT,
      publicEnv.IPFS_GATEWAY_ENDPOINT
    ).find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toMatch(/img-src [^;]*'self'/);
  });
});
