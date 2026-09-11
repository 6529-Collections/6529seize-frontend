import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";

type Step = {
  id?: string;
  name?: string;
  if?: string;
  run?: string;
  env?: Record<string, string>;
};
const workflow = parse(
  readFileSync(".github/workflows/app-pr-ci.yml", "utf8")
) as {
  jobs: Record<string, { steps: Step[]; permissions?: Record<string, string> }>;
};
const outputStep = workflow.jobs["plan"]!.steps.find(
  (step) => step.id === "plan_outputs"
)!;
const script = outputStep.run!.split("node <<'NODE'\n")[1]!.split("\nNODE")[0]!;
function select(files: string[]) {
  const outputs: Record<string, string> = {};
  const plan = {
    risk: { computed_floor: 1 },
    changed_files: files,
    checks: {
      build: { required: false },
      playwright_smoke: { required: false },
      playwright_critical_shell: { required: false },
      playwright_museum: { required: false },
    },
  };
  runInNewContext(script, {
    require: (name: string) => {
      if (name !== "node:fs") throw new Error("Unexpected module");
      return {
        readFileSync: () => JSON.stringify(plan),
        appendFileSync: (_path: string, line: string) => {
          const separator = line.indexOf("=");
          outputs[line.slice(0, separator)] = line.slice(separator + 1).trim();
        },
      };
    },
    process: {
      env: {
        GITHUB_OUTPUT: "output",
        DEFAULT_CI_RUNNER: "ubuntu-latest",
        BUILD_CI_RUNNER: "ubuntu-latest",
      },
    },
  });
  return outputs;
}
it.each([
  "components/collect/CollectTradeForm.tsx",
  "components/the-memes/MemePageLiveStats.tsx",
  "tests/collect/collect-public.spec.ts",
  "components/user/collected/stats/useCollectedStatsData.ts",
  "generated/models/ApiMarketOperation.ts",
  ".github/workflows/app-pr-ci.yml",
])("requires the existing smoke lane and Collect pack for %s", (file) => {
  const outputs = select([file]);
  expect(outputs["playwright_collect_required"]).toBe("true");
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toMatchObject({
    include: [{ lane: "playwright-smoke" }],
  });
});
it("does not add Collect browser work for unrelated documentation", () => {
  const outputs = select(["ops/docs/about/some-guide.md"]);
  expect(outputs["playwright_collect_required"]).toBe("false");
  expect(outputs["core_playwright_required"]).toBe("false");
});
it("runs only the isolated Collect spec on both supported browser viewports", () => {
  const job = workflow.jobs["core-playwright-checks"]!;
  const step = job.steps.find(
    (item) => item.name === "Run Collect public browser pack"
  )!;
  expect(step.if).toContain("matrix.lane == 'playwright-smoke'");
  expect(step.if).toContain(
    "needs.plan.outputs.playwright_collect_required == 'true'"
  );
  expect(step.env?.["PLAYWRIGHT_READONLY"]).toBe("1");
  expect(step.run).toContain(
    "playwright test tests/collect/collect-public.spec.ts"
  );
  expect(step.run).toContain("--project=web-desktop-chromium");
  expect(step.run).toContain("--project=web-mobile-chromium");
  expect(step.run).toContain("--workers=1");
  expect(job.permissions).toEqual({ contents: "read", issues: "read" });
});
