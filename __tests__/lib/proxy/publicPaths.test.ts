/**
 * @jest-environment node
 */

import fs from "node:fs";
import path from "node:path";
import {
  isRetiredReviewDataPath,
  isStaticAssetPath,
  isUnservableDotPath,
  PUBLIC_IMAGE_DIRECTORIES,
  ROOT_PUBLIC_FILES,
  SERVED_WELL_KNOWN_PATHS,
} from "@/lib/proxy/publicPaths";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const APP_DIR = path.join(process.cwd(), "app");
// Generated before dev/build (pdfjs) or by build:mls-wasm (e2ee), and handled
// by their own segment prefixes.
const GENERATED_PUBLIC_DIRECTORIES = new Set(["pdfjs", "e2ee"]);
// Retired review data: proxy answers the whole segment with a plain 404.
const SPECIAL_PUBLIC_DIRECTORIES = new Set(["review-data"]);
const IMAGE_FILE_PATTERN = /\.(?:jpe?g|png|gif|svg|webp)$/i;

function listFiles(directory: string): string[] {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(PUBLIC_DIR, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/")
    );
}

function listDotPrefixedEntries(directory: string): string[] {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.name.startsWith("."))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

describe("public path contract", () => {
  const rootEntries = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true });
  const rootFiles = rootEntries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => `/${entry.name}`);
  const rootDirectories = rootEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);

  it("lets every root-level public file past the staging gate", () => {
    const gated = rootFiles.filter((file) => !isStaticAssetPath(file));
    // Add new root-level public files to ROOT_PUBLIC_FILES, or staging
    // redirects them to /access (including next/image's cookieless fetch).
    expect(gated).toEqual([]);
  });

  it("lists only root-level files that exist in public/", () => {
    const missing = [...ROOT_PUBLIC_FILES].filter(
      (file) => !fs.existsSync(path.join(PUBLIC_DIR, file))
    );
    expect(missing).toEqual([]);
  });

  it("classifies every top-level public directory", () => {
    const unclassified = rootDirectories.filter(
      (directory) =>
        !PUBLIC_IMAGE_DIRECTORIES.has(directory) &&
        !GENERATED_PUBLIC_DIRECTORIES.has(directory) &&
        !SPECIAL_PUBLIC_DIRECTORIES.has(directory)
    );
    expect(unclassified).toEqual([]);
  });

  it("lets the encrypted-chat WebAssembly module past the gate", () => {
    const modules = listFiles(path.join(PUBLIC_DIR, "e2ee"))
      .filter((file) => file.endsWith(".wasm"))
      .map((file) => `/${file}`);
    expect(modules.length).toBeGreaterThan(0);
    expect(modules.filter((file) => !isStaticAssetPath(file))).toEqual([]);
  });

  it("lists only public image directories that exist", () => {
    const missing = [...PUBLIC_IMAGE_DIRECTORIES].filter(
      (directory) => !fs.existsSync(path.join(PUBLIC_DIR, directory))
    );
    expect(missing).toEqual([]);
  });

  it("lets every image under the public image directories past the gate", () => {
    const gated = [...PUBLIC_IMAGE_DIRECTORIES]
      .flatMap((directory) => listFiles(path.join(PUBLIC_DIR, directory)))
      .filter((file) => IMAGE_FILE_PATTERN.test(file))
      .map((file) => `/${file}`)
      .filter((file) => !isStaticAssetPath(file));
    expect(gated).toEqual([]);
  });

  // Proxy answers dot-prefixed paths (/.git, /.env, /.well-known/*) with a
  // plain 404 unless SERVED_WELL_KNOWN_PATHS lists the exact path.
  it("has no dot-prefixed public files that the 404 rule would shadow", () => {
    expect(listDotPrefixedEntries(PUBLIC_DIR)).toEqual([]);
  });

  it("has no dot-prefixed app routes besides .well-known", () => {
    expect(listDotPrefixedEntries(APP_DIR)).toEqual([
      path.join(APP_DIR, ".well-known"),
    ]);
  });

  it("allowlists exactly the routes under app/.well-known", () => {
    const wellKnownDir = path.join(APP_DIR, ".well-known");
    const routes = fs
      .readdirSync(wellKnownDir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /^route\.tsx?$/.test(entry.name))
      .map(
        (entry) =>
          `/.well-known/${path
            .relative(wellKnownDir, entry.parentPath)
            .split(path.sep)
            .join("/")}`
      );
    expect(routes).toHaveLength(SERVED_WELL_KNOWN_PATHS.size);
    expect(new Set(routes)).toEqual(SERVED_WELL_KNOWN_PATHS);
  });

  it("lets the served well-known files past the staging gate", () => {
    for (const pathname of SERVED_WELL_KNOWN_PATHS) {
      expect(isStaticAssetPath(pathname)).toBe(true);
    }
    expect(isStaticAssetPath("/.well-known/security.txt")).toBe(false);
  });
});

describe("isUnservableDotPath", () => {
  it.each([
    "/.git/HEAD",
    "/.env",
    "/.env.local",
    "/.well-known/security.txt",
    "/.well-known/",
    "/.well-known/assetlinks.json",
    "/.well-known/apple-app-site-association/",
    "/.well-known/Apple-App-Site-Association",
    "/%2ewell-known/apple-app-site-association",
    "/%2egit/HEAD",
    "/%2Eenv",
    "/punk6529/.config",
    "/api/.env",
  ])("treats %s as unservable", (pathname) => {
    expect(isUnservableDotPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/punk6529",
    "/punk6529.eth",
    "/the-memes/1.png",
    "/api/version",
    "/review-data/6529-stream/index.json",
    "/a..b",
    "/.well-known/apple-app-site-association",
  ])("leaves %s to normal routing", (pathname) => {
    expect(isUnservableDotPath(pathname)).toBe(false);
  });
});

describe("isRetiredReviewDataPath", () => {
  it.each([
    "/review-data",
    "/review-data/",
    "/review-data/6529-stream/index.json",
    "/review-data/6529-stream/versions/2026-09-09.1/sources/smart-contracts/core/StreamCore.sol",
    "/review-data/other-review/index.json",
    "/Review-Data/6529-stream/index.json",
    "/%72eview-data/6529-stream/index.json",
    "/review-data%2F6529-stream/index.json",
    "//review-data/6529-stream/index.json",
  ])("retires %s", (pathname) => {
    expect(isRetiredReviewDataPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/review-database",
    "/reviews/6529-stream",
    "/stream",
    "/api/review-data",
    "/%E0%A4%A",
  ])("leaves %s to normal routing", (pathname) => {
    expect(isRetiredReviewDataPath(pathname)).toBe(false);
  });
});
