import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type WorkflowStep = {
  readonly name?: string;
  readonly run?: string;
  readonly if?: string;
  readonly "continue-on-error"?: boolean;
  readonly env?: Readonly<Record<string, string>>;
  readonly with?: Readonly<Record<string, unknown>>;
};

type WorkflowJob = {
  readonly needs?: readonly string[];
  readonly if?: string;
  readonly permissions?: Readonly<Record<string, string>>;
  readonly steps: readonly WorkflowStep[];
};

function workflow(file: string): Readonly<{
  jobs: Readonly<Record<string, WorkflowJob>>;
}> {
  return YAML.parse(
    fs.readFileSync(
      path.join(process.cwd(), ".github", "workflows", file),
      "utf8"
    )
  );
}

function notification(file: string): {
  readonly job: WorkflowJob;
  readonly step: WorkflowStep;
} {
  const job = workflow(file).jobs["notify-ci-wave"];
  const step = job?.steps.find(({ name }) => name?.startsWith("Post "));
  if (!job || !step) {
    throw new Error(`${file} is missing its CI wave notification`);
  }
  return { job, step };
}

describe("WEB E2E CI wave notifications", () => {
  it.each([
    {
      file: "staging-e2e.yml",
      environment: "staging",
      needs: ["baseline-adoption-decision", "staging-packs"],
      pack: "${{ inputs.pack || 'all' }}",
      sha: "${{ inputs.expected_sha || needs.baseline-adoption-decision.outputs.deployed_sha }}",
      resultExpression: "needs.staging-packs.result",
    },
    {
      file: "production-e2e.yml",
      environment: "production",
      needs: ["readonly", "verify-evidence"],
      pack: "all",
      sha: "${{ needs.readonly.outputs.expected-sha }}",
      resultExpression: "needs.verify-evidence.result",
    },
  ])(
    "posts the terminal $environment validation outcome without changing it",
    ({ environment, file, needs, pack, sha, resultExpression }) => {
      const { job, step } = notification(file);

      expect(job.needs).toEqual(needs);
      expect(job.permissions).toEqual({ contents: "read" });
      expect(step).toMatchObject({
        if: "always() && hashFiles('.ci-wave-notifier/scripts/notify-ci-wave.mjs') != ''",
        "continue-on-error": true,
        run: "node .ci-wave-notifier/scripts/notify-ci-wave.mjs",
        env: {
          CI_PIPELINES_ALERT_TYPE: "web_e2e",
          CI_PIPELINES_TARGET_ENV: environment,
          CI_PIPELINES_SERVICE: "web",
          CI_PIPELINES_SHA: sha,
          CI_PIPELINES_PARENT_DEPLOY_RUN_ID:
            "${{ inputs.automatic_deploy_run_id }}",
          CI_PIPELINES_PARENT_RELEASE_TRAIN_ID:
            "${{ inputs.release_train_id }}",
          CI_PIPELINES_VALIDATION_PACK: pack,
        },
      });
      expect(step.env?.["CI_PIPELINES_STATUS"]).toContain(resultExpression);
      expect(step.env?.["CI_PIPELINES_TITLE"]).toContain(resultExpression);
      expect(step.env?.["CI_PIPELINES_TITLE"]).toContain("WEB E2E passed");
      expect(step.env?.["CI_PIPELINES_TITLE"]).toContain("WEB E2E failed");
    }
  );

  it("does not report an intentionally deferred automatic staging run", () => {
    const { job } = notification("staging-e2e.yml");
    const condition = job.if?.replace(/\s+/gu, " ").trim();

    expect(condition).toContain("needs.staging-packs.result != 'skipped'");
    expect(condition).toContain(
      "needs.baseline-adoption-decision.result == 'failure'"
    );
  });
});
