import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const LAUNCH_SITE_PATTERN =
  /\blaunchOptions\s*:\s*|\blaunchPersistentContext\(|\.launch\(/g;

function listSourceFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.[cm]?[jt]s$/.test(file))
    .map((file) => path.join(dir, file));
}

// Returns the bracketed expression that opens at `start`, or null when the
// value there is not an inline object or call (for example a variable).
function bracketedExpression(source: string, start: number): string | null {
  if (!/[({]/.test(source.charAt(start))) return null;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source.charAt(index);
    if (char === "(" || char === "{") depth += 1;
    if (char === ")" || char === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  return null;
}

function launchSitesWithoutSandbox(source: string): number[] {
  const lines: number[] = [];
  for (const match of source.matchAll(LAUNCH_SITE_PATTERN)) {
    const matchEnd = match.index + match[0].length;
    const start = match[0].endsWith("(") ? matchEnd - 1 : matchEnd;
    const expression = bracketedExpression(source, start);
    if (!expression?.includes("chromiumSandbox")) {
      lines.push(source.slice(0, match.index).split("\n").length);
    }
  }
  return lines;
}

describe("Playwright Chromium sandbox", () => {
  it("is applied by the Playwright config", () => {
    const config = fs.readFileSync(
      path.join(repoRoot, "playwright.config.ts"),
      "utf8"
    );

    expect(config).toContain(
      "launchOptions: { chromiumSandbox: CHROMIUM_SANDBOX }"
    );
  });

  // test.use({ launchOptions }) replaces the config value and direct launches
  // skip the config, so each of those sites must set the sandbox flag itself.
  it("is kept by every spec or helper that sets its own launch options", () => {
    const missing = listSourceFiles(path.join(repoRoot, "tests")).flatMap(
      (file) =>
        launchSitesWithoutSandbox(fs.readFileSync(file, "utf8")).map(
          (line) => `${path.relative(repoRoot, file)}:${line}`
        )
    );

    expect(missing).toEqual([]);
  });

  it("checks each launch site rather than the whole file", () => {
    const source = [
      "test.use({ launchOptions: { chromiumSandbox: CHROMIUM_SANDBOX } });",
      "test.use({ launchOptions: { slowMo: 1 } });",
      "await chromium.launch();",
      "await chromium.launch({ chromiumSandbox: CHROMIUM_SANDBOX });",
      "test.use({ launchOptions: sharedOptions });",
    ].join("\n");

    expect(launchSitesWithoutSandbox(source)).toEqual([2, 3, 5]);
  });
});
