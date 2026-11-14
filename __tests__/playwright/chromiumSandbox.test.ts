import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const repoRoot = path.resolve(__dirname, "../..");
const LAUNCH_METHODS = new Set(["launch", "launchPersistentContext"]);

type LaunchSite = { readonly line: number; readonly sandboxed: boolean };

function listSourceFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.[cm]?[jt]sx?$/.test(file))
    .map((file) => path.join(dir, file));
}

function scriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (fileName.endsWith(".jsx")) return ts.ScriptKind.JSX;
  return /\.[cm]?js$/.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
}

// Quoted and computed string keys name the same option as identifiers.
function propertyName(node: ts.ObjectLiteralElementLike): string | undefined {
  const name = node.name;
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  if (
    ts.isComputedPropertyName(name) &&
    ts.isStringLiteralLike(name.expression)
  ) {
    return name.expression.text;
  }
  return undefined;
}

// Literal values such as `chromiumSandbox: false`, or the option in a comment
// or string, must not satisfy the guard: only the shared constant counts. A
// later spread or chromiumSandbox key could override it, so it must come last.
function hasSharedSandboxOption(node: ts.Node | undefined): boolean {
  if (!node || !ts.isObjectLiteralExpression(node)) return false;
  const lastOverride = [...node.properties]
    .reverse()
    .find(
      (property) =>
        ts.isSpreadAssignment(property) ||
        propertyName(property) === "chromiumSandbox"
    );
  return (
    !!lastOverride &&
    ts.isPropertyAssignment(lastOverride) &&
    propertyName(lastOverride) === "chromiumSandbox" &&
    ts.isIdentifier(lastOverride.initializer) &&
    lastOverride.initializer.text === "CHROMIUM_SANDBOX"
  );
}

function isLaunchCall(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    LAUNCH_METHODS.has(node.expression.name.text)
  );
}

// Every `launchOptions` property and direct launch call, parsed rather than
// pattern-matched so comments and strings are ignored.
function launchSites(source: string, fileName = "spec.ts"): LaunchSite[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(fileName)
  );
  const sites: LaunchSite[] = [];
  const record = (node: ts.Node, sandboxed: boolean) =>
    sites.push({
      line:
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1,
      sandboxed,
    });

  const visit = (node: ts.Node) => {
    if (
      (ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node)) &&
      propertyName(node) === "launchOptions"
    ) {
      record(
        node,
        ts.isPropertyAssignment(node) &&
          hasSharedSandboxOption(node.initializer)
      );
    }
    if (isLaunchCall(node)) {
      record(node, node.arguments.some(hasSharedSandboxOption));
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return sites;
}

describe("Playwright Chromium sandbox", () => {
  it("is applied by the Playwright config", () => {
    const sites = launchSites(
      fs.readFileSync(path.join(repoRoot, "playwright.config.ts"), "utf8")
    );

    expect(sites.length).toBeGreaterThan(0);
    expect(sites.filter((site) => !site.sandboxed)).toEqual([]);
  });

  // test.use({ launchOptions }) replaces the config value and direct launches
  // skip the config, so each of those sites must set the sandbox flag itself.
  it("is kept by every spec or helper that sets its own launch options", () => {
    const missing = listSourceFiles(path.join(repoRoot, "tests")).flatMap(
      (file) =>
        launchSites(fs.readFileSync(file, "utf8"), file)
          .filter((site) => !site.sandboxed)
          .map((site) => `${path.relative(repoRoot, file)}:${site.line}`)
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
      "test.use({ launchOptions: { chromiumSandbox: false } });",
      "test.use({ launchOptions: { /* chromiumSandbox: CHROMIUM_SANDBOX */ slowMo: 1 } });",
      'test.use({ launchOptions: { note: "chromiumSandbox: CHROMIUM_SANDBOX" } });',
      "test.use({ launchOptions });",
      'test.use({ "launchOptions": { slowMo: 1 } });',
      'test.use({ ["launchOptions"]: { slowMo: 1 } });',
      'test.use({ "launchOptions": { "chromiumSandbox": CHROMIUM_SANDBOX } });',
      "test.use({ launchOptions: { chromiumSandbox: CHROMIUM_SANDBOX, ...overrides } });",
      "test.use({ launchOptions: { chromiumSandbox: CHROMIUM_SANDBOX, chromiumSandbox: false } });",
      "test.use({ launchOptions: { ...defaults, chromiumSandbox: CHROMIUM_SANDBOX } });",
    ].join("\n");

    expect(
      launchSites(source)
        .filter((site) => !site.sandboxed)
        .map((site) => site.line)
    ).toEqual([2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14]);
  });

  it("parses TSX helpers", () => {
    const source = [
      "const fixture = <div data-testid='fixture' />;",
      "test.use({ launchOptions: { slowMo: 1 } });",
    ].join("\n");

    expect(launchSites(source, "fixture.tsx")).toEqual([
      { line: 2, sandboxed: false },
    ]);
  });
});
