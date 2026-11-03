import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    ".github/workflows/publish-delegation-docs-content.yml"
  ),
  "utf8"
);
const workflow = YAML.parse(source);
const job = workflow.jobs.publish;
const validation = job.steps.find(
  (step: { id?: string }) => step.id === "deploy_role"
);
const credentials = job.steps.find(
  (step: { id?: string }) => step.id === "aws_credentials"
);

describe("delegation docs deployment authentication", () => {
  it("isolates its OIDC identity and uses the environment role", () => {
    expect(job.environment).toBe("delegation-docs");
    expect(job.permissions["id-token"]).toBe("write");
    expect(workflow.permissions["id-token"]).toBeUndefined();
    expect(job.steps[0]).toBe(validation);
    expect(credentials.with).toMatchObject({
      "role-to-assume": "${{ vars.AWS_DEPLOY_ROLE_ARN }}",
      "allowed-account-ids": "${{ steps.deploy_role.outputs.account_id }}",
      "role-session-name": "frontend-docs-${{ github.run_id }}",
      "aws-region": "eu-west-1",
      "unset-current-credentials": true,
    });
    expect(credentials.with["role-duration-seconds"]).toBeGreaterThan(
      job["timeout-minutes"] * 60
    );
    expect(source).not.toContain("secrets.AWS_ACCESS_KEY_ID");
    expect(source).not.toContain("secrets.AWS_SECRET_ACCESS_KEY");
  });

  it("checks AWS access during dry runs and keeps IPFS credentials out of dependency installation", () => {
    expect(credentials.if).toBe(validation.if);
    expect(credentials.if).not.toContain("dry_run");
    for (const secret of [
      "DELEGATION_DOCS_IPFS_API_ENDPOINT",
      "DELEGATION_DOCS_IPFS_API_BEARER_TOKEN",
      "DELEGATION_DOCS_IPFS_API_AUTH_HEADER",
    ]) {
      expect(job.env[secret]).toBeUndefined();
      const publish = job.steps.find(
        (step: { name?: string }) =>
          step.name === "Publish delegation docs package"
      );
      expect(publish.env[secret]).toBe(`\${{ secrets.${secret} }}`);
      expect(publish.run).toContain("args+=(--dry-run)");
    }
    const access = job.steps.find(
      (step: { name?: string }) => step.name === "Verify scoped CDN access"
    );
    expect(access.if).toBe(credentials.if);
    expect(access.run).toContain('test "$AUTH_OUTCOME" = "success"');
    expect(access.run).toContain("get-bucket-location");
    expect(access.run).toContain("--prefix delegation-content/");
    expect(access.run).not.toMatch(/\b(?:put-object|delete-object|sync)\b/u);
  });

  it.each([
    ["valid", {}, 0],
    ["invalid ARN", { AWS_DEPLOY_ROLE_ARN: "invalid" }, 1],
    [
      "shell injection",
      { AWS_DEPLOY_ROLE_ARN: "arn:aws:iam::987989283142:role/test$(false)" },
      1,
    ],
    ["wrong region", { CDN_AWS_REGION: "us-east-1" }, 1],
    [
      "wrong bucket",
      { DELEGATION_DOCS_CDN_S3_URI: "s3://other-bucket/{cid}" },
      1,
    ],
  ])("validates %s before checkout", (_name, overrides, expectedStatus) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "docs-oidc-"));
    try {
      const output = path.join(directory, "output");
      const result = childProcess.spawnSync(
        "bash",
        ["-e", "-c", validation.run],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            GITHUB_OUTPUT: output,
            AWS_DEPLOY_ROLE_ARN:
              "arn:aws:iam::987989283142:role/gha-frontend-docs-publish",
            CDN_AWS_REGION: "eu-west-1",
            DELEGATION_DOCS_CDN_S3_URI:
              "s3://6529bucket/delegation-content/{cid}",
            ...overrides,
          },
        }
      );
      expect(result.status).toBe(expectedStatus);
      if (expectedStatus === 0)
        expect(fs.readFileSync(output, "utf8")).toBe(
          "account_id=987989283142\n"
        );
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
