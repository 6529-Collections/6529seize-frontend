import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const verifier =
  require("../../ops/scripts/verify-production-artifact.cjs") as {
    validateArchiveMembers: (members: string) => true;
    validateExtractedArtifact: (root: string) => true;
  };

const WORKFLOW_PATH = path.join(
  process.cwd(),
  ".github",
  "workflows",
  "production-artifact-verifier.yml"
);
const REPOSITORY = "6529-Collections/6529seize-frontend";
const WORKFLOW_SHA = "a".repeat(40);
const ARTIFACT_DIGEST = `sha256:${"b".repeat(64)}`;
const ARTIFACT_ID = "456";
const ARTIFACT_NAME = `production-frontend-${"c".repeat(40)}-123`;

function verifyMetadata(
  run: Record<string, unknown>,
  builderConclusion = "success"
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "production-metadata-"));
  const verifierRoot = path.join(root, "production-artifact-verifier");
  fs.mkdirSync(verifierRoot);
  fs.writeFileSync(path.join(verifierRoot, "run.json"), JSON.stringify(run));
  fs.writeFileSync(
    path.join(verifierRoot, "jobs.json"),
    JSON.stringify([
      {
        name:
          run["path"] === ".github/workflows/production-build-artifact.yml"
            ? "Build exact production artifact"
            : "Build exact production artifact / Build exact production artifact",
        run_id: 123,
        head_sha: WORKFLOW_SHA,
        status: "completed",
        conclusion: builderConclusion,
      },
    ])
  );
  fs.writeFileSync(
    path.join(verifierRoot, "artifact.json"),
    JSON.stringify({
      id: Number(ARTIFACT_ID),
      name: ARTIFACT_NAME,
      expired: false,
      digest: ARTIFACT_DIGEST,
      workflow_run: { id: 123 },
    })
  );
  const parsedWorkflow = YAML.parse(fs.readFileSync(WORKFLOW_PATH, "utf8"));
  const identityStep = parsedWorkflow.jobs.verify.steps.find(
    (step: { name?: string }) =>
      step.name === "Verify builder and artifact identity"
  );
  try {
    execFileSync("bash", ["-c", identityStep.run], {
      env: {
        ...process.env,
        ARTIFACT_DIGEST,
        ARTIFACT_ID,
        ARTIFACT_NAME,
        ARTIFACT_RUN_ATTEMPT: "1",
        ARTIFACT_RUN_ID: "123",
        ARTIFACT_WORKFLOW_SHA: WORKFLOW_SHA,
        GITHUB_REPOSITORY: REPOSITORY,
        RUNNER_TEMP: root,
      },
      stdio: "pipe",
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function withArtifact(run: (root: string) => void) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "production-artifact-"));
  try {
    fs.mkdirSync(path.join(root, "target", "_next", "static"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(root, "SHA256SUMS"), "checksums\n");
    fs.writeFileSync(path.join(root, "artifact-portability.json"), "{}\n");
    fs.writeFileSync(path.join(root, "manifest.json"), "{}\n");
    fs.writeFileSync(path.join(root, "target", "package.zip"), "zip\n");
    fs.writeFileSync(
      path.join(root, "target", "_next", "static", "app.js"),
      "js\n"
    );
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("production artifact verifier", () => {
  const source = fs.readFileSync(WORKFLOW_PATH, "utf8");
  const workflow = YAML.parse(source);

  it("binds verification to exact run, artifact, digest, workflow, and target identities", () => {
    const requiredInputs = [
      "target_sha",
      "artifact_run_id",
      "artifact_run_attempt",
      "artifact_id",
      "artifact_digest",
      "artifact_name",
      "artifact_workflow_sha",
    ];
    expect(Object.keys(workflow.on.workflow_call.inputs)).toEqual(
      requiredInputs
    );
    for (const input of requiredInputs) {
      expect(workflow.on.workflow_call.inputs[input].required).toBe(true);
    }
    expect(workflow.concurrency).toEqual({
      group: "production-artifact-verifier-${{ inputs.artifact_id }}",
      "cancel-in-progress": false,
    });
    expect(source).toContain(`actions/artifacts/\${ARTIFACT_ID}`);
    expect(source).toContain(
      "actions/runs/${ARTIFACT_RUN_ID}/attempts/${ARTIFACT_RUN_ATTEMPT}"
    );
    expect(source).toContain(
      'test "$ARTIFACT_NAME" = "production-frontend-${TARGET_SHA}-${ARTIFACT_RUN_ID}"'
    );
    expect(source).toContain(
      '.path == ".github/workflows/production-build-artifact.yml"'
    );
    expect(source).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(source).toContain('.referenced_workflows | type == "array"');
    expect(source).toContain(
      '$repository + "/.github/workflows/production-build-artifact.yml"'
    );
    expect(source).toContain(".sha == $workflow_sha");
    expect(source).toContain('test "$(sha256sum "$root/artifact.zip"');
    expect(source).toContain("sha256sum -c SHA256SUMS");
    expect(source).toContain('artifact_contract == "production-deployment-v1"');
    expect(source).toContain("schema_version == 1");
    expect(source).toContain("compare/${TARGET_SHA}...${current_main_sha}");
    expect(source).not.toMatch(/release[-_ ]bus|operation_id|authority/i);
  });

  it("accepts only a direct builder or an exact caller-to-builder reference", () => {
    const baseRun = {
      id: 123,
      run_attempt: 1,
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: WORKFLOW_SHA,
      repository: { full_name: REPOSITORY },
      head_repository: { full_name: REPOSITORY },
      status: "completed",
      conclusion: "success",
    };
    expect(() =>
      verifyMetadata({
        ...baseRun,
        path: ".github/workflows/production-build-artifact.yml",
      })
    ).not.toThrow();
    const retryRun = {
      ...baseRun,
      conclusion: "failure",
      path: ".github/workflows/build-upload-deploy-prod.yml",
      referenced_workflows: [
        {
          path: `${REPOSITORY}/.github/workflows/production-build-artifact.yml@main`,
          sha: WORKFLOW_SHA,
        },
      ],
    };
    expect(() => verifyMetadata(retryRun)).not.toThrow();
    expect(() => verifyMetadata(retryRun, "failure")).toThrow();
    expect(() => verifyMetadata(retryRun, "cancelled")).toThrow();
    expect(() =>
      verifyMetadata({
        ...baseRun,
        path: ".github/workflows/build-upload-deploy-prod.yml",
        referenced_workflows: [
          {
            path: `${REPOSITORY}/.github/workflows/production-build-artifact.yml@main`,
            sha: WORKFLOW_SHA,
          },
        ],
      })
    ).not.toThrow();
    expect(() =>
      verifyMetadata({
        ...baseRun,
        path: ".github/workflows/build-upload-deploy-prod.yml",
        referenced_workflows: [
          {
            path: `${REPOSITORY}/.github/workflows/production-build-artifact.yml@main`,
            sha: "d".repeat(40),
          },
        ],
      })
    ).toThrow();
  });

  it("accepts only the closed production archive shape", () => {
    const members = [
      "SHA256SUMS",
      "artifact-portability.json",
      "manifest.json",
      "target/package.zip",
      "target/_next/static/app.js",
    ].join("\n");
    expect(verifier.validateArchiveMembers(`${members}\n`)).toBe(true);
    expect(() =>
      verifier.validateArchiveMembers(`${members}\n../manifest.json\n`)
    ).toThrow("unsafe path segment");
    expect(() =>
      verifier.validateArchiveMembers(`${members}\noutside.txt\n`)
    ).toThrow("outside the production artifact contract");
    expect(() =>
      verifier.validateArchiveMembers(`${members}\nmanifest.json\n`)
    ).toThrow("duplicated");
    expect(() => verifier.validateArchiveMembers("manifest.json\n")).toThrow(
      "missing required file"
    );
    expect(() =>
      verifier.validateArchiveMembers(`${members}\ntarget\\windows-path.js\n`)
    ).toThrow("not a relative POSIX path");
    expect(() =>
      verifier.validateArchiveMembers(`${members}\n/absolute-path.js\n`)
    ).toThrow("not a relative POSIX path");
    expect(() =>
      verifier.validateArchiveMembers(`${members}\ntarget/.\n`)
    ).toThrow("unsafe path segment");
    expect(() =>
      verifier.validateArchiveMembers(
        `${members}\ntarget/_next/static/bad\tname.js\n`
      )
    ).toThrow("control characters");
  });

  it("rejects missing, unexpected, and non-regular entries after extraction", () => {
    withArtifact((root) => {
      expect(verifier.validateExtractedArtifact(root)).toBe(true);
      fs.rmSync(path.join(root, "manifest.json"));
      expect(() => verifier.validateExtractedArtifact(root)).toThrow(
        "missing required file"
      );
      fs.writeFileSync(path.join(root, "manifest.json"), "{}\n");
      fs.writeFileSync(path.join(root, "unexpected.txt"), "no\n");
      expect(() => verifier.validateExtractedArtifact(root)).toThrow(
        "outside the production artifact contract"
      );
      fs.rmSync(path.join(root, "unexpected.txt"));
      fs.symlinkSync(
        path.join(root, "manifest.json"),
        path.join(root, "target", "linked")
      );
      expect(() => verifier.validateExtractedArtifact(root)).toThrow(
        "symbolic link"
      );
      fs.rmSync(path.join(root, "target", "linked"));
      const controlCharacterPath = path.join(
        root,
        "target",
        "_next",
        "static",
        "bad\nname.js"
      );
      fs.writeFileSync(controlCharacterPath, "no\n");
      expect(() => verifier.validateExtractedArtifact(root)).toThrow(
        "control character"
      );
      fs.rmSync(controlCharacterPath);
      const fifoPath = path.join(
        root,
        "target",
        "_next",
        "static",
        "unsupported-entry"
      );
      try {
        execFileSync("mkfifo", [fifoPath]);
        expect(() => verifier.validateExtractedArtifact(root)).toThrow(
          "unsupported filesystem entry"
        );
      } finally {
        fs.rmSync(fifoPath, { force: true });
      }
    });
  });
});
