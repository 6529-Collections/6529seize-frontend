import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const BROWSER_LAUNCH_PATTERN =
  /\blaunchOptions\b|\blaunchPersistentContext\(|\.launch\(/;

function listSourceFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.[cm]?[jt]s$/.test(file))
    .map((file) => path.join(dir, file));
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
  // skip the config, so each of them must set the sandbox flag itself.
  it("is kept by every spec or helper that sets its own launch options", () => {
    const missing = listSourceFiles(path.join(repoRoot, "tests"))
      .filter((file) => {
        const source = fs.readFileSync(file, "utf8");
        return (
          BROWSER_LAUNCH_PATTERN.test(source) &&
          !source.includes("CHROMIUM_SANDBOX")
        );
      })
      .map((file) => path.relative(repoRoot, file));

    expect(missing).toEqual([]);
  });
});
