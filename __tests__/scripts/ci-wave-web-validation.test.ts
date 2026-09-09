import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type WorkflowStep = {
  readonly name?: string;
  readonly env?: Readonly<Record<string, string>>;
};

type WorkflowJob = {
  readonly needs?: readonly string[];
  readonly secrets?: Readonly<Record<string, string>>;
  readonly steps?: readonly WorkflowStep[];
  readonly with?: Readonly<Record<string, string>>;
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

function step(job: WorkflowJob, name: string): WorkflowStep {
  const match = job.steps?.find((candidate) => candidate.name === name);
  if (!match) throw new Error(`${name} is missing`);
  return match;
}

function job(
  parsed: Readonly<{ jobs: Readonly<Record<string, WorkflowJob>> }>,
  name: string
): WorkflowJob {
  const match = parsed.jobs[name];
  if (!match) throw new Error(`${name} is missing`);
  return match;
}

describe("frontend CI wave WEB E2E lifecycle", () => {
  const stagingDeploy = workflow("deploy-staging.yml");
  const stagingE2e = workflow("staging-e2e.yml");
  const productionDeploy = workflow("build-upload-deploy-prod.yml");
  const productionE2e = workflow("production-e2e.yml");

  it("posts the staging deploy before automatic E2E and preserves its reply identity", () => {
    const deployment = job(stagingDeploy, "notify-staging-outcome");
    const success = step(deployment, "Notify CI wave about success");

    expect(deployment.needs).toEqual([
      "build-staging-artifact",
      "deploy-staging",
    ]);
    expect(success.env).toMatchObject({
      CI_PIPELINES_ALERT_TYPE: "deploy",
      CI_PIPELINES_TITLE: "WEB deploy complete",
    });
  });

  it("posts the production deploy before automatic E2E and preserves its reply identity", () => {
    const deployment = job(productionDeploy, "notify-production-deployment");
    const success = step(deployment, "Notify CI wave about success");

    expect(deployment.needs).toEqual([
      "build-production-artifact",
      "resolve-production-artifact",
      "verify-production-artifact",
      "build-upload-deploy",
    ]);
    expect(success.env).toMatchObject({
      CI_PIPELINES_ALERT_TYPE: "deploy",
      CI_PIPELINES_TITLE: "WEB deploy complete",
    });
  });

  it.each([
    [stagingE2e, "staging", "staging-packs", "all"],
    [productionE2e, "production", "readonly", "all"],
  ] as const)(
    "keeps the live %s WEB E2E notification contract",
    (parsed, environment, resultJob, pack) => {
      const notification = job(parsed, "notify-ci-wave");
      const post = step(
        notification,
        `Post ${environment} WEB validation outcome`
      );

      expect(notification.needs).toBe(resultJob);
      expect(post.env).toMatchObject({
        CI_PIPELINES_ALERT_TYPE: "web_e2e",
        CI_PIPELINES_TARGET_ENV: environment,
        CI_PIPELINES_VALIDATION_PACK:
          environment === "staging" ? "${{ inputs.pack || 'all' }}" : pack,
        CI_PIPELINES_PARENT_DEPLOY_RUN_ID:
          "${{ inputs.automatic_deploy_run_id }}",
      });
      expect(post.env?.["CI_PIPELINES_TITLE"]).toContain("WEB E2E passed");
      expect(JSON.stringify(parsed)).not.toContain("release_validation");
    }
  );

  it("contains no release-note validation sender", () => {
    expect(JSON.stringify(stagingDeploy)).not.toContain("release_validation");
    expect(JSON.stringify(productionDeploy)).not.toContain(
      "release_validation"
    );
    expect(JSON.stringify(stagingE2e)).not.toContain("release_validation");
    expect(JSON.stringify(productionE2e)).not.toContain("release_validation");
  });
});
