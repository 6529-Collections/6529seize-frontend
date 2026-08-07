import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const verifier =
  require("../../ops/scripts/verify-production-artifact-selection.cjs") as {
    ARTIFACT_WORKFLOW_PATH: string;
    SELECTION_CONTRACT: string;
    VERIFIER_WORKFLOW_PATH: string;
    canonicalJson: (value: unknown) => string;
    expectedArtifactName: (targetSha: string, operationId: string) => string;
    expectedSelectionArtifactName: (
      targetSha: string,
      verifierRunAttempt: number
    ) => string;
    validateArchiveMembers: (memberList: string) => unknown;
    validateVerifierInputs: (options: Record<string, unknown>) => unknown;
    verifyChecksums: (root: string, requiredFiles: string[]) => unknown;
    verifyArtifact: (
      options: Record<string, unknown>
    ) => Record<string, unknown>;
    verifyMetadata: (options: Record<string, unknown>) => unknown;
    verifySelection: (
      options: Record<string, unknown>
    ) => Record<string, unknown>;
  };

const workflowPath = path.join(
  process.cwd(),
  ".github",
  "workflows",
  "production-artifact-verifier.yml"
);

const repository = "owner/name";
const targetSha = "a".repeat(40);
const currentOperationId = "operation-current-01";
const producerOperationId = "operation-prebuild-01";
const artifactRunId = "123456";
const artifactRunAttempt = 2;
const artifactId = "789012";
const verifierRunId = "900001";
const verifierRunAttempt = 3;
const verifierWorkflowSha = "b".repeat(40);
const builderWorkflowSha = "c".repeat(40);
const protectedMainSha = "d".repeat(40);
const currentMainSha = "e".repeat(40);

