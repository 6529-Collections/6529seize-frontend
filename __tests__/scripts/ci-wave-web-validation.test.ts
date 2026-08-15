import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type WorkflowStep = {
  readonly name?: string;
  readonly env?: Readonly<Record<string, string>>;
};

type WorkflowJob = {
  readonly needs?: readonly string[];
  readonly steps?: readonly WorkflowStep[];
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

describe("frontend CI wave validation lifecycle", () => {
  const stagingDeploy = workflow("deploy-staging.yml");
  const stagingE2e = workflow("staging-e2e.yml");
  const productionDeploy = workflow("build-upload-deploy-prod.yml");
  const productionE2e = workflow("production-e2e.yml");

  it("posts one aggregate staging pipeline result after automatic E2E", () => {
    const notification = job(stagingDeploy, "notify-staging-outcome");

    expect(notification.needs).toEqual([
      "build-staging-artifact",
      "deploy-staging",
      "automatic-staging-e2e",
    ]);
    expect(
      notification.steps?.some(
        (candidate) =>
          candidate.env?.["CI_PIPELINES_ALERT_TYPE"] === "web_e2e" ||
          candidate.env?.["CI_PIPELINES_NOTIFICATION_TYPE"] ===
            "release_validation"
      )
    ).toBe(false);
    expect(JSON.stringify(stagingE2e)).not.toContain('"web_e2e"');
  });

  it("keeps production deployment status separate from release validation", () => {
    const deployment = job(productionDeploy, "notify-production-deployment");
    const validation = job(productionDeploy, "notify-production-validation");

    expect(deployment.needs).toEqual([
      "build-production-artifact",
      "verify-production-artifact",
      "build-upload-deploy",
    ]);
    expect(validation.needs).toEqual([
      "build-upload-deploy",
      "automatic-production-e2e",
    ]);
    expect(
      validation.steps?.filter(
        (candidate) =>
          candidate.env?.["CI_PIPELINES_NOTIFICATION_TYPE"] ===
          "release_validation"
      )
    ).toHaveLength(2);
    expect(
      validation.steps?.some(
        (candidate) => candidate.env?.["CI_PIPELINES_ALERT_TYPE"] === "web_e2e"
      )
    ).toBe(false);
  });

  it("records manual production revalidation under the release-note identity", () => {
    const manual = step(
      job(productionE2e, "readonly"),
      "Record manual production revalidation outcome"
    );

    expect(manual.env).toMatchObject({
      CI_PIPELINES_NOTIFICATION_TYPE: "release_validation",
      CI_PIPELINES_VALIDATION_MODE: "manual",
      CI_RELEASE_GROUP_ID:
        "${{ github.repository }}:${{ inputs.automatic_deploy_run_id }}",
    });
    expect(manual.env?.["CI_PIPELINES_ALERT_TYPE"]).not.toBe("web_e2e");
  });
});
