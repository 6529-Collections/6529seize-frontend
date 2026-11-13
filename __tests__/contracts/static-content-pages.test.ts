/** @jest-environment node */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// Migrated WordPress pages are fixed content. They opt out of the root
// layout's request-time default so they are prerendered and cacheable.
const STATIC_CONTENT_RENDERER =
  /from\s+["']@\/components\/migrated-wordpress\/(?:createMigratedWordPressStaticPage|MigratedWordPressStaticPage|MigratedWordPressArticlePage)["']/;
const FORCE_STATIC_EXPORT = /^export const dynamic = "force-static";$/m;
// force-static hides request data and caches fetches at build time, so these
// pages must not read either. This is a source-text guard on the page files
// only: it cannot see request or fetch calls inside imported helpers or
// aliased imports. Review new imports in these pages with that in mind.
const REQUEST_OR_DATA_ACCESS = [
  /\bcookies\(/,
  /\bheaders\(/,
  /\bconnection\(/,
  /\bdraftMode\(/,
  /\bsearchParams\b/,
  /\bfetch\(/,
  /\bcommonApiFetch\b/,
  /^["']use client["']/m,
];

function findPageFiles(directory: string): string[] {
  const pages: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      pages.push(...findPageFiles(entryPath));
    } else if (entry.isFile() && entry.name === "page.tsx") {
      pages.push(entryPath);
    }
  }
  return pages;
}

const staticContentPages = findPageFiles(join(process.cwd(), "app"))
  .map((file) => ({
    file: relative(process.cwd(), file).split("\\").join("/"),
    source: readFileSync(file, "utf8"),
  }))
  .filter(({ source }) => STATIC_CONTENT_RENDERER.test(source))
  .sort((a, b) => a.file.localeCompare(b.file, "en"));

it("covers the migrated museum and content pages", () => {
  const museumPages = staticContentPages.filter(({ file }) =>
    file.startsWith("app/museum/")
  );
  expect(museumPages.length).toBeGreaterThan(100);
  expect(
    museumPages.some(({ file }) => file.startsWith("app/museum/network/"))
  ).toBe(false);
  expect(staticContentPages.length).toBeGreaterThan(museumPages.length);
});

it.each(staticContentPages.map(({ file, source }) => [file, source]))(
  "prerenders %s without request data",
  (_file, source) => {
    expect(source).toMatch(FORCE_STATIC_EXPORT);
    for (const pattern of REQUEST_OR_DATA_ACCESS) {
      expect(source).not.toMatch(pattern);
    }
  }
);
