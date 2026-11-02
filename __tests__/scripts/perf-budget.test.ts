import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const YAML = require("yaml") as { parse: (text: string) => unknown };

type TargetBudget = {
  id: string;
  label?: string;
  route: string | null;
  chunks?: number;
  gzip_bytes?: number;
  brotli_bytes?: number;
};

type Budget = {
  schema_version: number;
  tolerance: { ratio: number; min_bytes: number };
  targets: TargetBudget[];
};

type Measurement = {
  targets: Record<
    string,
    { chunks: number; raw_bytes: number; gzip_bytes: number; brotli_bytes: number }
  >;
};

const {
  compare,
  measure,
  normalizeAssetPath,
  parseArgs,
  run,
  toleranceFor,
  updateBudget,
  validateBudget,
} = require("../../scripts/perf-budget.cjs") as {
  compare: (
    budget: Budget,
    measurement: Measurement
  ) => {
    rows: Array<{ id: string; status: string }>;
    failures: string[];
    warnings: string[];
  };
  measure: (options: { nextDir: string; budget: Budget }) => Measurement;
  normalizeAssetPath: (file: string) => string;
  parseArgs: (argv: string[]) => {
    update: boolean;
    report: string | null;
    nextDir: string;
  };
  run: (
    argv: string[],
    options: { cwd: string; stdout: { write: (text: string) => void }; env: Record<string, string | undefined> }
  ) => number;
  toleranceFor: (budgetBytes: number, tolerance: Budget["tolerance"]) => number;
  updateBudget: (budget: Budget, measurement: Measurement) => Budget;
  validateBudget: (budget: Budget) => void;
};

const BASE_BUDGET: Budget = {
  schema_version: 1,
  tolerance: { ratio: 0.005, min_bytes: 1024 },
  targets: [
    { id: "root", label: "Root layout", route: null },
    { id: "home", label: "Home", route: "(home)" },
    { id: "wave", label: "Wave", route: "waves/[wave]" },
  ],
};

function writeChunk(nextDir: string, name: string, content: string): string {
  const relative = `static/chunks/${name}`;
  fs.mkdirSync(path.join(nextDir, "static", "chunks"), { recursive: true });
  fs.writeFileSync(path.join(nextDir, relative), content);
  return relative;
}

function writeRouteManifest(
  nextDir: string,
  route: string,
  entryJSFiles: Record<string, string[]>
): void {
  const directory = path.join(nextDir, "server", "app", ...route.split("/"));
  fs.mkdirSync(directory, { recursive: true });
  const key = `/${route}/page`;
  fs.writeFileSync(
    path.join(directory, "page_client-reference-manifest.js"),
    [
      "globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};",
      `globalThis.__RSC_MANIFEST[${JSON.stringify(key)}] = ${JSON.stringify({
        moduleLoading: { prefix: "", crossOrigin: null },
        clientModules: {},
        entryCSSFiles: {},
        entryJSFiles,
      })};`,
    ].join("\n")
  );
}

function createBuild(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "perf-budget-"));
  const nextDir = path.join(root, ".next");
  const runtime = writeChunk(nextDir, "runtime.js", "r".repeat(4000));
  const layout = writeChunk(
    nextDir,
    "layout.js",
    Array.from({ length: 400 }, (_, index) => `layout${index};`).join("")
  );
  const home = writeChunk(
    nextDir,
    "home.js",
    Array.from({ length: 300 }, (_, index) => `home${index * 7};`).join("")
  );
  const wave = writeChunk(
    nextDir,
    "wave.js",
    Array.from({ length: 900 }, (_, index) => `wave${index * 13};`).join("")
  );
  fs.writeFileSync(
    path.join(nextDir, "build-manifest.json"),
    JSON.stringify({ rootMainFiles: [runtime], polyfillFiles: ["static/chunks/polyfill.js"] })
  );
  writeRouteManifest(nextDir, "(home)", {
    "[project]/app/layout": [layout],
    "[project]/app/error": [layout],
    "[project]/app/(home)/page": [`/_next/${layout}`, `/_next/${home}`],
  });
  // A Turbopack root above the project prefixes the project folder.
  writeRouteManifest(nextDir, "waves/[wave]", {
    "[project]/frontend/app/layout": [layout],
    "[project]/frontend/app/waves/layout": [wave],
    "[project]/frontend/app/waves/[wave]/page": [wave],
  });
  return root;
}

