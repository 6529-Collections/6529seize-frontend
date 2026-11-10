/** @jest-environment node */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");

// The shell HTML is the same for every visitor: the browser decides native
// iOS, the EULA gate and NFT purchasing.
it("reads no request data in the root layout", () => {
  expect(layout).not.toMatch(/from\s+["']next\/headers["']/);
  expect(layout).not.toMatch(/\bcookies\(/);
  expect(layout).not.toMatch(/\bheaders\(/);
});

// On Capacitor these hide the server HTML (an ungated, purchasing-free tree)
// before the body is parsed, until the commit that reveals the native layout
// also starts the EULA check. Native detection must stay synchronous, with
// only the legacy-browser checks ahead of it.
it("starts native detection synchronously after the legacy-browser checks", () => {
  const head = layout.slice(layout.indexOf("<head>"), layout.indexOf("</head>"));
  const stylesIndex = head.indexOf("__html: NATIVE_STARTUP_STYLES");
  const scriptIdIndex = head.indexOf('id="native-startup-bootstrap"');
  expect(stylesIndex).toBeGreaterThan(-1);
  expect(scriptIdIndex).toBeGreaterThan(stylesIndex);
  const scriptStart = head.lastIndexOf("<", scriptIdIndex);
  const legacyScripts =
    head.slice(0, scriptStart).match(/<script\b[^>]*>/gi) ?? [];
  expect(legacyScripts).toEqual([
    expect.stringContaining("LEGACY_BROWSER_FLAG_SCRIPT"),
    expect.stringContaining("LEGACY_BROWSER_SYNTAX_SCRIPT"),
    expect.stringContaining("LEGACY_BROWSER_NOTICE_SCRIPT"),
  ]);
  expect(legacyScripts.every((script) => script.startsWith("<script"))).toBe(
    true
  );
  const element = head.slice(scriptStart, head.indexOf("/>", scriptIdIndex));
  // Lowercase <script> is plain HTML; <Script> would wait for the Next runtime.
  expect(element).toMatch(/^<script\b/);
  expect(element).toContain("NATIVE_STARTUP_SCRIPT");
  expect(element).not.toMatch(/\s(?:async|defer|strategy)\b/);
});

// The browser reads these stamps from HTML so unchanged chunks stay cacheable.
it("renders the build stamp on the <html> start tag", () => {
  const htmlStart = layout.slice(
    layout.indexOf("<html"),
    layout.indexOf(">", layout.indexOf("<html"))
  );
  expect(htmlStart).toContain("data-version={publicEnv.VERSION}");
  expect(htmlStart).toContain(
    "data-release-order={publicEnv.VERSION_RELEASE_ORDER}"
  );
});

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(entryPath));
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

// The former `native-ios` cookie only let the server see the app. Nothing may
// gate on it again: the platform comes from Capacitor's runtime bridge.
it("keeps no reader of a native-ios cookie", () => {
  const roots = ["app", "components", "hooks", "lib", "services", "helpers"];
  const readers = roots
    .flatMap((root) => sourceFiles(path.join(process.cwd(), root)))
    .concat(path.join(process.cwd(), "proxy.ts"))
    .filter((file) => /["'`]native-ios["'`=]/.test(readFileSync(file, "utf8")))
    .map((file) => path.relative(process.cwd(), file));
  expect(readers).toEqual([]);
});
