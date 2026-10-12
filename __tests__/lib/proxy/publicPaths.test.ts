/**
 * @jest-environment node
 */

import fs from "node:fs";
import path from "node:path";
import {
  isStaticAssetPath,
  isUnservableDotPath,
  PUBLIC_IMAGE_DIRECTORIES,
  ROOT_PUBLIC_FILES,
} from "@/lib/proxy/publicPaths";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const APP_DIR = path.join(process.cwd(), "app");
// Generated before dev/build and handled by its own segment prefix.
const GENERATED_PUBLIC_DIRECTORIES = new Set(["pdfjs"]);
// Gated by proxy's exact `/review-data/6529-stream/` rule instead.
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

  // Proxy answers every dot-prefixed path (/.git, /.env, /.well-known/*) with
  // a plain 404. Adding such a file or route needs an allowlist there first.
  it("has no dot-prefixed public files that the 404 rule would shadow", () => {
    expect(listDotPrefixedEntries(PUBLIC_DIR)).toEqual([]);
  });

  it("has no dot-prefixed app routes that the 404 rule would shadow", () => {
    expect(listDotPrefixedEntries(APP_DIR)).toEqual([]);
  });
});

describe("isUnservableDotPath", () => {
  it.each([
    "/.git/HEAD",
    "/.env",
    "/.env.local",
    "/.well-known/security.txt",
    "/.well-known/",
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
  ])("leaves %s to normal routing", (pathname) => {
    expect(isUnservableDotPath(pathname)).toBe(false);
  });
});
