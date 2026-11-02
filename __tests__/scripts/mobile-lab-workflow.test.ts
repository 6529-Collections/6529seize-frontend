import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";
import YAML from "yaml";

const workflow = YAML.parse(
  fs.readFileSync(".github/workflows/mobile-lab.yml", "utf8")
);
const chooseSite = workflow.jobs.measure.steps.find(
  (step: { id?: string }) => step.id === "target"
);
const repository = "6529-Collections/6529seize-frontend";
const productionPath = ".github/workflows/build-upload-deploy-prod.yml";
const stagingPath = ".github/workflows/deploy-staging.yml";
const gitBash = path.join(
  process.env["ProgramFiles"] ?? "",
  "Git/bin/bash.exe"
);
const bash =
  process.platform === "win32" && fs.existsSync(gitBash) ? gitBash : "bash";

function context(
  workflowPath = productionPath,
  name = "Production deploy abc"
) {
  return {
    github: {
      event_name: "workflow_run",
      repository,
      event: {
        workflow_run: {
          path: workflowPath,
          name,
          conclusion: "success",
          head_repository: { full_name: repository },
        },
      },
    },
    inputs: { target: "", pages: "" },
  };
}

type Context = ReturnType<typeof context>;

// These workflow expressions use only property reads, equality, && and ||,
// whose semantics match JavaScript for the strings and booleans in the fixtures.
function evaluate(expression: string, fixture: Context) {
  return runInNewContext(expression, fixture, { timeout: 1000 });
}

function interpolate(template: string, fixture: Context) {
  return template.replace(/\$\{\{([\s\S]*?)\}\}/g, (_, expression: string) =>
    String(evaluate(expression, fixture))
  );
}

function choose(fixture: Context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mobile-lab-target-"));
  try {
    const outputFile = path.join(root, "outputs");
    const env = Object.fromEntries(
      Object.entries(chooseSite.env).map(([key, value]) => [
        key,
        interpolate(String(value), fixture),
      ])
    );
    const result = spawnSync(bash, ["-c", chooseSite.run], {
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        ...env,
        GITHUB_OUTPUT: outputFile.replaceAll("\\", "/"),
      },
    });
    expect(result.error).toBeUndefined();
    return {
      status: result.status,
      stderr: result.stderr,
      output: fs.existsSync(outputFile)
        ? Object.fromEntries(
            fs
              .readFileSync(outputFile, "utf8")
              .trim()
              .split("\n")
              .map((line) => line.split("="))
          )
        : {},
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("Mobile lab deployment routing", () => {
  it.each([
    "Production deploy 548c96fbab74aba70f7c97b8d02511815059601e",
    `Production deploy ${"b".repeat(40)}`,
    "Web Deploy - PROD",
  ])("routes production title %s by its workflow path", (title) => {
    const fixture = context(productionPath, title);
    expect(choose(fixture)).toMatchObject({
      status: 0,
      output: {
        target: "production",
        base: "https://6529.io",
        pages: "home,waves,meme,museum",
      },
    });
    expect(interpolate(workflow.concurrency.group, fixture)).toBe(
      "mobile-lab-production"
    );
  });

  it.each(["Web Deploy - STAGING", "Staging deploy renamed title"])(
    "routes staging title %s by its workflow path",
    (title) => {
      const fixture = context(stagingPath, title);
      expect(choose(fixture)).toMatchObject({
        status: 0,
        output: {
          target: "staging",
          base: "https://staging.6529.io",
          pages: "home,waves,meme,museum",
        },
      });
      expect(interpolate(workflow.concurrency.group, fixture)).toBe(
        "mobile-lab-staging"
      );
    }
  );

  it.each([
    ["staging", "https://staging.6529.io"],
    ["production", "https://6529.io"],
  ])("preserves manual %s dispatch and page selection", (target, base) => {
    const fixture = context("", "");
    fixture.github.event_name = "workflow_dispatch";
    fixture.inputs = { target, pages: "home,museum" };
    expect(choose(fixture)).toMatchObject({
      status: 0,
      output: { target, base, pages: "home,museum" },
    });
    expect(interpolate(workflow.concurrency.group, fixture)).toBe(
      `mobile-lab-${target}`
    );
    expect(evaluate(workflow.jobs.measure.if, fixture)).toBe(true);
  });

  it.each(["", ".github/workflows/unexpected.yml"])(
    "rejects unrecognized workflow path %s even with the expected display title",
    (workflowPath) => {
      const fixture = context(workflowPath, "Web Deploy - PROD");
      expect(choose(fixture)).toMatchObject({
        status: 1,
        stderr: expect.stringContaining("Unexpected workflow:"),
        output: {},
      });
      expect(interpolate(workflow.concurrency.group, fixture)).toBe(
        "mobile-lab-unexpected"
      );
    }
  );

  it("rejects invalid manual targets before emitting outputs", () => {
    const fixture = context();
    fixture.github.event_name = "workflow_dispatch";
    fixture.inputs.target = "unexpected";
    expect(choose(fixture)).toMatchObject({
      status: 1,
      stderr: expect.stringContaining("Unexpected target:"),
      output: {},
    });
  });

  it("requires successful same-repository deployments", () => {
    const fixture = context();
    expect(evaluate(workflow.jobs.measure.if, fixture)).toBe(true);
    fixture.github.event.workflow_run.conclusion = "failure";
    expect(evaluate(workflow.jobs.measure.if, fixture)).toBe(false);
    fixture.github.event.workflow_run.conclusion = "success";
    fixture.github.event.workflow_run.head_repository.full_name = "other/fork";
    expect(evaluate(workflow.jobs.measure.if, fixture)).toBe(false);
  });

  it("keeps deploy subscriptions, read-only permissions and non-cancelling queues", () => {
    expect(workflow.on.workflow_run).toEqual({
      workflows: ["Web Deploy - STAGING", "Web Deploy - PROD"],
      types: ["completed"],
      branches: ["1a-staging", "main"],
    });
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.jobs.measure.permissions).toEqual({ contents: "read" });
    expect(workflow.concurrency["cancel-in-progress"]).toBe(false);
    expect(
      workflow.jobs.measure.steps.find(
        (step: { name: string }) =>
          step.name === "Check out the measurement scripts"
      ).with["persist-credentials"]
    ).toBe(false);
  });
});