describe("first-load JavaScript budget", () => {
  it("normalizes build-relative, /_next and asset-prefixed chunk paths", () => {
    expect(normalizeAssetPath("static/chunks/a.js")).toBe("static/chunks/a.js");
    expect(normalizeAssetPath("/_next/static/chunks/a.js")).toBe(
      "static/chunks/a.js"
    );
    expect(
      normalizeAssetPath(
        "https://cdn.example/web_build/sha/_next/static/chunks/a.js"
      )
    ).toBe("static/chunks/a.js");
    expect(() => normalizeAssetPath("chunks/a.js")).toThrow(
      "Unexpected client asset path"
    );
  });

  it("measures the root baseline and each route's first-load union", () => {
    const root = createBuild();
    try {
      const measurement = measure({
        nextDir: path.join(root, ".next"),
        budget: BASE_BUDGET,
      });

      // root = rootMainFiles + root layout entry; polyfills are excluded.
      expect(measurement.targets["root"]!.chunks).toBe(2);
      // home adds its page chunk; the duplicate layout chunk counts once.
      expect(measurement.targets["home"]!.chunks).toBe(3);
      expect(measurement.targets["wave"]!.chunks).toBe(3);
      for (const id of ["home", "wave"]) {
        expect(measurement.targets[id]!.brotli_bytes).toBeGreaterThan(
          measurement.targets["root"]!.brotli_bytes
        );
        expect(measurement.targets[id]!.gzip_bytes).toBeGreaterThan(
          measurement.targets["root"]!.gzip_bytes
        );
      }
      expect(measurement.targets["root"]!.raw_bytes).toBe(
        4000 +
          Array.from({ length: 400 }, (_, index) => `layout${index};`).join("")
            .length
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("finds the root layout entry when Turbopack prefixes the project folder", () => {
    const root = createBuild();
    try {
      const measurement = measure({
        nextDir: path.join(root, ".next"),
        budget: {
          ...BASE_BUDGET,
          targets: BASE_BUDGET.targets.filter((target) => target.id !== "home"),
        },
      });
      expect(measurement.targets["root"]!.chunks).toBe(2);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed when a tracked route is missing from the build", () => {
    const root = createBuild();
    try {
      expect(() =>
        measure({
          nextDir: path.join(root, ".next"),
          budget: {
            ...BASE_BUDGET,
            targets: [
              ...BASE_BUDGET.targets,
              { id: "museum", route: "museum" },
            ],
          },
        })
      ).toThrow('Tracked route "museum" has no client reference manifest');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails growth beyond tolerance and warns when a budget is stale", () => {
    const budget = updateBudget(BASE_BUDGET, {
      targets: {
        root: { chunks: 2, raw_bytes: 1, gzip_bytes: 100_000, brotli_bytes: 80_000 },
        home: { chunks: 3, raw_bytes: 1, gzip_bytes: 300_000, brotli_bytes: 250_000 },
        wave: { chunks: 3, raw_bytes: 1, gzip_bytes: 400_000, brotli_bytes: 350_000 },
      },
    });
    expect(toleranceFor(80_000, budget.tolerance)).toBe(1024);
    expect(toleranceFor(350_000, budget.tolerance)).toBe(1750);

    const result = compare(budget, {
      targets: {
        // Within tolerance.
        root: { chunks: 2, raw_bytes: 1, gzip_bytes: 101_000, brotli_bytes: 80_900 },
        // Brotli over budget + tolerance.
        home: { chunks: 3, raw_bytes: 1, gzip_bytes: 300_000, brotli_bytes: 252_000 },
        // Well below budget.
        wave: { chunks: 2, raw_bytes: 1, gzip_bytes: 300_000, brotli_bytes: 250_000 },
      },
    });

    expect(result.rows.map((row) => [row.id, row.status])).toEqual([
      ["root", "ok"],
      ["home", "fail"],
      ["wave", "stale budget"],
    ]);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain("home (Home): brotli_bytes");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("perf:budget --update");
  });

  it("requires measured numbers for every target", () => {
    const result = compare(BASE_BUDGET, {
      targets: {
        root: { chunks: 1, raw_bytes: 1, gzip_bytes: 1, brotli_bytes: 1 },
        home: { chunks: 1, raw_bytes: 1, gzip_bytes: 1, brotli_bytes: 1 },
        wave: { chunks: 1, raw_bytes: 1, gzip_bytes: 1, brotli_bytes: 1 },
      },
    });
    expect(result.failures.join("\n")).toContain("budget gzip_bytes is missing");
  });

  it("rejects malformed budgets", () => {
    expect(() =>
      validateBudget({ ...BASE_BUDGET, schema_version: 2 })
    ).toThrow("schema_version");
    expect(() =>
      validateBudget({
        ...BASE_BUDGET,
        targets: BASE_BUDGET.targets.filter((target) => target.id !== "root"),
      })
    ).toThrow('track the "root" baseline');
    expect(() =>
      validateBudget({
        ...BASE_BUDGET,
        targets: [...BASE_BUDGET.targets, { id: "bad", route: "/museum" }],
      })
    ).toThrow("no leading slash");
  });

  it("updates the budget, then passes the check against the same build", () => {
    const root = createBuild();
    const writes: string[] = [];
    const stdout = { write: (text: string) => void writes.push(text) };
    try {
      const budgetPath = path.join(root, "budget.json");
      fs.writeFileSync(budgetPath, JSON.stringify(BASE_BUDGET));

      expect(
        run(["--", "--update", "--budget", budgetPath], {
          cwd: root,
          stdout,
          env: {},
        })
      ).toBe(0);
      const updated = JSON.parse(fs.readFileSync(budgetPath, "utf8")) as Budget;
      expect(updated.targets.every((target) => (target.brotli_bytes ?? 0) > 0)).toBe(
        true
      );

      const summaryPath = path.join(root, "summary.md");
      const reportPath = path.join(root, "out", "report.json");
      expect(
        run(["--budget", budgetPath, "--report", reportPath], {
          cwd: root,
          stdout,
          env: { GITHUB_STEP_SUMMARY: summaryPath },
        })
      ).toBe(0);
      expect(fs.readFileSync(summaryPath, "utf8")).toContain(
        "## First-load JavaScript budget"
      );
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as Measurement;
      expect(Object.keys(report.targets)).toEqual(["root", "home", "wave"]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects unknown arguments", () => {
    expect(parseArgs(["--", "--update"]).update).toBe(true);
    expect(() => parseArgs(["--json"])).toThrow("unknown argument --json");
    expect(() => parseArgs(["--report"])).toThrow("--report needs a value");
  });

  it("tracks the campaign routes in the committed budget", () => {
    const budget = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "scripts/perf-budget.json"), "utf8")
    ) as Budget;
    validateBudget(budget);
    expect(budget.targets.map((target) => target.route)).toEqual([
      null,
      "(home)",
      "waves/[wave]",
      "the-memes/[id]",
      "[user]/(profile)",
      "museum",
    ]);
    for (const target of budget.targets) {
      expect(target.brotli_bytes).toEqual(expect.any(Number));
      expect(target.gzip_bytes).toEqual(expect.any(Number));
      if (target.route !== null) {
        expect(
          fs.existsSync(path.join(process.cwd(), "app", ...target.route.split("/"), "page.tsx"))
        ).toBe(true);
      }
    }
  });

  it("runs after the PR production build", () => {
    const workflow = YAML.parse(
      fs.readFileSync(
        path.join(process.cwd(), ".github/workflows/app-pr-ci.yml"),
        "utf8"
      )
    ) as {
      jobs: Record<string, { steps?: Array<{ name?: string; if?: string; run?: string }> }>;
    };
    const steps = workflow.jobs["app-checks"]?.steps ?? [];
    const buildIndex = steps.findIndex(
      (step) => step.name === "Build production profile"
    );
    const budgetIndex = steps.findIndex(
      (step) => step.name === "Check first-load JavaScript budget"
    );
    expect(buildIndex).toBeGreaterThanOrEqual(0);
    expect(budgetIndex).toBe(buildIndex + 1);
    expect(steps[budgetIndex]).toMatchObject({ if: "matrix.lane == 'build'" });
    expect(steps[budgetIndex]?.run).toContain("./bin/6529 run perf:budget");

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    ) as { scripts: Record<string, string> };
    expect(packageJson.scripts["perf:budget"]).toBe(
      "node scripts/require-6529-command.cjs && node scripts/perf-budget.cjs"
    );
  });
});
