import fs from "node:fs";
import childProcess from "node:child_process";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const ROOT = process.cwd();
const readWorkflow = (name: string) => {
  const source = fs.readFileSync(
    path.join(ROOT, ".github", "workflows", name),
    "utf8"
  );
  return { source, workflow: YAML.parse(source) };
};

describe("frontend deployment workflow contract", () => {
  describe.each([
    ["staging", "deploy-staging.yml", "deploy-staging"],
    ["production", "build-upload-deploy-prod.yml", "build-upload-deploy"],
  ])("%s AWS authentication", (environment, file, deployJob) => {
    const { source, workflow } = readWorkflow(file);
    const job = workflow.jobs[deployJob];
    const validation = job.steps.find(
      (step: { id?: string }) => step.id === "deploy_role"
    );
    const credentials = job.steps.find(
      (step: { id?: string }) => step.id === "aws_credentials"
    );
    let temporaryDirectory: string;

    beforeEach(() => {
      temporaryDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "deploy-oidc-")
      );
    });

    afterEach(() => {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    it("uses the environment role and restricts OIDC permission to deployment", () => {
      expect(job.permissions["id-token"]).toBe("write");
      expect(workflow.permissions["id-token"]).toBeUndefined();
      for (const [name, otherJob] of Object.entries(workflow.jobs)) {
        if (name !== deployJob) {
          expect(
            (otherJob as { permissions?: Record<string, string> })
              .permissions?.["id-token"]
          ).toBeUndefined();
        }
      }
      expect(job.steps[0]).toBe(validation);
      expect(validation.env.AWS_DEPLOY_ROLE_ARN).toBe(
        "${{ vars.AWS_DEPLOY_ROLE_ARN }}"
      );
      expect(credentials.uses).toMatch(
        /^aws-actions\/configure-aws-credentials@/u
      );
      expect(credentials.with).toMatchObject({
        "role-to-assume": "${{ vars.AWS_DEPLOY_ROLE_ARN }}",
        "allowed-account-ids": "${{ steps.deploy_role.outputs.account_id }}",
        "role-session-name": `frontend-${environment}-\${{ github.run_id }}`,
        "role-duration-seconds": 5400,
        "unset-current-credentials": true,
      });
      expect(credentials.with["role-duration-seconds"]).toBeGreaterThan(
        job["timeout-minutes"] * 60
      );
      expect(credentials["continue-on-error"]).toBeUndefined();
      expect(credentials.with["force-skip-oidc"]).toBeUndefined();
      expect(source).not.toMatch(
        /secrets\.(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)/u
      );
    });

    it.each([
      "arn:aws:iam::987989283142:role/deployment",
      "arn:aws:iam::987989283142:role/team/frontend-deploy_+=,.@",
    ])("validates a role ARN and exports its account: %s", (arn) => {
      const output = path.join(temporaryDirectory, "output");
      const result = childProcess.spawnSync("bash", ["-c", validation.run], {
        encoding: "utf8",
        env: {
          ...process.env,
          AWS_DEPLOY_ROLE_ARN: arn,
          GITHUB_OUTPUT: output,
        },
      });
      expect(result.status).toBe(0);
      expect(fs.readFileSync(output, "utf8")).toBe("account_id=987989283142\n");
    });

    it.each([
      "",
      "987989283142",
      "arn:aws:iam::987989283142:user/deployment",
      "arn:aws:iam::123:role/deployment",
      "arn:aws:iam::987989283142:role/",
      "arn:aws:iam::987989283142:role/deployment\naccount_id=123456789012",
    ])("fails before authentication for invalid configuration: %s", (arn) => {
      const output = path.join(temporaryDirectory, "output");
      const result = childProcess.spawnSync("bash", ["-c", validation.run], {
        encoding: "utf8",
        env: {
          ...process.env,
          AWS_DEPLOY_ROLE_ARN: arn,
          GITHUB_OUTPUT: output,
        },
      });
      expect(result.status).not.toBe(0);
      expect(fs.existsSync(output)).toBe(false);
    });

    it("treats role configuration as data instead of executing it", () => {
      const marker = path.join(temporaryDirectory, "injected");
      const result = childProcess.spawnSync("bash", ["-c", validation.run], {
        encoding: "utf8",
        env: {
          ...process.env,
          AWS_DEPLOY_ROLE_ARN: `arn:aws:iam::987989283142:role/deploy$(touch ${marker})`,
          GITHUB_OUTPUT: path.join(temporaryDirectory, "output"),
        },
      });
      expect(result.status).not.toBe(0);
      expect(fs.existsSync(marker)).toBe(false);
    });

    it.each(["success", "failure", "skipped", "cancelled", ""])(
      "requires successful authentication before AWS operations: %s",
      (outcome) => {
        const guard = job.steps.find(
          (step: { name?: string }) =>
            step.name === "Require successful AWS authentication"
        );
        expect(job.steps.indexOf(guard)).toBe(
          job.steps.indexOf(credentials) + 1
        );
        expect(guard.env.AWS_CREDENTIALS_OUTCOME).toBe(
          "${{ steps.aws_credentials.outcome }}"
        );
        const result = childProcess.spawnSync("bash", ["-c", guard.run], {
          encoding: "utf8",
          env: { ...process.env, AWS_CREDENTIALS_OUTCOME: outcome },
        });
        expect(result.status === 0).toBe(outcome === "success");
      }
    );
  });

  it("invalidates only the known production announcement distribution", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml");
    expect(production.workflow.env.ANNOUNCED_VERSION_DISTRIBUTION_ID).toBe(
      "EKB17CMB021J6"
    );
    expect(production.source).not.toContain(
      "aws cloudfront list-distributions"
    );
    expect(production.source).toContain(
      '--distribution-id "$ANNOUNCED_VERSION_DISTRIBUTION_ID"'
    );
  });

  it.each(["us-east-1", "eu-west-1"])(
    "checks the staging artifact region before authentication: %s",
    (region) => {
      const workflow = readWorkflow("deploy-staging.yml").workflow;
      const job = workflow.jobs["deploy-staging"];
      const configuration = job.steps.find(
        (step: { name?: string }) =>
          step.name === "Validate staging configuration"
      );
      const credentials = job.steps.find(
        (step: { id?: string }) => step.id === "aws_credentials"
      );
      expect(job.steps.indexOf(configuration)).toBeLessThan(
        job.steps.indexOf(credentials)
      );
      const result = childProcess.spawnSync("bash", ["-c", configuration.run], {
        encoding: "utf8",
        env: {
          ...process.env,
          ARTIFACT_BUCKET_REGION: region,
          AWS_REGION: "eu-west-1",
          INSTANCE_ID: "i-test",
          STAGING_REPO_DIR: "/srv/frontend",
          STAGING_RUN_AS: "ubuntu",
          AWS_ACCESS_KEY_ID: "",
          AWS_SECRET_ACCESS_KEY: "",
        },
      });
      expect(result.status === 0).toBe(region === "us-east-1");
    }
  );

  describe("production announcement publication", () => {
    let temporaryDirectory: string;
    const workflow = readWorkflow("build-upload-deploy-prod.yml").workflow;
    const publish = workflow.jobs["build-upload-deploy"].steps.find(
      (step: { name?: string }) =>
        step.name === "Publish announced production version"
    );

    beforeEach(() => {
      temporaryDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "announcement-oidc-")
      );
    });
    afterEach(() => {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    it.each([
      ["dnclu2fna0b2b.cloudfront.net", "0", true, ["upload", "invalidate"]],
      ["wrong.cloudfront.net", "0", false, []],
      ["dnclu2fna0b2b.cloudfront.net", "42", false, ["upload", "invalidate"]],
    ])(
      "checks the distribution and requires invalidation success: %s / %s",
      (domain, invalidationExit, succeeds, expectedCalls) => {
        const calls = path.join(temporaryDirectory, "calls");
        const mockAws = `
aws() {
  case "$1:$2" in
    elasticbeanstalk:describe-environments) printf '%s\\n' "$COMMIT_SHA" ;;
    cloudfront:get-distribution) printf '%s\\n' "$TEST_DISTRIBUTION_DOMAIN" ;;
    s3:cp) printf 'upload\\n' >> "$TEST_CALLS" ;;
    cloudfront:create-invalidation)
      printf 'invalidate\\n' >> "$TEST_CALLS"
      return "$TEST_INVALIDATION_EXIT"
      ;;
    *) return 99 ;;
  esac
}
`;
        const result = childProcess.spawnSync(
          "bash",
          ["-c", `${mockAws}\n${publish.run}`],
          {
            encoding: "utf8",
            cwd: temporaryDirectory,
            env: {
              ...process.env,
              COMMIT_SHA: "a".repeat(40),
              BEANSTALK_ENV_NAME: "test-environment",
              AWS_BUCKET: "test-bucket",
              ANNOUNCED_VERSION_ENDPOINT:
                workflow.env.ANNOUNCED_VERSION_ENDPOINT,
              ANNOUNCED_VERSION_DISTRIBUTION_ID:
                workflow.env.ANNOUNCED_VERSION_DISTRIBUTION_ID,
              ANNOUNCED_VERSION_OBJECT_KEY:
                workflow.env.ANNOUNCED_VERSION_OBJECT_KEY,
              RUN_URL: "https://example.test/deploy",
              TEST_DISTRIBUTION_DOMAIN: String(domain),
              TEST_INVALIDATION_EXIT: String(invalidationExit),
              TEST_CALLS: calls,
            },
          }
        );
        expect(result.status === 0).toBe(succeeds);
        const actualCalls = fs.existsSync(calls)
          ? fs.readFileSync(calls, "utf8").trim().split("\n")
          : [];
        expect(actualCalls).toEqual(expectedCalls);
      }
    );
  });

  it("keeps standalone connections alive beyond the load balancer idle timeout", () => {
    const procfile = fs.readFileSync(path.join(ROOT, "Procfile"), "utf8");
    const configuredTimeout = procfile.match(/\bKEEP_ALIVE_TIMEOUT=(\d+)\b/);
    expect(configuredTimeout).not.toBeNull();
    // The production ALB reaches Node directly and has a 60-second idle timeout.
    expect(Number(configuredTimeout?.[1])).toBeGreaterThan(60_000);
    expect(procfile).toMatch(/\bnode server\.js\s*$/);
    const stagingScript = fs.readFileSync(
      path.join(ROOT, "ops", "scripts", "deploy-staging-artifact.sh"),
      "utf8"
    );
    expect(stagingScript).toContain(
      `KEEP_ALIVE_TIMEOUT: '${configuredTimeout?.[1]}'`
    );
  });

  it("starts every standalone launch path with the same libuv threadpool size", () => {
    const procfile = fs.readFileSync(path.join(ROOT, "Procfile"), "utf8");
    const configured = procfile.match(/\bUV_THREADPOOL_SIZE=(\d+)\b/);
    expect(configured).not.toBeNull();
    // Node's default of four threads is shared by DNS, fs, zlib, crypto and
    // sharp image transforms.
    expect(Number(configured?.[1])).toBeGreaterThan(4);
    expect(procfile).toMatch(/\bnode server\.js\s*$/);

    const stagingScript = fs.readFileSync(
      path.join(ROOT, "ops", "scripts", "deploy-staging-artifact.sh"),
      "utf8"
    );
    expect(stagingScript).toContain(
      `UV_THREADPOOL_SIZE: '${configured?.[1]}'`
    );
    const standaloneLauncher = fs.readFileSync(
      path.join(ROOT, "scripts", "start-standalone.cjs"),
      "utf8"
    );
    expect(standaloneLauncher).toContain(
      `runtimeEnv["UV_THREADPOOL_SIZE"] || "${configured?.[1]}"`
    );
  });

  it("keeps canonical names and makes main merges non-deploying", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    expect(staging.name).toBe("Web Deploy - STAGING");
    expect(staging.on.push.branches).toEqual(["1a-staging"]);
    expect(staging.on.workflow_dispatch).toBeDefined();
    expect(staging.concurrency).toEqual({
      group: "staging-deploy",
      "cancel-in-progress": false,
    });
    expect(production.name).toBe("Web Deploy - PROD");
    expect(production.on.push).toBeUndefined();
    expect(production.on.pull_request).toBeUndefined();
    expect(production.on.workflow_dispatch).toBeDefined();
    expect(production.concurrency).toEqual({
      group: "web-deploy-prod",
      "cancel-in-progress": false,
    });
  });

  it("removes Release Bus control-plane plumbing from active deployment and E2E paths", () => {
    const activePaths = [
      "build-upload-deploy-prod.yml",
      "deploy-staging.yml",
      "production-artifact-verifier.yml",
      "production-artifact-metadata.yml",
      "production-build-artifact.yml",
      "production-e2e.yml",
      "staging-e2e.yml",
      "staging-e2e-dispatch.yml",
      "production-e2e-dispatch.yml",
    ];
    const forbidden =
      /release[-_ ]bus|deployment[-_ ]bus|operation_id|authority\/|authority completion/i;
    for (const workflow of activePaths) {
      const source = readWorkflow(workflow).source;
      expect(source).not.toMatch(forbidden);
    }
  });

  it("retains ordinary GitHub deployment records for both environments", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    expect(staging.jobs["deploy-staging"].environment).toEqual({
      name: "staging",
      url: "https://staging.6529.io",
    });
    expect(production.jobs["build-upload-deploy"].environment).toBe(
      "production"
    );
  });

  it.each([
    ["staging", "deploy-staging.yml", "Web Deploy - STAGING", "1a-staging"],
    ["production", "build-upload-deploy-prod.yml", "Web Deploy - PROD", "main"],
  ])(
    "finishes the %s deployment before starting separate automatic E2E",
    (environment, file, name, branch) => {
      const deploy = readWorkflow(file).workflow;
      const e2e = readWorkflow(`${environment}-e2e.yml`).workflow;
      const dispatcher = readWorkflow(
        `${environment}-e2e-dispatch.yml`
      ).workflow;
      expect(deploy.jobs[`automatic-${environment}-e2e`]).toBeUndefined();
      expect(
        Object.values(deploy.jobs).some((job) =>
          (job as { uses?: string }).uses?.endsWith("-e2e.yml")
        )
      ).toBe(false);
      expect(e2e.on.workflow_call).toBeUndefined();
      expect(e2e.concurrency.group).toBe(`${environment}-e2e`);
      expect(dispatcher.on.workflow_run).toEqual({
        workflows: [name],
        types: ["completed"],
        branches: [branch],
      });
      expect(dispatcher.jobs["dispatch-successful-deploy"].if).toContain(
        "conclusion == 'success'"
      );
      expect(dispatcher.jobs["dispatch-successful-deploy"].if).toContain(
        "head_repository.full_name == github.repository"
      );
      expect(e2e.on.workflow_dispatch.inputs.target_sha).toBeUndefined();
    }
  );

  it("notifies staging deployment before automatic E2E", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const finalizer = staging.jobs["notify-staging-outcome"];
    const requiredJobs = ["build-staging-artifact", "deploy-staging"];
    const failure = finalizer.steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about failure"
    );
    const success = finalizer.steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about success"
    );

    expect(finalizer.if).toBe("always()");
    expect(finalizer.needs).toEqual(requiredJobs);
    for (const job of requiredJobs) {
      expect(failure.if).toContain(`needs.${job}.result != 'success'`);
      expect(success.if).toContain(`needs.${job}.result == 'success'`);
    }
  });

  it("publishes production release notes after deploy before CI-wave E2E", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    const deployment = production.jobs["notify-production-deployment"];
    const deploymentSuccess = deployment.steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about success"
    );

    expect(deployment.needs).toEqual([
      "build-production-artifact",
      "resolve-production-artifact",
      "verify-production-artifact",
      "build-upload-deploy",
    ]);
    expect(deployment.needs).not.toContain("automatic-production-e2e");
    expect(deploymentSuccess.env.CI_RELEASE_NOTES_PROMPT_PATH).toBe(
      "ops/release-notes/release-notes.prompt.md"
    );
    expect(deploymentSuccess.env.CI_PIPELINES_ALERT_TYPE).toBe("deploy");
    expect(production.jobs).not.toHaveProperty("notify-production-validation");
  });

  it("exposes the staging access code only after deployed-source authorization", () => {
    const stagingE2e = readWorkflow("staging-e2e.yml").workflow;
    const job = stagingE2e.jobs["staging-packs"];
    const runPacks = job.steps.find(
      (step: { name?: string }) => step.name === "Run read-only staging packs"
    );

    expect(job.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBeUndefined();
    expect(runPacks.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBe(
      "${{ secrets.PLAYWRIGHT_STAGING_ACCESS_CODE }}"
    );
  });

  it("keeps exact-production provenance and late downgrade guards fail-closed", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml").source;
    const verifier = readWorkflow("production-artifact-verifier.yml").source;
    const productionE2e = readWorkflow("production-e2e.yml");
    const sourceCheckout = productionE2e.workflow.jobs.readonly.steps.find(
      (step: { name?: string }) =>
        step.name === "Check out exact deployed source"
    );

    expect(verifier).toContain(
      '.path == ".github/workflows/production-build-artifact.yml"'
    );
    expect(verifier).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(verifier).toContain(
      '$repository + "/.github/workflows/production-build-artifact.yml"'
    );
    expect(verifier).toContain(".sha == $workflow_sha");
    expect(production).toContain(
      'git merge-base --is-ancestor "$COMMIT_SHA" "$current_main_sha"'
    );
    expect(production).not.toContain(
      'test "$current_main_sha" = "$COMMIT_SHA"'
    );
    expect(production).not.toContain("refusing to announce stale production");
    expect(production).toContain("refusing to overwrite it with $COMMIT_SHA");
    expect(sourceCheckout).toMatchObject({
      uses: expect.stringMatching(/^actions\/checkout@/u),
      with: {
        ref: "${{ steps.source.outputs.sha }}",
        "persist-credentials": false,
      },
    });
    expect(productionE2e.source).toContain("path: .version-verifier");
  });
});