function digest(value: Buffer | string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requireRecordEntry<T>(
  record: Readonly<Record<string, T>>,
  key: string,
  label: string
): T {
  const value = record[key];
  if (value === undefined) {
    throw new Error(`Missing ${label}: ${key}`);
  }
  return value;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeChecksums(root: string, relativePaths: string[]): void {
  const lines = relativePaths.map((relativePath) => {
    const contents = fs.readFileSync(
      path.join(root, ...relativePath.split("/"))
    );
    return `${digest(contents)}  ${relativePath}`;
  });
  fs.writeFileSync(path.join(root, "SHA256SUMS"), `${lines.join("\n")}\n`);
}

function repositoryIdentity() {
  return { full_name: repository };
}

function ancestryEvidence(baseSha: string, aheadBy: number) {
  return {
    ahead_by: aheadBy,
    base_commit: { sha: baseSha },
    behind_by: 0,
    head_commit: { sha: currentMainSha },
    merge_base_commit: { sha: baseSha },
    status: aheadBy === 0 ? "identical" : "ahead",
    total_commits: aheadBy,
  };
}

describe("isolated production artifact verifier", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "production-verifier-"));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("is a fresh read-only verifier with explicit identity inputs", () => {
    const source = fs.readFileSync(workflowPath, "utf8");
    const workflow = YAML.parse(source) as {
      on: {
        workflow_call: { inputs: Record<string, { required: boolean }> };
        workflow_dispatch: { inputs: Record<string, { required: boolean }> };
      };
      jobs: Record<
        string,
        {
          permissions: Record<string, string>;
          "runs-on": string;
          steps: Array<{
            name?: string;
            with?: Record<string, unknown>;
          }>;
        }
      >;
    };
    const requiredInputs = ["target_sha", "operation_id"];
    const identityInputs = [
      "artifact_run_id",
      "artifact_run_attempt",
      "artifact_id",
      "artifact_api_digest",
      "artifact_name",
      "artifact_workflow_sha",
    ];

    for (const input of requiredInputs) {
      expect(
        requireRecordEntry(
          workflow.on.workflow_call.inputs,
          input,
          "workflow_call input"
        ).required
      ).toBe(true);
      expect(
        requireRecordEntry(
          workflow.on.workflow_dispatch.inputs,
          input,
          "workflow_dispatch input"
        ).required
      ).toBe(true);
    }
    for (const input of identityInputs) {
      expect(
        requireRecordEntry(
          workflow.on.workflow_call.inputs,
          input,
          "workflow_call input"
        ).required
      ).toBe(true);
      expect(
        requireRecordEntry(
          workflow.on.workflow_dispatch.inputs,
          input,
          "workflow_dispatch input"
        ).required
      ).toBe(true);
    }

    const verifyJob = requireRecordEntry(
      workflow.jobs,
      "verify",
      "workflow job"
    );
    expect(verifyJob["runs-on"]).toBe("ubuntu-latest");
    expect(verifyJob.permissions).toEqual({
      actions: "read",
      contents: "read",
    });
    const checkout = verifyJob.steps.find(
      ({ name }) => name === "Check out immutable verifier helper"
    );
    const sparseCheckout = String(checkout?.with?.["sparse-checkout"] ?? "");
    const scriptsDirectory = path.join(process.cwd(), "ops", "scripts");
    const verifierPath = path.join(
      scriptsDirectory,
      "verify-production-artifact-selection.cjs"
    );
    const localDependencies = new Set<string>();
    const visitLocalDependencies = (sourcePath: string): void => {
      const sourceCode = fs.readFileSync(sourcePath, "utf8");
      for (const match of sourceCode.matchAll(
        /require\(["']((?:\.{1,2}\/)[^"']+)["']\)/gu
      )) {
        const dependencyPath = path.resolve(path.dirname(sourcePath), match[1]);
        const relativeToScripts = path.relative(
          scriptsDirectory,
          dependencyPath
        );
        if (
          relativeToScripts.startsWith("..") ||
          path.isAbsolute(relativeToScripts)
        ) {
          throw new Error(
            `Verifier dependency escapes ops/scripts: ${dependencyPath}`
          );
        }
        const repositoryPath = path
          .relative(process.cwd(), dependencyPath)
          .split(path.sep)
          .join("/");
        if (!localDependencies.has(repositoryPath)) {
          localDependencies.add(repositoryPath);
          visitLocalDependencies(dependencyPath);
        }
      }
    };
    visitLocalDependencies(verifierPath);
    expect([...localDependencies]).toContain("ops/scripts/cli-args.cjs");
    expect(sparseCheckout).toContain(
      "ops/scripts/verify-production-artifact-selection.cjs"
    );
    for (const dependency of [...localDependencies].sort()) {
      expect(sparseCheckout).toContain(dependency);
    }
    expect(source).toContain(
      "actions/runs/${ARTIFACT_RUN_ID}/attempts/${ARTIFACT_RUN_ATTEMPT}"
    );
    expect(source).toContain("actions/artifacts/${ARTIFACT_ID}/zip");
    expect(source).toContain("github.run_attempt");
    expect(source).toContain(
      "group: one-click-production-verifier-${{ inputs.operation_id }}"
    );
    expect(source).not.toContain("inputs.operation_id || github.run_id");
    expect(source).toContain("ARTIFACT_WORKFLOW_SHA");
    expect(source).toContain("builder ${{ inputs.artifact_run_id }}");
    expect(source).toContain("sha256sum -c SHA256SUMS");
    expect(source).toContain("unzip -Z1");
    expect(source).toContain("validate-archive-members");
    expect(source).toContain("validate-extracted-artifact");
    expect(source).toContain("git/ref/heads/main");
    expect(source).toContain("compare/${TARGET_SHA}...${current_main_sha}");
    expect(source.indexOf("validate-archive-members")).toBeLessThan(
      source.indexOf("unzip -q")
    );
    expect(source.indexOf("validate-extracted-artifact")).toBeLessThan(
      source.indexOf('protected_main_sha="$(jq')
    );
    expect(source).not.toContain("push");
    expect(source).not.toContain("actions/artifacts?name=");
    expect(source).not.toContain("sort_by(.created_at)");
    expect(source).not.toContain("configure-aws-credentials");
    expect(source).not.toContain("AWS_ACCESS_KEY_ID");
    expect(source).not.toContain("workflow run --");
  });

  it("adopts an explicit cross-operation prebuild and binds a fresh selection", () => {
    const artifactName = verifier.expectedArtifactName(
      targetSha,
      producerOperationId
    );
    expect(artifactName).toBe(
      `production-frontend-${targetSha}-${producerOperationId}`
    );
    const packageBytes = Buffer.from("package bytes");
    const rawArtifactArchive = Buffer.from("raw artifact archive");
    const artifactApiDigest = `sha256:${digest(rawArtifactArchive)}`;
    const artifactRoot = path.join(tempRoot, "artifact");
    const packagePath = path.join(artifactRoot, "target", "package.zip");
    fs.mkdirSync(path.dirname(packagePath), { recursive: true });
    fs.writeFileSync(packagePath, packageBytes);
    writeJson(path.join(artifactRoot, "artifact-portability.json"), {
      contract: "artifact-portability-v1",
      digests: { package_sha256: digest(packageBytes) },
      environment: "production",
      portability: {
        portable: false,
        promotion_authorized: false,
        reuse_authorized: false,
        status: "NOT_PORTABLE",
      },
      schema_version: "artifact-portability.v1",
      source: { git_sha: targetSha },
    });
    writeJson(path.join(artifactRoot, "manifest.json"), {
      artifact_contract: "production-prebuild-v2",
      artifact_name: artifactName,
      build_timestamp: "2026-08-06T00:00:00.000Z",
      environment: "production",
      operation_id: producerOperationId,
      package_sha256: digest(packageBytes),
      repository: "frontend",
      protected_main_sha: protectedMainSha,
      run_attempt: artifactRunAttempt,
      schema_version: 2,
      source_sha: targetSha,
      target_sha: targetSha,
      workflow_run_id: artifactRunId,
      workflow_sha: builderWorkflowSha,
    });
    writeChecksums(artifactRoot, [
      "artifact-portability.json",
      "manifest.json",
      "target/package.zip",
    ]);
    const archivePath = path.join(tempRoot, "artifact.zip");
    fs.writeFileSync(archivePath, rawArtifactArchive);
    const runMetadataPath = path.join(tempRoot, "artifact-run.json");
    writeJson(runMetadataPath, {
      conclusion: "success",
      event: "workflow_dispatch",
      head_branch: "main",
      head_repository: repositoryIdentity(),
      head_sha: builderWorkflowSha,
      id: artifactRunId,
      path: verifier.ARTIFACT_WORKFLOW_PATH,
      repository: repositoryIdentity(),
      run_attempt: artifactRunAttempt,
      status: "completed",
    });
    const artifactMetadataPath = path.join(tempRoot, "artifact.json");
    writeJson(artifactMetadataPath, {
      digest: artifactApiDigest,
      expired: false,
      id: artifactId,
      name: artifactName,
      size_in_bytes: rawArtifactArchive.length,
      workflow_run: {
        head_branch: "main",
        head_sha: builderWorkflowSha,
        id: artifactRunId,
        run_attempt: artifactRunAttempt,
      },
    });
    const protectedMainRefPath = path.join(tempRoot, "protected-main-ref.json");
    writeJson(protectedMainRefPath, {
      object: { sha: currentMainSha, type: "commit" },
      ref: "refs/heads/main",
    });
    const targetAncestryPath = path.join(tempRoot, "target-ancestry.json");
    writeJson(targetAncestryPath, ancestryEvidence(targetSha, 2));
    const protectedMainAncestryPath = path.join(
      tempRoot,
      "protected-main-ancestry.json"
    );
    writeJson(protectedMainAncestryPath, ancestryEvidence(protectedMainSha, 1));

    const common = {
      artifactApiDigest,
      artifactId,
      artifactMetadataFile: artifactMetadataPath,
      artifactName,
      artifactRunAttempt,
      artifactRunId,
      operationId: currentOperationId,
      repository,
      runMetadataFile: runMetadataPath,
      targetSha,
      protectedMainAncestryFile: protectedMainAncestryPath,
      protectedMainRefFile: protectedMainRefPath,
      targetAncestryFile: targetAncestryPath,
    };
    expect(verifier.verifyMetadata(common)).toBeDefined();
    const selectionPath = path.join(tempRoot, "selection", "selection.json");
    const selectionChecksumsPath = path.join(
      tempRoot,
      "selection",
      "SHA256SUMS"
    );
    const selection = verifier.verifyArtifact({
      ...common,
      archive: archivePath,
      artifactRoot,
      checksumsOutput: selectionChecksumsPath,
      output: selectionPath,
      verifierRef: "refs/heads/main",
      verifierRunAttempt,
      verifierRunId,
      verifierWorkflowSha,
    });

    expect(selection["operation_id"]).toBe(currentOperationId);
    expect(selection["artifact_operation_id"]).toBe(producerOperationId);
    expect(selection["artifact_name"]).toBe(artifactName);
    expect(selection["artifact_run_attempt"]).toBe(artifactRunAttempt);
    expect(selection["verifier_run_attempt"]).toBe(verifierRunAttempt);
    expect(selection["protected_main_current_sha"]).toBe(currentMainSha);
    expect(selection["selection_artifact_name"]).toBe(
      verifier.expectedSelectionArtifactName(targetSha, verifierRunAttempt)
    );

    const selectionArchive = Buffer.from("raw selection archive");
    const selectionArchivePath = path.join(tempRoot, "selection.zip");
    fs.writeFileSync(selectionArchivePath, selectionArchive);
    const selectionArtifactId = "345678";
    const selectionArtifactApiDigest = `sha256:${digest(selectionArchive)}`;
    const selectionArtifactMetadataPath = path.join(
      tempRoot,
      "selection-artifact.json"
    );
    writeJson(selectionArtifactMetadataPath, {
      digest: selectionArtifactApiDigest,
      expired: false,
      id: selectionArtifactId,
      name: selection["selection_artifact_name"],
      size_in_bytes: selectionArchive.length,
      workflow_run: {
        head_branch: "main",
        head_sha: verifierWorkflowSha,
        id: verifierRunId,
      },
    });
    const selectionRunMetadataPath = path.join(tempRoot, "selection-run.json");
    writeJson(selectionRunMetadataPath, {
      conclusion: "success",
      event: "workflow_call",
      head_branch: "main",
      head_repository: repositoryIdentity(),
      head_sha: verifierWorkflowSha,
      id: verifierRunId,
      path: verifier.VERIFIER_WORKFLOW_PATH,
      repository: repositoryIdentity(),
      run_attempt: verifierRunAttempt,
      status: "completed",
    });

    const verifiedSelection = verifier.verifySelection({
      archive: selectionArchivePath,
      artifactMetadataFile: selectionArtifactMetadataPath,
      expectedArtifactApiDigest: artifactApiDigest,
      expectedArtifactId: artifactId,
      expectedArtifactName: artifactName,
      expectedArtifactRunAttempt: artifactRunAttempt,
      expectedArtifactRunId: artifactRunId,
      expectedOperationId: currentOperationId,
      expectedSelectionArtifactDigest: selectionArtifactApiDigest,
      expectedTargetSha: targetSha,
      repository,
      selectionArtifactId,
      selectionArtifactName: selection["selection_artifact_name"],
      selectionArtifactRunAttempt: verifierRunAttempt,
      selectionArtifactRunId: verifierRunId,
      selectionRoot: path.join(tempRoot, "selection"),
      selectionRunMetadataFile: selectionRunMetadataPath,
    });
    expect(verifiedSelection["selection_digest"]).toBe(
      selection["selection_digest"]
    );

    const tamperedArchivePath = path.join(tempRoot, "tampered-artifact.zip");
    fs.writeFileSync(
      tamperedArchivePath,
      Buffer.alloc(rawArtifactArchive.length, 0)
    );
    expect(() =>
      verifier.verifyArtifact({
        ...common,
        archive: tamperedArchivePath,
        artifactRoot,
        checksumsOutput: selectionChecksumsPath,
        output: selectionPath,
        verifierRef: "refs/heads/main",
        verifierRunAttempt,
        verifierRunId,
        verifierWorkflowSha,
      })
    ).toThrow("does not match the GitHub artifact API digest");

    expect(() =>
      verifier.verifySelection({
        archive: selectionArchivePath,
        artifactMetadataFile: selectionArtifactMetadataPath,
        expectedArtifactApiDigest: artifactApiDigest,
        expectedArtifactId: artifactId,
        expectedArtifactName: artifactName,
        expectedArtifactRunAttempt: artifactRunAttempt,
        expectedArtifactRunId: artifactRunId,
        expectedOperationId: currentOperationId,
        expectedSelectionArtifactDigest: selectionArtifactApiDigest,
        expectedTargetSha: targetSha,
        repository,
        selectionArtifactId,
        selectionArtifactName: verifier.expectedSelectionArtifactName(
          targetSha,
          verifierRunAttempt + 1
        ),
        selectionArtifactRunAttempt: verifierRunAttempt + 1,
        selectionArtifactRunId: verifierRunId,
        selectionRoot: path.join(tempRoot, "selection"),
        selectionRunMetadataFile: selectionRunMetadataPath,
      })
    ).toThrow("selection artifact metadata name");

    writeJson(targetAncestryPath, {
      ...ancestryEvidence(targetSha, 1),
      ahead_by: 0,
      behind_by: 1,
      status: "behind",
    });
    expect(() =>
      verifier.verifyArtifact({
        ...common,
        archive: archivePath,
        artifactRoot,
        checksumsOutput: selectionChecksumsPath,
        output: selectionPath,
        verifierRef: "refs/heads/main",
        verifierRunAttempt,
        verifierRunId,
        verifierWorkflowSha,
      })
    ).toThrow("target_sha is not an ancestor of current protected main");

    const manifestPath = path.join(artifactRoot, "manifest.json");
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8")
    ) as Record<string, unknown>;
    manifest["protected_main_sha"] = "f".repeat(40);
    writeJson(manifestPath, manifest);
    writeChecksums(artifactRoot, [
      "artifact-portability.json",
      "manifest.json",
      "target/package.zip",
    ]);
    writeJson(targetAncestryPath, ancestryEvidence(targetSha, 2));
    writeJson(protectedMainAncestryPath, ancestryEvidence("0".repeat(40), 1));
    expect(() =>
      verifier.verifyArtifact({
        ...common,
        archive: archivePath,
        artifactRoot,
        checksumsOutput: selectionChecksumsPath,
        output: selectionPath,
        verifierRef: "refs/heads/main",
        verifierRunAttempt,
        verifierRunId,
        verifierWorkflowSha,
      })
    ).toThrow("protected_main_sha compare base_commit does not match");
  });

  it("rejects unsafe archive members and non-regular extracted entries", () => {
    expect(() =>
      verifier.validateArchiveMembers(
        [
          "SHA256SUMS",
          "artifact-portability.json",
          "manifest.json",
          "target/",
          "target/package.zip",
        ].join("\n")
      )
    ).not.toThrow();

    for (const member of [
      "../manifest.json",
      "target/../manifest.json",
      "target//package.zip",
      "/manifest.json",
      "C:/manifest.json",
      "\\\\server\\share\\manifest.json",
      "outside/manifest.json",
      "./manifest.json",
    ]) {
      expect(() =>
        verifier.validateArchiveMembers(
          [
            "SHA256SUMS",
            "artifact-portability.json",
            "manifest.json",
            "target/package.zip",
            member,
          ].join("\n")
        )
      ).toThrow();
    }

    expect(() =>
      verifier.validateArchiveMembers(
        [
          "SHA256SUMS",
          "artifact-portability.json",
          "manifest.json",
          "target/package.zip",
          "manifest.json",
        ].join("\n")
      )
    ).toThrow("duplicate archive member");

    const specialRoot = path.join(tempRoot, "special-entry");
    fs.mkdirSync(path.join(specialRoot, "target"), { recursive: true });
    fs.writeFileSync(
      path.join(specialRoot, "artifact-portability.json"),
      "{}\n"
    );
    fs.writeFileSync(path.join(specialRoot, "manifest.json"), "{}\n");
    fs.mkdirSync(path.join(specialRoot, "target", "package.zip"));
    fs.writeFileSync(
      path.join(specialRoot, "SHA256SUMS"),
      `${digest(fs.readFileSync(path.join(specialRoot, "artifact-portability.json")))}  artifact-portability.json\n${digest(fs.readFileSync(path.join(specialRoot, "manifest.json")))}  manifest.json\n${"0".repeat(64)}  target/package.zip\n`
    );
    expect(() =>
      verifier.verifyChecksums(specialRoot, [
        "artifact-portability.json",
        "manifest.json",
        "target/package.zip",
      ])
    ).toThrow("not a regular file");

    const symlinkRoot = path.join(tempRoot, "symlink-entry");
    fs.mkdirSync(path.join(symlinkRoot, "target"), { recursive: true });
    fs.writeFileSync(
      path.join(symlinkRoot, "artifact-portability.json"),
      "{}\n"
    );
    fs.writeFileSync(path.join(symlinkRoot, "manifest.json"), "{}\n");
    fs.writeFileSync(path.join(symlinkRoot, "target", "package.zip"), "zip\n");
    writeChecksums(symlinkRoot, [
      "artifact-portability.json",
      "manifest.json",
      "target/package.zip",
    ]);
    try {
      fs.symlinkSync(
        path.join(symlinkRoot, "manifest.json"),
        path.join(symlinkRoot, "unexpected-link"),
        "file"
      );
    } catch {
      return;
    }
    expect(() =>
      verifier.verifyChecksums(symlinkRoot, [
        "artifact-portability.json",
        "manifest.json",
        "target/package.zip",
      ])
    ).toThrow("symbolic links are not allowed");
  });

  it("binds each checksum read to one stable regular-file descriptor", () => {
    if (process.platform === "win32") return;

    const raceRoot = path.join(tempRoot, "checksum-race");
    fs.mkdirSync(raceRoot, { recursive: true });
    const manifestPath = path.join(raceRoot, "manifest.json");
    const displacedPath = path.join(raceRoot, "manifest.displaced");
    fs.writeFileSync(manifestPath, "{}\n");
    writeChecksums(raceRoot, ["manifest.json"]);

    const originalOpenSync = fs.openSync;
    let displaced = false;
    const openSpy = jest
      .spyOn(fs, "openSync")
      .mockImplementation((filePath, flags, mode) => {
        const descriptor =
          mode === undefined
            ? originalOpenSync(filePath, flags)
            : originalOpenSync(filePath, flags, mode);
        if (
          !displaced &&
          path.resolve(String(filePath)) === path.resolve(manifestPath)
        ) {
          displaced = true;
          fs.renameSync(manifestPath, displacedPath);
          fs.copyFileSync(displacedPath, manifestPath);
        }
        return descriptor;
      });
    try {
      expect(() =>
        verifier.verifyChecksums(raceRoot, ["manifest.json"])
      ).toThrow("changed while opening");
      expect(displaced).toBe(true);
    } finally {
      openSpy.mockRestore();
      if (displaced) {
        fs.rmSync(manifestPath, { force: true });
        fs.renameSync(displacedPath, manifestPath);
      }
    }
  });

  it("fails closed when identity is absent or producer attempt changes", () => {
    expect(() =>
      verifier.validateVerifierInputs({
        operationId: currentOperationId,
        repository,
        targetSha,
      })
    ).toThrow("artifact_run_id must be a positive decimal ID");

    const runMetadata = {
      conclusion: "success",
      event: "workflow_dispatch",
      head_branch: "main",
      head_repository: repositoryIdentity(),
      head_sha: builderWorkflowSha,
      id: artifactRunId,
      path: verifier.ARTIFACT_WORKFLOW_PATH,
      repository: repositoryIdentity(),
      run_attempt: artifactRunAttempt + 1,
      status: "completed",
    };
    const artifactMetadata = {
      digest: "sha256:" + "c".repeat(64),
      expired: false,
      id: artifactId,
      name: verifier.expectedArtifactName(targetSha, producerOperationId),
      size_in_bytes: 1,
      workflow_run: {
        head_branch: "main",
        head_sha: builderWorkflowSha,
        id: artifactRunId,
      },
    };
    writeJson(path.join(tempRoot, "run.json"), runMetadata);
    writeJson(path.join(tempRoot, "artifact.json"), artifactMetadata);
    expect(() =>
      verifier.verifyMetadata({
        artifactApiDigest: artifactMetadata.digest,
        artifactId,
        artifactMetadataFile: path.join(tempRoot, "artifact.json"),
        artifactName: artifactMetadata.name,
        artifactRunAttempt,
        artifactRunId,
        operationId: currentOperationId,
        repository,
        runMetadataFile: path.join(tempRoot, "run.json"),
        targetSha,
      })
    ).toThrow("run_attempt does not match artifact_run_attempt");

    writeJson(path.join(tempRoot, "push-run.json"), {
      ...runMetadata,
      event: "push",
      run_attempt: artifactRunAttempt,
    });
    expect(() =>
      verifier.verifyMetadata({
        artifactApiDigest: artifactMetadata.digest,
        artifactId,
        artifactMetadataFile: path.join(tempRoot, "artifact.json"),
        artifactName: artifactMetadata.name,
        artifactRunAttempt,
        artifactRunId,
        operationId: currentOperationId,
        repository,
        runMetadataFile: path.join(tempRoot, "push-run.json"),
        targetSha,
      })
    ).toThrow("workflow_dispatch or workflow_call");
  });
});
