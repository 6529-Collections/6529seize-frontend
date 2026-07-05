import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ANY_CASTS_PATTERN, countImportStatements, countLines, countMatches } =
  require(path.join(process.cwd(), "scripts", "debt-ratchet.cjs")) as {
    ANY_CASTS_PATTERN: RegExp;
    countImportStatements: (content: string, packages: string[]) => number;
    countLines: (content: string) => number;
    countMatches: (content: string, pattern: RegExp) => number;
  };

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "debt-ratchet.cjs");

const runRatchet = (root: string, args: string[] = []) =>
  spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
    env: { ...process.env, DEBT_RATCHET_ROOT: root, GITHUB_ACTIONS: "" },
  });

describe("debt-ratchet counting helpers", () => {
  it("counts explicit any annotations and casts", () => {
    const content = [
      "const a: any = 1;",
      "const b = value as any;",
      "const c: any[] = [];",
      "const many = anything; // not a match",
      "function f(x: number): number { return x; }",
    ].join("\n");
    expect(countMatches(content, ANY_CASTS_PATTERN)).toBe(3);
  });

  it("counts any used as a generic type argument", () => {
    const content = [
      "const a = useState<any>();",
      "const b = useState<any[]>([]);",
      "const c: Record<string, any> = {};", // ": Record" is not ": any"
      "const d = new Map<any, string>();",
      "const e = new Map<string, any>();",
      "const f = fetchJson<any>(url);",
      "type G = Promise<any> | undefined;",
      "type H = Wrapped< any >;", // whitespace inside the generic
      "const both = new Map<any, any>();", // two arguments, two matches
    ].join("\n");
    expect(countMatches(content, ANY_CASTS_PATTERN)).toBe(10);
  });

  it("does not count prose or identifiers that merely contain any", () => {
    const content = [
      "// smaller than any of the configured values",
      "// applies to, any websites hosted at sub-domains",
      "// placeholder form: <any-string>",
      "const cmp = a < anyLimit && b > anyFloor;",
      "const word = many < anyone.count;",
      'const text = "pick any, or all, of the options";',
      "type Tuple = [unknown, string];",
    ].join("\n");
    expect(countMatches(content, ANY_CASTS_PATTERN)).toBe(0);
  });

  it("counts TODO markers without matching longer words", () => {
    const content = "// TODO one\n// FIXME two\n// HACKATHON is fine\n";
    expect(countMatches(content, /\b(?:TODO|FIXME|HACK)\b/g)).toBe(2);
  });

  it("counts import statements for the target packages only", () => {
    const content = [
      'import Button from "react-bootstrap/Button";',
      'import "bootstrap/dist/css/bootstrap.min.css";',
      'const redux = require("react-redux");',
      'export { thing } from "@reduxjs/toolkit";',
      'import notMatched from "bootstrap-icons-lookalike";',
      'import alsoNotMatched from "ng-bootstrap";',
      'import stillNot from "my-react-redux-utils";',
      'import other from "some-lib";',
      '@import "bootstrap/scss/functions";',
      "@use '~bootstrap/scss/mixins';",
    ].join("\n");
    expect(
      countImportStatements(content, ["react-bootstrap", "bootstrap"])
    ).toBe(4);
    expect(
      countImportStatements(content, ["react-redux", "@reduxjs/toolkit"])
    ).toBe(2);
  });

  it("counts lines like wc -l regardless of trailing newline", () => {
    expect(countLines("")).toBe(0);
    expect(countLines("one\ntwo\n")).toBe(2);
    expect(countLines("one\ntwo")).toBe(2);
  });
});

describe("debt-ratchet check mode", () => {
  let root: string;

  const writeFixture = (relativePath: string, content: string) => {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "debt-ratchet-"));
    writeFixture(
      "components/Sample.tsx",
      'const a: any = 1;\n// TODO tidy\nimport { useSelector } from "react-redux";\n'
    );
    writeFixture(
      "components/__tests__/Ignored.test.tsx",
      "const ignored: any = 1;\n"
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("fails when the baseline is missing", () => {
    const result = runRatchet(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Baseline not found");
  });

  it("passes when counts match the baseline and excludes test trees", () => {
    expect(runRatchet(root, ["--update"]).status).toBe(0);
    const baseline = JSON.parse(
      fs.readFileSync(
        path.join(root, "scripts/debt-ratchet-baseline.json"),
        "utf8"
      )
    );
    expect(baseline.counts.any_casts).toBe(1);
    expect(baseline.counts.todo_comments).toBe(1);
    expect(baseline.counts.redux_imports).toBe(1);

    const check = runRatchet(root);
    expect(check.status).toBe(0);
    expect(check.stdout).toContain("Debt ratchet passed.");
  });

  it("fails when a count rises above the baseline", () => {
    expect(runRatchet(root, ["--update"]).status).toBe(0);
    writeFixture("components/New.tsx", "const oops = value as any;\n");

    const check = runRatchet(root);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("any_casts rose from 1 to 2");
  });

  it("fails on a new oversized file even when the total stays level", () => {
    writeFixture("components/Old.tsx", "const line = 1;\n".repeat(900));
    expect(runRatchet(root, ["--update"]).status).toBe(0);

    fs.rmSync(path.join(root, "components/Old.tsx"));
    writeFixture("components/Swapped.tsx", "const line = 1;\n".repeat(900));

    const check = runRatchet(root);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("components/Swapped.tsx exceeds 800 lines");
  });

  it("passes with a stale-baseline warning when counts drop", () => {
    expect(runRatchet(root, ["--update"]).status).toBe(0);
    writeFixture("components/Sample.tsx", "export const clean = 1;\n");

    const check = runRatchet(root);
    expect(check.status).toBe(0);
    expect(check.stdout).toContain("stale baseline");
    expect(check.stdout).toContain("--update");
  });

  it("fails on a baseline schema-version mismatch", () => {
    expect(runRatchet(root, ["--update"]).status).toBe(0);
    const baselinePath = path.join(root, "scripts/debt-ratchet-baseline.json");
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    baseline.schema_version = 999;
    fs.writeFileSync(baselinePath, JSON.stringify(baseline));

    const check = runRatchet(root);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("schema_version 999 does not match");
  });

  it("emits the baseline shape from --json", () => {
    const result = runRatchet(root, ["--json"]);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(Object.keys(parsed).sort()).toEqual([
      "counts",
      "max_source_file_lines",
      "oversized_file_allowlist",
      "schema_version",
    ]);
    expect(Object.keys(parsed.counts).sort()).toEqual([
      "any_casts",
      "bootstrap_imports",
      "oversized_files",
      "pages_router_files",
      "redux_imports",
      "todo_comments",
    ]);
  });

  it("prints per-file counts from --details", () => {
    const result = runRatchet(root, ["--details", "any_casts"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("components/Sample.tsx");
    expect(result.stdout).toMatch(/^\s*1\s+components\/Sample\.tsx/m);

    const unknown = runRatchet(root, ["--details", "nope"]);
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toContain('Unknown metric "nope"');
  });
});
