const {
  BUILDER_WORKFLOW_PATH,
  EXPECTED_REPOSITORY,
  VERIFIER_WORKFLOW_PATH,
  classifyWorkflowRun,
  canonicalJson,
  computeDisplayTitles,
  expectedDisplayTitle,
  expectedSelectionArtifactName,
  selectTrustedWorkflowRun,
  validateArtifactMetadata,
  validateOperationIdentity,
  validateSelectionArtifactMetadata,
  sha256Buffer,
} = require("../../ops/scripts/one-click-production-children.cjs") as {
  BUILDER_WORKFLOW_PATH: string;
  EXPECTED_REPOSITORY: string;
  VERIFIER_WORKFLOW_PATH: string;
  classifyWorkflowRun: (run: Record<string, unknown>) => string;
  canonicalJson: (value: unknown) => string;
  computeDisplayTitles: (input: {
    operationId: string;
    targetSha: string;
  }) => Record<string, unknown>;
  expectedDisplayTitle: (input: Record<string, unknown>) => string;
  expectedSelectionArtifactName: (
    targetSha: string,
    verifierRunAttempt: number
  ) => string;
  selectTrustedWorkflowRun: (
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  validateArtifactMetadata: (
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  validateOperationIdentity: (input: {
    parentRunId: string;
    targetSha: string;
  }) => Record<string, unknown>;
  validateSelectionArtifactMetadata: (
    input: Record<string, unknown>
  ) => Record<string, unknown>;
  sha256Buffer: (value: Buffer) => string;
};

const TARGET_SHA = "a".repeat(40);
const LATER_MAIN_SHA = "b".repeat(40);
const FOREIGN_SHA = "c".repeat(40);
const WORKFLOW_ID = "123456";
const OPERATION_ID = "frontend-prod-987654";
const TARGET_ARTIFACT = `production-frontend-${TARGET_SHA}-${OPERATION_ID}`;
const ARTIFACT_DIGEST = `sha256:${"d".repeat(64)}`;
const VERIFIER_WORKFLOW_ID = "234567";
const VERIFIER_RUN_ID = "9001";
const VERIFIER_RUN_ATTEMPT = 2;
const VERIFIER_HEAD_SHA = "e".repeat(40);
const SELECTION_ARTIFACT_ID = "9101";
const SELECTION_ARTIFACT_NAME = expectedSelectionArtifactName(
  TARGET_SHA,
  VERIFIER_RUN_ATTEMPT
);
const SOURCE_ARTIFACT = {
  run_id: "7001",
  run_attempt: 1,
  id: "8001",
  name: TARGET_ARTIFACT,
  api_digest: ARTIFACT_DIGEST,
  workflow_sha: LATER_MAIN_SHA,
};

function verifierTitle(sourceOverrides: Record<string, unknown> = {}) {
  return expectedDisplayTitle({
    workflowPath: VERIFIER_WORKFLOW_PATH,
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
    sourceArtifact: { ...SOURCE_ARTIFACT, ...sourceOverrides },
  });
}

const SELECTION_ARTIFACT_DIGEST = `sha256:${"f".repeat(64)}`;

function titles() {
  return computeDisplayTitles({
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
  });
}

function run(overrides: Record<string, unknown> = {}) {
  return {
    id: 7001,
    run_attempt: 1,
    workflow_id: Number(WORKFLOW_ID),
    path: BUILDER_WORKFLOW_PATH,
    event: "workflow_dispatch",
    status: "completed",
    conclusion: "success",
    head_branch: "main",
    head_sha: LATER_MAIN_SHA,
    display_title: titles().builder_display_title,
    repository: { full_name: EXPECTED_REPOSITORY },
    head_repository: { full_name: EXPECTED_REPOSITORY },
    ...overrides,
  };
}

function selectInput(overrides: Record<string, unknown> = {}) {
  return {
    workflowRunsJson: { workflow_runs: [run()] },
    repository: EXPECTED_REPOSITORY,
    workflowPath: BUILDER_WORKFLOW_PATH,
    workflowId: WORKFLOW_ID,
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
    ...overrides,
  };
}

function artifactBundle(overrides: Record<string, unknown> = {}) {
  return {
    run: run(),
    artifacts: [
      {
        id: 8001,
        name: TARGET_ARTIFACT,
        expired: false,
        digest: ARTIFACT_DIGEST,
        workflow_run: { id: 7001, run_attempt: 1, head_sha: LATER_MAIN_SHA },
      },
    ],
    ...overrides,
  };
}

function artifactInput(overrides: Record<string, unknown> = {}) {
  return {
    metadataBundle: artifactBundle(),
    selectedRun: selectedChildRun(),
    repository: EXPECTED_REPOSITORY,
    workflowPath: BUILDER_WORKFLOW_PATH,
    workflowId: WORKFLOW_ID,
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
    artifactRunId: "7001",
    artifactRunAttempt: 1,
    artifactId: "8001",
    artifactName: TARGET_ARTIFACT,
    artifactApiDigest: ARTIFACT_DIGEST,
    ...overrides,
  };
}

function selectedChildRun(overrides: Record<string, unknown> = {}) {
  const selected = selectTrustedWorkflowRun(selectInput()).run;
  if (!selected || typeof selected !== "object") {
    throw new Error("test fixture did not select a child run");
  }
  return { ...(selected as Record<string, unknown>), ...overrides };
}

function verifierRun(overrides: Record<string, unknown> = {}) {
  return {
    id: Number(VERIFIER_RUN_ID),
    run_attempt: VERIFIER_RUN_ATTEMPT,
    workflow_id: Number(VERIFIER_WORKFLOW_ID),
    path: VERIFIER_WORKFLOW_PATH,
    event: "workflow_dispatch",
    status: "completed",
    conclusion: "success",
    head_branch: "main",
    head_sha: VERIFIER_HEAD_SHA,
    display_title: verifierTitle(),
    repository: { full_name: EXPECTED_REPOSITORY },
    head_repository: { full_name: EXPECTED_REPOSITORY },
    ...overrides,
  };
}

function selectedVerifierRun(overrides: Record<string, unknown> = {}) {
  const selected = selectTrustedWorkflowRun({
    workflowRunsJson: { workflow_runs: [verifierRun()] },
    repository: EXPECTED_REPOSITORY,
    workflowPath: VERIFIER_WORKFLOW_PATH,
    workflowId: VERIFIER_WORKFLOW_ID,
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
    sourceArtifact: SOURCE_ARTIFACT,
  }).run;
  if (!selected || typeof selected !== "object") {
    throw new Error("test fixture did not select a verifier run");
  }
  return { ...(selected as Record<string, unknown>), ...overrides };
}

function selectionJson(overrides: Record<string, unknown> = {}) {
  const unsignedSelection = {
    schema_version: 1,
    contract: "production-artifact-selection-v1",
    repository: EXPECTED_REPOSITORY,
    environment: "production",
    target_sha: TARGET_SHA,
    source_sha: TARGET_SHA,
    operation_id: OPERATION_ID,
    artifact_operation_id: OPERATION_ID,
    artifact_workflow_path: BUILDER_WORKFLOW_PATH,
    artifact_workflow_sha: LATER_MAIN_SHA,
    protected_main_sha: LATER_MAIN_SHA,
    protected_main_current_sha: LATER_MAIN_SHA,
    artifact_run_id: "7001",
    artifact_run_attempt: 1,
    artifact_id: "8001",
    artifact_name: TARGET_ARTIFACT,
    artifact_api_digest: ARTIFACT_DIGEST,
    artifact_archive_size_bytes: 100,
    manifest_sha256: "1".repeat(64),
    checksums_sha256: "2".repeat(64),
    package_sha256: "3".repeat(64),
    package_size_bytes: 100,
    selection_artifact_name: SELECTION_ARTIFACT_NAME,
    verifier_workflow_path: VERIFIER_WORKFLOW_PATH,
    verifier_workflow_sha: VERIFIER_HEAD_SHA,
    verifier_ref: "refs/heads/main",
    verifier_run_id: VERIFIER_RUN_ID,
    verifier_run_attempt: VERIFIER_RUN_ATTEMPT,
    ...overrides,
  };
  return {
    ...unsignedSelection,
    selection_digest: sha256Buffer(
      Buffer.from(canonicalJson(unsignedSelection), "utf8")
    ),
  };
}

function selectionBundle(overrides: Record<string, unknown> = {}) {
  return {
    run: verifierRun(),
    artifacts: [
      {
        id: Number(SELECTION_ARTIFACT_ID),
        name: SELECTION_ARTIFACT_NAME,
        expired: false,
        digest: SELECTION_ARTIFACT_DIGEST,
        workflow_run: {
          id: Number(VERIFIER_RUN_ID),
          run_attempt: VERIFIER_RUN_ATTEMPT,
          head_sha: VERIFIER_HEAD_SHA,
        },
      },
    ],
    selection: selectionJson(),
    ...overrides,
  };
}

function selectionInput(overrides: Record<string, unknown> = {}) {
  return {
    metadataBundle: selectionBundle(),
    selectedRun: selectedVerifierRun(),
    repository: EXPECTED_REPOSITORY,
    workflowPath: VERIFIER_WORKFLOW_PATH,
    workflowId: VERIFIER_WORKFLOW_ID,
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
    verifierRunId: VERIFIER_RUN_ID,
    verifierRunAttempt: VERIFIER_RUN_ATTEMPT,
    selectionArtifactId: SELECTION_ARTIFACT_ID,
    selectionArtifactName: SELECTION_ARTIFACT_NAME,
    selectionArtifactApiDigest: SELECTION_ARTIFACT_DIGEST,
    sourceArtifact: {
      run_id: "7001",
      run_attempt: 1,
      id: "8001",
      name: TARGET_ARTIFACT,
      api_digest: ARTIFACT_DIGEST,
      workflow_sha: LATER_MAIN_SHA,
    },
    ...overrides,
  };
}

describe("one-click production child identity", () => {
  it("derives one stable operation from the parent run and preserves the target SHA", () => {
    expect(
      validateOperationIdentity({
        parentRunId: "987654",
        targetSha: TARGET_SHA,
      })
    ).toEqual({
      contract: "one-click-production-children-v1",
      parent_run_id: "987654",
      operation_id: OPERATION_ID,
      target_sha: TARGET_SHA,
    });
  });

  it("computes the exact child display titles", () => {
    expect(titles()).toMatchObject({
      builder_display_title: `Build production artifact ${TARGET_SHA} [${OPERATION_ID}]`,
      verifier_display_title: `Verify production artifact ${TARGET_SHA} [${OPERATION_ID}]`,
    });
  });

  it("binds the verifier display title to the complete builder artifact identity", () => {
    expect(verifierTitle()).toContain(
      `builder 7001/1 8001 ${ARTIFACT_DIGEST} ${LATER_MAIN_SHA}`
    );
    expect(verifierTitle()).not.toBe(titles().verifier_display_title);
  });

  it.each([
    { parentRunId: "0", targetSha: TARGET_SHA },
    { parentRunId: "frontend-prod-987654", targetSha: TARGET_SHA },
    { parentRunId: "987654", targetSha: `A${"a".repeat(39)}` },
  ])("rejects malformed operation inputs: %j", (input) => {
    expect(() => validateOperationIdentity(input)).toThrow();
  });
});

describe("one-click production child run selection", () => {
  it("selects one exact reusable run without looking at list order or recency", () => {
    const result = selectTrustedWorkflowRun(
      selectInput({
        workflowRunsJson: {
          workflow_runs: [
            {
              ...run({ id: 7002, created_at: "9999-01-01T00:00:00Z" }),
              display_title: "unrelated",
            },
            run({ created_at: "2000-01-01T00:00:00Z" }),
          ],
        },
        allowedStates: ["reusable"],
      })
    );
    expect(result).toMatchObject({ result: "selected", state: "reusable" });
    expect(result.run).toMatchObject({ id: "7001", head_sha: LATER_MAIN_SHA });
  });

  it("reports no exact match as absent", () => {
    expect(
      selectTrustedWorkflowRun(
        selectInput({ workflowRunsJson: { workflow_runs: [] } })
      )
    ).toMatchObject({
      result: "absent",
      reason: "no_exact_identity_match",
      run: null,
    });
  });

  it.each([
    { repository: { full_name: "someone-else/frontend" } },
    { head_repository: { full_name: "someone-else/frontend" } },
    { path: ".github/workflows/foreign.yml" },
    { workflow_id: 999999 },
    { event: "push" },
    { head_branch: "feature" },
    { display_title: "Build production artifact forged" },
  ])("treats a foreign identity field as absent: %j", (override) => {
    expect(
      selectTrustedWorkflowRun(
        selectInput({ workflowRunsJson: { workflow_runs: [run(override)] } })
      )
    ).toMatchObject({ result: "absent", run: null });
  });

  it("rejects an exact-title run whose observed head SHA is malformed", () => {
    expect(() =>
      selectTrustedWorkflowRun(
        selectInput({
          workflowRunsJson: {
            workflow_runs: [run({ head_sha: "not-a-lowercase-commit-sha" })],
          },
        })
      )
    ).toThrow(/head SHA/);
  });

  it("fails closed when two exact identities are present", () => {
    expect(() =>
      selectTrustedWorkflowRun(
        selectInput({
          workflowRunsJson: { workflow_runs: [run(), run({ id: 7002 })] },
        })
      )
    ).toThrow(/ambiguous/);
  });

  it("distinguishes an active run from a reusable successful run", () => {
    expect(
      selectTrustedWorkflowRun(
        selectInput({
          workflowRunsJson: {
            workflow_runs: [run({ status: "in_progress", conclusion: null })],
          },
        })
      )
    ).toMatchObject({ result: "selected", state: "active" });
    expect(
      classifyWorkflowRun({ status: "completed", conclusion: "success" })
    ).toBe("reusable");
  });

  it("distinguishes a failed terminal run and never presents it as reusable", () => {
    expect(
      selectTrustedWorkflowRun(
        selectInput({
          workflowRunsJson: {
            workflow_runs: [run({ conclusion: "failure" })],
          },
        })
      )
    ).toMatchObject({
      result: "absent",
      state: "failed_terminal",
      reason: "failed_terminal_only",
    });
    expect(
      selectTrustedWorkflowRun(
        selectInput({
          workflowRunsJson: {
            workflow_runs: [run({ conclusion: "failure" })],
          },
          allowedStates: ["reusable"],
        })
      )
    ).toMatchObject({
      result: "absent",
      state: "failed_terminal",
      reason: "failed_terminal_only",
    });
  });

  it("accepts an observed later-main workflow head without predicting it", () => {
    const result = selectTrustedWorkflowRun(selectInput());
    expect(result).toMatchObject({ target_sha: TARGET_SHA });
    expect(result.run).toMatchObject({ head_sha: LATER_MAIN_SHA });
    expect(result.run).not.toMatchObject({ head_sha: TARGET_SHA });
  });

  it("accepts an old failed child followed by one active retry", () => {
    const result = selectTrustedWorkflowRun(
      selectInput({
        workflowRunsJson: {
          workflow_runs: [
            run({ id: 7000, conclusion: "failure" }),
            run({ id: 7002, status: "in_progress", conclusion: null }),
          ],
        },
      })
    );
    expect(result).toMatchObject({
      result: "selected",
      state: "active",
      run: { id: "7002" },
    });
    expect(result.failed_terminal_runs).toEqual([
      expect.objectContaining({ id: "7000", state: "failed_terminal" }),
    ]);
  });

  it("fails closed on two active eligible children", () => {
    expect(() =>
      selectTrustedWorkflowRun(
        selectInput({
          workflowRunsJson: {
            workflow_runs: [
              run({ id: 7002, status: "in_progress", conclusion: null }),
              run({ id: 7003, status: "queued", conclusion: null }),
            ],
          },
        })
      )
    ).toThrow(/ambiguous eligible/);
  });

  it.each([
    { run_id: "7002" },
    { run_attempt: 2 },
    { id: "8002" },
    { api_digest: `sha256:${"0".repeat(64)}` },
    { workflow_sha: FOREIGN_SHA },
  ])("does not select a verifier bound to a different artifact: %j", (source) => {
    const stale = verifierRun({ display_title: verifierTitle(source) });
    expect(
      selectTrustedWorkflowRun({
        workflowRunsJson: { workflow_runs: [stale] },
        repository: EXPECTED_REPOSITORY,
        workflowPath: VERIFIER_WORKFLOW_PATH,
        workflowId: VERIFIER_WORKFLOW_ID,
        operationId: OPERATION_ID,
        targetSha: TARGET_SHA,
        sourceArtifact: SOURCE_ARTIFACT,
      })
    ).toMatchObject({ result: "absent", reason: "no_exact_identity_match" });
  });
});

describe("one-click production artifact metadata", () => {
  it("validates the exact run/attempt, artifact identity, expiry, digest, and head identity", () => {
    const result = validateArtifactMetadata(artifactInput());
    expect(result).toMatchObject({
      valid: true,
      operation_id: OPERATION_ID,
      target_sha: TARGET_SHA,
      artifact: {
        id: "8001",
        name: TARGET_ARTIFACT,
        digest: ARTIFACT_DIGEST,
      },
      producer_run: { id: "7001", run_attempt: 1, head_sha: LATER_MAIN_SHA },
      head_identity: {
        target_sha: TARGET_SHA,
        workflow_sha: LATER_MAIN_SHA,
        target_is_workflow_head: false,
      },
    });
  });

  it.each([
    { artifactRunId: "7002" },
    { artifactRunAttempt: 2 },
    { artifactId: "8002" },
    { artifactName: `production-frontend-${FOREIGN_SHA}-${OPERATION_ID}` },
    { artifactApiDigest: `sha256:${"e".repeat(64)}` },
    { selectedRun: selectedChildRun({ head_sha: FOREIGN_SHA }) },
  ])("rejects forged exact metadata: %j", (override) => {
    expect(() => validateArtifactMetadata(artifactInput(override))).toThrow();
  });

  it("rejects expired artifacts", () => {
    expect(() =>
      validateArtifactMetadata(
        artifactInput({
          metadataBundle: artifactBundle({
            artifacts: [{ ...artifactBundle().artifacts[0], expired: true }],
          }),
        })
      )
    ).toThrow(/expired/);
  });

  it("rejects multiple artifacts that could satisfy the requested identity", () => {
    const exact = artifactBundle().artifacts[0];
    expect(() =>
      validateArtifactMetadata(
        artifactInput({
          metadataBundle: artifactBundle({
            artifacts: [exact, { ...exact, id: 8002 }],
          }),
        })
      )
    ).toThrow(/exactly one matching artifact/);
  });

  it("rejects a forged artifact workflow attachment or later-main head", () => {
    const exact = artifactBundle().artifacts[0];
    expect(() =>
      validateArtifactMetadata(
        artifactInput({
          metadataBundle: artifactBundle({
            artifacts: [{ ...exact, workflow_run: { id: 7002 } }],
          }),
        })
      )
    ).toThrow(/producer run/);
    expect(() =>
      validateArtifactMetadata(
        artifactInput({
          metadataBundle: artifactBundle({
            run: run({ head_sha: TARGET_SHA }),
          }),
        })
      )
    ).toThrow(/selected child run/);
  });

  it("validates the optional v2 manifest without collapsing workflow head into target", () => {
    const result = validateArtifactMetadata(
      artifactInput({
        metadataBundle: artifactBundle({
          manifest: {
            artifact_contract: "production-prebuild-v2",
            repository: "frontend",
            environment: "production",
            source_sha: TARGET_SHA,
            target_sha: TARGET_SHA,
            operation_id: OPERATION_ID,
            artifact_name: TARGET_ARTIFACT,
            workflow_run_id: "7001",
            run_attempt: 1,
            workflow_sha: LATER_MAIN_SHA,
            protected_main_sha: LATER_MAIN_SHA,
          },
        }),
      })
    );
    expect(result.head_identity).toMatchObject({
      target_sha: TARGET_SHA,
      workflow_sha: LATER_MAIN_SHA,
    });
  });
});

describe("one-click production verifier selection artifact metadata", () => {
  it("validates the exact successful verifier run, attempt, artifact, and selection digest", () => {
    const result = validateSelectionArtifactMetadata(selectionInput());
    expect(result).toMatchObject({
      valid: true,
      operation_id: OPERATION_ID,
      target_sha: TARGET_SHA,
      selection_artifact: {
        id: SELECTION_ARTIFACT_ID,
        name: SELECTION_ARTIFACT_NAME,
        digest: SELECTION_ARTIFACT_DIGEST,
        workflow_run_id: VERIFIER_RUN_ID,
        workflow_run_attempt: VERIFIER_RUN_ATTEMPT,
      },
      verifier_run: { id: VERIFIER_RUN_ID, head_sha: VERIFIER_HEAD_SHA },
      selection_json_validated: true,
    });
  });

  it.each([
    {
      label: "wrong attempt attachment",
      metadataBundle: selectionBundle({
        artifacts: [
          {
            ...selectionBundle().artifacts[0],
            workflow_run: {
              id: Number(VERIFIER_RUN_ID),
              run_attempt: 3,
              head_sha: VERIFIER_HEAD_SHA,
            },
          },
        ],
      }),
    },
    {
      label: "wrong artifact name",
      metadataBundle: selectionBundle({
        artifacts: [
          { ...selectionBundle().artifacts[0], name: "selection-forged" },
        ],
      }),
    },
    {
      label: "wrong API digest",
      selectionArtifactApiDigest: `sha256:${"0".repeat(64)}`,
    },
    {
      label: "wrong verifier run",
      metadataBundle: selectionBundle({
        artifacts: [
          {
            ...selectionBundle().artifacts[0],
            workflow_run: {
              id: 9002,
              run_attempt: VERIFIER_RUN_ATTEMPT,
              head_sha: VERIFIER_HEAD_SHA,
            },
          },
        ],
      }),
    },
  ])("rejects $label", ({ label: _label, ...override }) => {
    expect(() =>
      validateSelectionArtifactMetadata(selectionInput(override))
    ).toThrow();
  });

  it("rejects expired selection artifacts", () => {
    const exact = selectionBundle().artifacts[0];
    expect(() =>
      validateSelectionArtifactMetadata(
        selectionInput({
          metadataBundle: selectionBundle({
            artifacts: [{ ...exact, expired: true }],
          }),
        })
      )
    ).toThrow(/expired/);
  });

  it("rejects multiple candidates even when one has the requested ID", () => {
    const exact = selectionBundle().artifacts[0];
    expect(() =>
      validateSelectionArtifactMetadata(
        selectionInput({
          metadataBundle: selectionBundle({
            artifacts: [exact, { ...exact, id: 9102 }],
          }),
        })
      )
    ).toThrow(/exactly one matching artifact/);
  });

  it("rejects a forged selection digest", () => {
    expect(() =>
      validateSelectionArtifactMetadata(
        selectionInput({
          metadataBundle: selectionBundle({
            selection: {
              ...selectionJson(),
              selection_digest: "e".repeat(64),
            },
          }),
        })
      )
    ).toThrow(/selection_digest/);
  });

  it("rejects semantically forged source identity even with a recomputed digest", () => {
    expect(() =>
      validateSelectionArtifactMetadata(
        selectionInput({
          metadataBundle: selectionBundle({
            selection: selectionJson({ artifact_workflow_sha: TARGET_SHA }),
          }),
        })
      )
    ).toThrow(/artifact_workflow_sha/);
  });
});
