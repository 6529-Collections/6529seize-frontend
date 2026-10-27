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
function select(
  files: string[],
  extraChecks: Record<string, { required: boolean }> = {}
) {
  const outputs: Record<string, string> = {};
  const plan = {
    risk: { computed_floor: 1 },
    changed_files: files,
    checks: {
      build: { required: false },
      playwright_smoke: { required: false },
      playwright_critical_shell: { required: false },
      playwright_museum: { required: false },
      playwright_artwork_documentation: { required: false },
      ...extraChecks,
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
it("schedules submission artwork separately without replacing competition coverage", () => {
  const outputs = select([], {
    playwright_submission_artwork: { required: true },
    playwright_native_competition: { required: true },
  });
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toEqual({
    include: [
      {
        lane: "playwright-native-competition",
        label: "Native competitions shard 1/2",
        runner: "ubuntu-latest",
        shard: 1,
      },
      {
        lane: "playwright-native-competition",
        label: "Native competitions shard 2/2",
        runner: "ubuntu-latest",
        shard: 2,
      },
      {
        lane: "playwright-submission-artwork",
        label: "Submission artwork desktop and mobile",
        runner: "ubuntu-latest",
      },
    ],
  });
});

it.each([
  "components/collect/CollectTradeForm.tsx",
  "components/nft-market-depth/MarketDepthPriceLevels.tsx",
  "components/the-memes/MemePageLiveStats.tsx",
  "tests/collect/collect-public.spec.ts",
  "components/user/collected/stats/useCollectedStatsData.ts",
  "generated/models/ApiMarketOperation.ts",
  ".github/workflows/app-pr-ci.yml",
])("requires the existing smoke lane and Collect pack for %s", (file) => {
  const outputs = select([file]);
  expect(outputs["playwright_collect_required"]).toBe("true");
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toMatchObject({
    include: expect.arrayContaining([
      expect.objectContaining({ lane: "playwright-smoke" }),
    ]),
  });
});
it("does not add Collect browser work for unrelated documentation", () => {
  const outputs = select(["ops/docs/about/some-guide.md"]);
  expect(outputs["playwright_collect_required"]).toBe("false");
  expect(outputs["core_playwright_required"]).toBe("false");
});
it.each([
  "i18n/messages/en-US.ts",
  "i18n/messages/wave-creation.en-US.json",
  "components/waves/create-wave/CreateWave.tsx",
  "tests/social/create-wave-sandbox.spec.ts",
])("selects the wave creation browser lane for %s", (file) => {
  const outputs = select([file]);
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toEqual({
    include: [
      {
        lane: "playwright-wave-creation",
        label: "Wave creation desktop and mobile",
        runner: "ubuntu-latest",
      },
    ],
  });
  expect(outputs["core_playwright_required"]).toBe("true");
});
it("does not select wave creation for unrelated locale messages", () => {
  const outputs = select(["i18n/messages/collect.ts"]);
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toEqual({
    include: [
      {
        lane: "playwright-smoke",
        label: "Playwright smoke",
        runner: "ubuntu-latest",
      },
    ],
  });
});
it("selects every core browser lane when their shared workflow changes", () => {
  const outputs = select([".github/workflows/app-pr-ci.yml"]);
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toEqual({
    include: [
      {
        lane: "playwright-smoke",
        label: "Playwright smoke",
        runner: "ubuntu-latest",
      },
      {
        lane: "playwright-wave-creation",
        label: "Wave creation desktop and mobile",
        runner: "ubuntu-latest",
      },
      {
        lane: "playwright-drop-editing",
        label: "Drop editing desktop and mobile",
        runner: "ubuntu-latest",
      },
    ],
  });
});
it("runs the isolated Collect and market specs on both supported browser viewports", () => {
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
  expect(step.run).toContain(
    "tests/collect/memelab-marketplace-public.spec.ts"
  );
  expect(step.run).toContain("--project=web-desktop-chromium");
  expect(step.run).toContain("--project=web-mobile-chromium");
  expect(step.run).toContain("--workers=1");
  expect(job.permissions).toEqual({ contents: "read", issues: "read" });
});

it("partitions the full native competition pack across two uniquely identified jobs", () => {
  const outputs = select([], {
    playwright_native_competition: { required: true },
  });
  expect(JSON.parse(outputs["core_playwright_matrix"]!)).toEqual({
    include: [
      {
        lane: "playwright-native-competition",
        label: "Native competitions shard 1/2",
        runner: "ubuntu-latest",
        shard: 1,
      },
      {
        lane: "playwright-native-competition",
        label: "Native competitions shard 2/2",
        runner: "ubuntu-latest",
        shard: 2,
      },
    ],
  });
  const job = workflow.jobs["core-playwright-checks"]!;
  const step = job.steps.find(
    (item) => item.name === "Run native competition browser regression pack"
  )!;
  expect(step.run).toBe(
    './bin/6529 run test:e2e:native-competition-sandbox --shard="$NATIVE_COMPETITION_SHARD"'
  );
  expect(step.env?.["NATIVE_COMPETITION_SHARD"]).toBe("${{ matrix.shard }}/2");
  const upload = job.steps.find(
    (item) => item.name === "Upload app check artifacts"
  )!;
  expect(upload).toHaveProperty(
    "with.name",
    "app-pr-ci-results-${{ matrix.lane }}${{ matrix.shard && format('-{0}', matrix.shard) || '' }}-${{ github.event.pull_request.number || github.run_id }}"
  );
});
