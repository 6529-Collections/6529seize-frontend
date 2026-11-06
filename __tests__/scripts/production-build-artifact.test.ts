import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import YAML from "yaml";
import {
  PRODUCTION_ASSET_HOSTNAME,
  PRODUCTION_ASSET_PREFIX,
  PRODUCTION_SHARED_ASSET_PATH,
} from "@/config/assetPrefix";

const read = (file: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", file),
    "utf8"
  );

describe("production exact-artifact deployment contract", () => {
  const buildSource = read("production-build-artifact.yml");
  const deploySource = read("build-upload-deploy-prod.yml");
  const build = YAML.parse(buildSource);
  const deploy = YAML.parse(deploySource);

  it("builds an explicit main-history SHA without deployment credentials", () => {
    expect(build.on.push).toBeUndefined();
    expect(build.on.workflow_dispatch.inputs).toEqual({
      target_sha: expect.objectContaining({ required: true, type: "string" }),
    });
    expect(build.on.workflow_call.inputs).toEqual({
      target_sha: expect.objectContaining({ required: true, type: "string" }),
    });
    expect(build.on.workflow_call.outputs).toEqual(
      expect.objectContaining({
        artifact_id: expect.any(Object),
        artifact_digest: expect.any(Object),
        artifact_name: expect.any(Object),
        package_sha256: expect.any(Object),
        protected_main_sha: expect.any(Object),
        target_sha: expect.any(Object),
        workflow_sha: expect.any(Object),
      })
    );
    const job = build.jobs["build-production-artifact"];
    const installStep = job.steps.find(
      (step: { name?: string }) => step.name === "Install frozen dependencies"
    );
    const serialized = JSON.stringify(job);

    expect(job.permissions).toEqual({ contents: "read" });
    expect(installStep.env).not.toHaveProperty("NODE_AUTH_TOKEN");
    expect(serialized).not.toContain("AWS_ACCESS_KEY_ID");
    expect(serialized).not.toContain("configure-aws-credentials");
    expect(buildSource).toContain(
      'git merge-base --is-ancestor "$TARGET_SHA" "$main_sha"'
    );
    expect(buildSource).toContain('git checkout --detach "$TARGET_SHA"');
    expect(buildSource).toContain("./bin/6529 run build:ci");
    expect(buildSource).toContain(
      'artifact_contract:"production-deployment-v1"'
    );
    expect(buildSource).toContain(
      '{schema_version:1,artifact_contract:"production-deployment-v1"'
    );
    expect(buildSource).toContain(
      "production-frontend-${TARGET_SHA}-${PRODUCER_RUN_ID}"
    );
    expect(
      build.jobs["build-production-artifact"].steps.find(
        (step: { name?: string }) =>
          step.name === "Upload exact production artifact"
      ).with.name
    ).toBe("${{ steps.validate-inputs.outputs.artifact_name }}");
    expect(buildSource).toContain("artifact-portability.cjs inventory");
    expect(buildSource).toContain("sha256sum > SHA256SUMS");
    expect(JSON.stringify(build.jobs)).not.toContain("AWS_ACCESS_KEY_ID");
    expect(JSON.stringify(build.jobs)).not.toContain(
      "configure-aws-credentials"
    );
  });

  it("passes the upload digest to the verifier in GitHub API format", () => {
    const rawDigest = "b".repeat(64);
    const artifactDigest = build.jobs[
      "build-production-artifact"
    ].outputs.artifact_digest.replace(
      "${{ steps.upload.outputs.artifact-digest }}",
      rawDigest
    );
    const verifier = YAML.parse(read("production-artifact-verifier.yml")) as {
      jobs: Record<string, { steps: Array<{ name?: string; run?: string }> }>;
    };
    const validation = Object.values(verifier.jobs)
      .flatMap((job) => job.steps)
      .find((step) => step.name === "Validate exact artifact inputs");
    if (!validation?.run) throw new Error("Missing verifier input validation");
    const targetSha = "a".repeat(40);
    const result = spawnSync("bash", ["-c", validation.run], {
      encoding: "utf8",
      env: {
        ...process.env,
        ARTIFACT_DIGEST: artifactDigest,
        ARTIFACT_ID: "123",
        ARTIFACT_RUN_ATTEMPT: "1",
        ARTIFACT_RUN_ID: "456",
        ARTIFACT_WORKFLOW_SHA: targetSha,
        TARGET_SHA: targetSha,
        ARTIFACT_NAME: `production-frontend-${targetSha}-456`,
        GITHUB_REF: "refs/heads/main",
      },
    });
    expect(artifactDigest).toBe(`sha256:${rawDigest}`);
    expect(result.status).toBe(0);
  });

  it("keeps the Ethereum RPC URL server-only through build and runtime", () => {
    expect(build.on.workflow_call.secrets.ETHEREUM_RPC_URL).toEqual({
      required: true,
    });
    expect(
      deploy.jobs["build-production-artifact"].secrets.ETHEREUM_RPC_URL
    ).toBe("${{ secrets.ETHEREUM_RPC_URL }}");
    expect(buildSource).toContain(
      "ETHEREUM_RPC_URL: ${{ secrets.ETHEREUM_RPC_URL }}"
    );
    expect(deploySource).toContain(
      'OptionName:"ETHEREUM_RPC_URL",Value:$ethereum_rpc_url'
    );
    expect(deploySource).toContain(
      "node ops/scripts/validate-ethereum-rpc-url.cjs"
    );
    expect(deploySource).not.toContain("NEXT_PUBLIC_ETHEREUM_RPC_URL");
  });

  it("bakes signed messages and app device grants on into production builds", () => {
    expect(build.env.NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES).toBe("true");
    expect(build.env.NEXT_PUBLIC_FEATURE_APP_DEVICE_GRANTS).toBe("true");
  });

  it("turns the encrypted messages flag on in production builds", () => {
    // Encrypted DMs (D109) are on in production by owner decision
    // (2026-10-31); switching them off is a one-line change to "false" here.
    expect(build.env.NEXT_PUBLIC_E2EE_DM_ENABLED).toBe("true");
  });

  it("generates the production sitemap under the fail-closed policy", () => {
    const buildStep = build.jobs["build-production-artifact"].steps.find(
      (step: { name?: string }) => step.name === "Build exact production bytes"
    );

    // build:ci runs the postbuild sitemap step with this environment.
    expect(buildStep.run).toBe("./bin/6529 run build:ci");
    expect(buildStep.env.SITEMAP_FAILURE_POLICY).toBe("fail");
    expect(buildSource).not.toContain("SITEMAP_FAILURE_POLICY: fallback");
  });

  it("keeps production manual and deploys only the independently verified artifact", () => {
    expect(deploy.name).toBe("Web Deploy - PROD");
    expect(deploy.on.push).toBeUndefined();
    expect(deploy.on.workflow_dispatch).toBeDefined();
    expect(deploy.concurrency).toEqual({
      group: "web-deploy-prod",
      "cancel-in-progress": false,
    });
    expect(deploy.jobs["build-production-artifact"].uses).toBe(
      "./.github/workflows/production-build-artifact.yml"
    );
    expect(deploy.jobs["verify-production-artifact"].uses).toBe(
      "./.github/workflows/production-artifact-verifier.yml"
    );
    expect(deploy.jobs["build-upload-deploy"].needs).toEqual([
      "build-production-artifact",
      "resolve-production-artifact",
      "verify-production-artifact",
    ]);
    expect(deploySource).toContain("sha256sum -c SHA256SUMS");
    expect(deploySource).toContain(
      '.artifact_contract == "production-deployment-v1"'
    );
    expect(deploySource).toContain(".schema_version == 1");
    expect(deploySource).toContain(
      "aws s3 cp production-artifact/target/package.zip"
    );
    expect(deploySource).toContain(
      '"s3://${AWS_BUCKET}/web_build/${COMMIT_SHA}/package.zip"'
    );
    expect(deploySource).toContain(
      '--cache-control "no-store, max-age=0, must-revalidate"'
    );
    expect(deploySource).toContain("Refuse stale main or production downgrade");
    expect(deploySource).toContain(
      'if ! git merge-base --is-ancestor "$COMMIT_SHA" "$current_main_sha"; then'
    );
    expect(deploySource).not.toContain(
      'if [ "$current_main_sha" != "$COMMIT_SHA" ]; then'
    );
    expect(deploySource).toContain(
      'git merge-base --is-ancestor "$current_version" "$COMMIT_SHA"'
    );
    expect(deploySource).not.toMatch(/release[-_ ]bus/i);
    expect(deploySource).not.toMatch(/operation_id|authority/i);
  });

  it("records the Sentry release with the installed sentry-cli only once production is live", () => {
    type Step = {
      name?: string;
      run?: string;
      uses?: string;
      env?: Record<string, string>;
      with?: Record<string, unknown>;
      "continue-on-error"?: boolean;
      "timeout-minutes"?: number;
    };
    const indexIn = (steps: Step[], name: string) => {
      const index = steps.findIndex((step) => step.name === name);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    };

    // Build: hand the deploy the binary the frozen install verified.
    const buildSteps: Step[] = build.jobs["build-production-artifact"].steps;
    const stage = buildSteps[
      indexIn(buildSteps, "Stage installed sentry-cli for the Sentry release")
    ]!;
    const upload = buildSteps[
      indexIn(buildSteps, "Upload sentry-cli for the Sentry release")
    ]!;
    expect(
      indexIn(buildSteps, "Stage installed sentry-cli for the Sentry release")
    ).toBeGreaterThan(indexIn(buildSteps, "Install frozen dependencies"));
    expect(stage.run).toContain("node ops/scripts/resolve-sentry-cli.cjs");
    expect(stage.env ?? {}).not.toHaveProperty("SENTRY_AUTH_TOKEN");
    expect(stage["continue-on-error"]).toBe(true);
    expect(upload["continue-on-error"]).toBe(true);
    expect(upload.with?.["name"]).toBe(
      "production-sentry-cli-${{ github.run_id }}"
    );

    // Deploy: after Elastic Beanstalk serves the commit, never blocking.
    const steps: Step[] = deploy.jobs["build-upload-deploy"].steps;
    const download = steps[
      indexIn(steps, "Download sentry-cli for the Sentry release")
    ]!;
    const recordIndex = indexIn(steps, "Record the Sentry release");
    const record = steps[recordIndex]!;
    for (const earlier of [
      "Check Elastic Beanstalk health and readiness",
      "Verify exact deployed version",
      "Download sentry-cli for the Sentry release",
    ]) {
      expect(recordIndex).toBeGreaterThan(indexIn(steps, earlier));
    }
    expect(download["continue-on-error"]).toBe(true);
    expect(download.with?.["name"]).toBe(upload.with?.["name"]);
    expect(record["continue-on-error"]).toBe(true);
    expect(record["timeout-minutes"]).toBeGreaterThan(0);
    expect(record.run).toContain(
      'bash ops/scripts/sentry-release.sh "$cli" "$COMMIT_SHA"'
    );
    expect(record.env?.["SENTRY_AUTH_TOKEN"]).toBe(
      "${{ secrets.SENTRY_AUTH_TOKEN }}"
    );
    // The same org and project the build plugin used.
    const nextConfig = fs.readFileSync(
      path.join(process.cwd(), "next.config.ts"),
      "utf8"
    );
    expect(nextConfig).toContain(`org: "${record.env?.["SENTRY_ORG"]}"`);
    expect(nextConfig).toContain(
      `project: "${record.env?.["SENTRY_PROJECT"]}"`
    );
    // Release name = github.sha = the VERSION the build bakes and the runtime
    // reports to Sentry.
    expect(deploy.env.COMMIT_SHA).toBe("${{ github.sha }}");
    expect(deploy.jobs["build-production-artifact"].with.target_sha).toBe(
      "${{ github.sha }}"
    );
    expect(buildSource).toContain("VERSION: ${{ inputs.target_sha }}");
    // set-commits --auto reads the full local history at the deployed commit.
    const checkout = steps.find(
      (step) => step.name === "Checkout exact production SHA"
    );
    expect(checkout?.with?.["fetch-depth"]).toBe(0);
    // Nothing is downloaded at deploy time.
    expect(JSON.stringify([stage, download, record])).not.toMatch(
      /\bnpx\b|\bcurl\b|\bwget\b|npm (i|install)\b|pnpm (add|dlx)\b/
    );
  });

  it("publishes static files create-only to the shared prefix pages load from", () => {
    const steps: { name?: string; run?: string }[] =
      deploy.jobs["build-upload-deploy"].steps;
    const stepIndex = (name: string) => {
      const index = steps.findIndex((step) => step.name === name);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    };
    const sharedStaticPrefix = `${PRODUCTION_SHARED_ASSET_PATH}/_next/static`;

    // Pages, workflow, and IAM must agree on one prefix.
    expect(PRODUCTION_ASSET_PREFIX).toBe(
      `https://${PRODUCTION_ASSET_HOSTNAME}/${PRODUCTION_SHARED_ASSET_PATH}`
    );
    expect(PRODUCTION_SHARED_ASSET_PATH).not.toMatch(/^web_build\/[a-f0-9]{40}$/);
    expect(deploy.env.SHARED_STATIC_PREFIX).toBe(sharedStaticPrefix);
    expect(deploy.env.AWS_BUCKET).toBe("seize-web");

    const publish = steps.find(
      (step) => step.name === "Publish verified static files to the shared prefix"
    );
    if (!publish?.run) {
      throw new Error("missing shared static publish step");
    }
    expect(publish.run).toContain(
      "node ops/scripts/publish-shared-static-assets.cjs"
    );
    expect(publish.run).toContain(
      "--source production-artifact/target/_next/static"
    );
    expect(publish.run).toContain('--prefix "$SHARED_STATIC_PREFIX"');

    // Static files are verified, then published, before any server serves
    // pages that reference them.
    expect(stepIndex("Independently verify selected production bytes")).toBeLessThan(
      stepIndex("Publish verified static files to the shared prefix")
    );
    expect(stepIndex("Refuse stale main or production downgrade")).toBeLessThan(
      stepIndex("Publish verified static files to the shared prefix")
    );
    expect(
      stepIndex("Publish verified static files to the shared prefix")
    ).toBeLessThan(stepIndex("Deploy new version to Elastic Beanstalk"));
    expect(stepIndex("Upload verified deployment bundle to S3")).toBeLessThan(
      stepIndex("Ensure Elastic Beanstalk application version")
    );

    // No more full per-commit copies of unchanged static files.
    expect(deploySource).not.toContain('aws s3 cp production-artifact/target "');
    expect(deploySource).not.toMatch(/aws s3 (?:cp|sync)[^\n]*--recursive/);

    const storage = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "ops",
          "iam",
          "frontend-production",
          "FrontendProductionStorage.json"
        ),
        "utf8"
      )
    ) as {
      Statement: {
        Sid: string;
        Action: string[];
        Resource: string[];
        Condition: Record<string, Record<string, unknown>>;
      }[];
    };
    const statement = (sid: string) => {
      const found = storage.Statement.find((entry) => entry.Sid === sid);
      if (!found) {
        throw new Error(`missing IAM statement ${sid}`);
      }
      return found;
    };
    const objects = `arn:aws:s3:::seize-web/${sharedStaticPrefix}/*`;
    expect(statement("ProductionSharedStaticCreateOnly")).toEqual(
      expect.objectContaining({
        Action: ["s3:PutObject"],
        Resource: [objects],
        Condition: expect.objectContaining({
          Null: { "s3:if-none-match": "false" },
        }),
      })
    );
    expect(statement("ProductionSharedStaticRead")).toEqual(
      expect.objectContaining({ Action: ["s3:GetObject"], Resource: [objects] })
    );
    expect(statement("ProductionSharedStaticListing")).toEqual(
      expect.objectContaining({
        Action: ["s3:ListBucket"],
        Resource: ["arn:aws:s3:::seize-web"],
        Condition: expect.objectContaining({
          StringLike: { "s3:prefix": [`${sharedStaticPrefix}/*`] },
        }),
      })
    );
    // Nothing may delete or replace shared objects.
    for (const entry of storage.Statement) {
      if (entry.Resource.some((resource) => resource.includes("/web_build/shared/"))) {
        expect(entry.Action).not.toContain("s3:DeleteObject");
        expect(entry.Action).not.toContain("s3:PutObjectAcl");
      }
    }
  });
});
