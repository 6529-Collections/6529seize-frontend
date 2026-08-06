import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  BUILDER_WORKFLOW_PATH,
  EXPECTED_REPOSITORY,
  VERIFIER_WORKFLOW_PATH,
  canonicalJson,
  computeDisplayTitles,
  expectedDisplayTitle,
  sha256Buffer,
} = require("../../ops/scripts/one-click-production-children.cjs") as {
  BUILDER_WORKFLOW_PATH: string;
  EXPECTED_REPOSITORY: string;
  VERIFIER_WORKFLOW_PATH: string;
  canonicalJson: (value: unknown) => string;
  computeDisplayTitles: (input: {
    operationId: string;
    targetSha: string;
  }) => Record<string, unknown>;
  expectedDisplayTitle: (input: Record<string, unknown>) => string;
  sha256Buffer: (value: Buffer) => string;
};

const {
  GITHUB_API_VERSION,
  OUTPUT_FIELDS,
  createGitHubClient,
  runOneClickProductionChildren,
} = require("../../ops/scripts/run-one-click-production-children.cjs") as {
  GITHUB_API_VERSION: string;
  OUTPUT_FIELDS: string[];
  createGitHubClient: (input: Record<string, unknown>) => {
    request: (
      input: Record<string, unknown>
    ) => Promise<Record<string, unknown>>;
  };
  runOneClickProductionChildren: (input: Record<string, unknown>) => Promise<{
    record: Record<string, unknown>;
    canonical: string;
  }>;
};

const TARGET_SHA = "a".repeat(40);
const LATER_MAIN_SHA = "b".repeat(40);
const VERIFIER_SHA = "c".repeat(40);
const OPERATION_ID = "frontend-prod-987654";
const PARENT_RUN_ID = "987654";
const PARENT_RUN_ATTEMPT = 2;
const BUILDER_WORKFLOW_ID = "123456";
const VERIFIER_WORKFLOW_ID = "234567";
const BUILDER_RUN_ID = "7001";
const VERIFIER_RUN_ID = "9001";
const BUILDER_RUN_ATTEMPT = 1;
const VERIFIER_RUN_ATTEMPT = 2;
const BUILDER_ARTIFACT_ID = "8001";
const SELECTION_ARTIFACT_ID = "9101";
const BUILDER_ARTIFACT_DIGEST = `sha256:${"d".repeat(64)}`;
const SELECTION_ARTIFACT_DIGEST = `sha256:${"e".repeat(64)}`;
const BUILDER_ARTIFACT_NAME = `production-frontend-${TARGET_SHA}-${OPERATION_ID}`;
const SELECTION_ARTIFACT_NAME = `one-click-production-selection-${TARGET_SHA}-a${VERIFIER_RUN_ATTEMPT}`;

const BUILDER_SOURCE_ARTIFACT = {
  run_id: BUILDER_RUN_ID,
  run_attempt: BUILDER_RUN_ATTEMPT,
  id: BUILDER_ARTIFACT_ID,
  name: BUILDER_ARTIFACT_NAME,
  api_digest: BUILDER_ARTIFACT_DIGEST,
  workflow_sha: LATER_MAIN_SHA,
};

function titles() {
  return computeDisplayTitles({
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
  });
}

function verifierTitle(sourceOverrides: Record<string, unknown> = {}) {
  return expectedDisplayTitle({
    workflowPath: VERIFIER_WORKFLOW_PATH,
    operationId: OPERATION_ID,
    targetSha: TARGET_SHA,
    sourceArtifact: { ...BUILDER_SOURCE_ARTIFACT, ...sourceOverrides },
  });
}

function workflowRun({
  kind,
  status = "completed",
  conclusion = "success",
  id = kind === "builder" ? BUILDER_RUN_ID : VERIFIER_RUN_ID,
  runAttempt = kind === "builder" ? BUILDER_RUN_ATTEMPT : VERIFIER_RUN_ATTEMPT,
  headSha = kind === "builder" ? LATER_MAIN_SHA : VERIFIER_SHA,
  overrides = {},
}: {
  kind: "builder" | "verifier";
  status?: string;
  conclusion?: string | null;
  id?: string;
  runAttempt?: number;
  headSha?: string;
  overrides?: Record<string, unknown>;
}) {
  const verifier = kind === "verifier";
  return {
    id: Number(id),
    run_attempt: runAttempt,
    workflow_id: Number(verifier ? VERIFIER_WORKFLOW_ID : BUILDER_WORKFLOW_ID),
    path: verifier ? VERIFIER_WORKFLOW_PATH : BUILDER_WORKFLOW_PATH,
    event: "workflow_dispatch",
    status,
    conclusion,
    head_branch: "main",
    head_sha: headSha,
    display_title: verifier
      ? verifierTitle()
      : titles().builder_display_title,
    repository: { full_name: EXPECTED_REPOSITORY },
    head_repository: { full_name: EXPECTED_REPOSITORY },
    ...overrides,
  };
}

function selectionJson(overrides: Record<string, unknown> = {}) {
  const unsigned = {
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
    artifact_run_id: BUILDER_RUN_ID,
    artifact_run_attempt: BUILDER_RUN_ATTEMPT,
    artifact_id: BUILDER_ARTIFACT_ID,
    artifact_name: BUILDER_ARTIFACT_NAME,
    artifact_api_digest: BUILDER_ARTIFACT_DIGEST,
    artifact_archive_size_bytes: 100,
    manifest_sha256: "1".repeat(64),
    checksums_sha256: "2".repeat(64),
    package_sha256: "3".repeat(64),
    package_size_bytes: 100,
    selection_artifact_name: SELECTION_ARTIFACT_NAME,
    verifier_workflow_path: VERIFIER_WORKFLOW_PATH,
    verifier_workflow_sha: VERIFIER_SHA,
    verifier_ref: "refs/heads/main",
    verifier_run_id: VERIFIER_RUN_ID,
    verifier_run_attempt: VERIFIER_RUN_ATTEMPT,
    ...overrides,
  };
  return {
    ...unsigned,
    selection_digest: sha256Buffer(
      Buffer.from(canonicalJson(unsigned), "utf8")
    ),
  };
}

function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipEntries(entries: Array<{ name: string; content: Buffer }>) {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let localOffset = 0;
  for (const { name, content } of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const checksum = crc32(content);
    const local = Buffer.alloc(30 + nameBytes.length + content.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    nameBytes.copy(local, 30);
    content.copy(local, 30 + nameBytes.length);
    locals.push(local);

    const centralEntry = Buffer.alloc(46 + nameBytes.length);
    centralEntry.writeUInt32LE(0x02014b50, 0);
    centralEntry.writeUInt16LE(20, 4);
    centralEntry.writeUInt16LE(20, 6);
    centralEntry.writeUInt16LE(0, 8);
    centralEntry.writeUInt16LE(0, 10);
    centralEntry.writeUInt16LE(0, 12);
    centralEntry.writeUInt32LE(checksum, 16);
    centralEntry.writeUInt32LE(content.length, 20);
    centralEntry.writeUInt32LE(content.length, 24);
    centralEntry.writeUInt16LE(nameBytes.length, 28);
    centralEntry.writeUInt16LE(0, 30);
    centralEntry.writeUInt16LE(0, 32);
    centralEntry.writeUInt16LE(0, 34);
    centralEntry.writeUInt16LE(0, 36);
    centralEntry.writeUInt32LE(0, 38);
    centralEntry.writeUInt32LE(localOffset, 42);
    nameBytes.copy(centralEntry, 46);
    central.push(centralEntry);
    localOffset += local.length;
  }
  const centralBytes = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...locals, centralBytes, eocd]);
}

function zipSelection(selection: Record<string, unknown>) {
  return zipEntries([
    {
      name: "selection.json",
      content: Buffer.from(JSON.stringify(selection), "utf8"),
    },
    {
      name: "SHA256SUMS",
      content: Buffer.from("selection.json  selection.json\n", "utf8"),
    },
  ]);
}

type ArtifactOverrides = {
  id?: string | number;
  name?: string;
  expired?: boolean;
  digest?: string;
  workflow_run?: Record<string, unknown>;
};

function artifactRecord(
  kind: "builder" | "selection",
  overrides: ArtifactOverrides = {}
) {
  const selection = kind === "selection";
  return {
    id: Number(selection ? SELECTION_ARTIFACT_ID : BUILDER_ARTIFACT_ID),
    name: selection ? SELECTION_ARTIFACT_NAME : BUILDER_ARTIFACT_NAME,
    expired: false,
    digest: selection ? SELECTION_ARTIFACT_DIGEST : BUILDER_ARTIFACT_DIGEST,
    workflow_run: {
      id: Number(selection ? VERIFIER_RUN_ID : BUILDER_RUN_ID),
      run_attempt: selection ? VERIFIER_RUN_ATTEMPT : BUILDER_RUN_ATTEMPT,
      head_sha: selection ? VERIFIER_SHA : LATER_MAIN_SHA,
    },
    ...overrides,
  };
}

class FakeGitHub {
  readonly calls: Array<Record<string, unknown>> = [];
  private readonly builderRuns: Array<Array<Record<string, unknown>>>;
  private readonly verifierRuns: Array<Array<Record<string, unknown>>>;
  private builderCall = 0;
  private verifierCall = 0;
  private readonly builderArtifacts: Array<Record<string, unknown>>;
  private readonly verifierArtifacts: Array<Record<string, unknown>>;
  private readonly zip: Buffer;
  private readonly statusOverrides: Record<string, number>;

  constructor({
    builderRuns = [[workflowRun({ kind: "builder" })]],
    verifierRuns = [[workflowRun({ kind: "verifier" })]],
    builderArtifacts = [artifactRecord("builder")],
    verifierArtifacts = [artifactRecord("selection")],
    selection = selectionJson(),
    statusOverrides = {},
  }: {
    builderRuns?: Array<Array<Record<string, unknown>>>;
    verifierRuns?: Array<Array<Record<string, unknown>>>;
    builderArtifacts?: Array<Record<string, unknown>>;
    verifierArtifacts?: Array<Record<string, unknown>>;
    selection?: Record<string, unknown>;
    statusOverrides?: Record<string, number>;
  } = {}) {
    this.builderRuns = builderRuns;
    this.verifierRuns = verifierRuns;
    this.builderArtifacts = builderArtifacts;
    this.verifierArtifacts = verifierArtifacts;
    this.zip = zipSelection(selection);
    this.statusOverrides = statusOverrides;
  }

  request = async (request: Record<string, unknown>) => {
    this.calls.push({
      ...request,
      headers: { ...(request.headers as Record<string, string>) },
    });
    const method = request.method as string;
    const path = request.path as string;
    const status = this.statusOverrides[path];
    if (status) {
      return {
        status,
        body: Buffer.from("error body that must not be logged"),
      };
    }
    const cleanPath = path.split("?")[0];
    if (method === "GET" && cleanPath.endsWith("/actions/workflows")) {
      return {
        status: 200,
        body: {
          total_count: 2,
          workflows: [
            {
              id: Number(BUILDER_WORKFLOW_ID),
              path: BUILDER_WORKFLOW_PATH,
              repository: { full_name: EXPECTED_REPOSITORY },
            },
            {
              id: Number(VERIFIER_WORKFLOW_ID),
              path: VERIFIER_WORKFLOW_PATH,
              repository: { full_name: EXPECTED_REPOSITORY },
            },
          ],
        },
      };
    }
    const runsMatch = cleanPath.match(/\/actions\/workflows\/(\d+)\/runs$/u);
    if (method === "GET" && runsMatch) {
      const kind =
        runsMatch[1] === BUILDER_WORKFLOW_ID ? "builder" : "verifier";
      const sequence =
        kind === "builder" ? this.builderRuns : this.verifierRuns;
      const index =
        kind === "builder" ? this.builderCall++ : this.verifierCall++;
      const runs = sequence[Math.min(index, sequence.length - 1)] || [];
      return { status: 200, body: { workflow_runs: runs } };
    }
    const dispatchMatch = cleanPath.match(
      /\/actions\/workflows\/(\d+)\/dispatches$/u
    );
    if (method === "POST" && dispatchMatch) {
      return { status: 204, body: Buffer.alloc(0) };
    }
    const runMatch = cleanPath.match(/\/actions\/runs\/(\d+)$/u);
    if (method === "GET" && runMatch) {
      const id = runMatch[1];
      const isBuilderRun = this.builderRuns
        .flat()
        .some((candidate) => String(candidate.id) === id);
      const run = isBuilderRun
        ? this.builderRuns
            .flat()
            .reverse()
            .find((candidate) => String(candidate.id) === id)
        : this.verifierRuns
            .flat()
            .reverse()
            .find((candidate) => String(candidate.id) === id);
      return { status: 200, body: run };
    }
    const artifactsMatch = cleanPath.match(
      /\/actions\/runs\/(\d+)\/artifacts$/u
    );
    if (method === "GET" && artifactsMatch) {
      const isBuilderRun = this.builderRuns
        .flat()
        .some((candidate) => String(candidate.id) === artifactsMatch[1]);
      const artifacts = isBuilderRun
        ? this.builderArtifacts
        : this.verifierArtifacts;
      return { status: 200, body: { artifacts } };
    }
    const zipMatch = cleanPath.match(/\/actions\/artifacts\/(\d+)\/zip$/u);
    if (method === "GET" && zipMatch) {
      return { status: 200, body: this.zip };
    }
    throw new Error(`unexpected fake request: ${method} ${path}`);
  };
}

function setup(fake: FakeGitHub) {
  return {
    repository: EXPECTED_REPOSITORY,
    targetSha: TARGET_SHA,
    operationId: OPERATION_ID,
    parentRunId: PARENT_RUN_ID,
    parentRunAttempt: PARENT_RUN_ATTEMPT,
    client: createGitHubClient({
      token: "test-token",
      requestAdapter: fake.request,
    }),
    operationTimeoutMs: 1_000,
    pollIntervalMs: 0,
    maxPolls: 20,
    sleep: async () => undefined,
  };
}

describe("run-one-click-production-children", () => {
  it("dispatches fresh children once, observes later workflow heads, validates ZIP selection, and emits deterministic outputs", async () => {
    const builderActive = workflowRun({
      kind: "builder",
      status: "in_progress",
      conclusion: null,
      headSha: LATER_MAIN_SHA,
    });
    const verifierActive = workflowRun({
      kind: "verifier",
      status: "in_progress",
      conclusion: null,
    });
    const fake = new FakeGitHub({
      builderRuns: [[], [builderActive], [workflowRun({ kind: "builder" })]],
      verifierRuns: [[], [verifierActive], [workflowRun({ kind: "verifier" })]],
    });
    const outputDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "6529-one-click-runner-")
    );
    const outputFile = path.join(outputDirectory, "result.json");
    const githubOutputFile = path.join(outputDirectory, "github-output");
    let first!: Awaited<ReturnType<typeof runOneClickProductionChildren>>;
    try {
      first = await runOneClickProductionChildren({
        ...setup(fake),
        outputFile,
        githubOutputFile,
      });
      expect(fs.readFileSync(outputFile, "utf8")).toBe(first.canonical);
      const githubLines = fs
        .readFileSync(githubOutputFile, "utf8")
        .trim()
        .split(/\r?\n/u);
      expect(githubLines).toHaveLength(OUTPUT_FIELDS.length);
      expect(githubLines.map((line) => line.split("=", 1)[0])).toEqual(
        OUTPUT_FIELDS
      );
    } finally {
      fs.rmSync(outputDirectory, { recursive: true, force: true });
    }
    const secondFake = new FakeGitHub({
      builderRuns: [[workflowRun({ kind: "builder" })]],
      verifierRuns: [[workflowRun({ kind: "verifier" })]],
    });
    const second = await runOneClickProductionChildren(setup(secondFake));

    expect(first.record).toEqual(second.record);
    expect(first.record).toMatchObject({
      builder_run_id: BUILDER_RUN_ID,
      builder_run_attempt: BUILDER_RUN_ATTEMPT,
      builder_workflow_sha: LATER_MAIN_SHA,
      verifier_run_id: VERIFIER_RUN_ID,
      verifier_workflow_sha: VERIFIER_SHA,
      artifact_id: BUILDER_ARTIFACT_ID,
      artifact_name: BUILDER_ARTIFACT_NAME,
      artifact_api_digest: BUILDER_ARTIFACT_DIGEST,
      selection_artifact_run_id: VERIFIER_RUN_ID,
      selection_artifact_id: SELECTION_ARTIFACT_ID,
      selection_artifact_name: SELECTION_ARTIFACT_NAME,
      selection_artifact_api_digest: SELECTION_ARTIFACT_DIGEST,
      selection_digest: selectionJson().selection_digest,
    });
    expect(first.canonical).toBe(`${canonicalJson(first.record)}\n`);
    expect(first.canonical).not.toContain("test-token");
    expect(
      fake.calls.filter(
        (call) =>
          call.method === "POST" && String(call.path).includes("dispatches")
      )
    ).toHaveLength(2);
    expect(fake.calls[0].headers).toMatchObject({
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      Accept: "application/vnd.github+json",
    });
    const dispatches = fake.calls.filter(
      (call) =>
        call.method === "POST" && String(call.path).includes("dispatches")
    );
    expect(dispatches[0].body).toEqual({
      ref: "main",
      inputs: { target_sha: TARGET_SHA, operation_id: OPERATION_ID },
    });
    expect(dispatches[1].body).toMatchObject({
      ref: "main",
      inputs: {
        target_sha: TARGET_SHA,
        operation_id: OPERATION_ID,
        artifact_run_id: BUILDER_RUN_ID,
        artifact_run_attempt: String(BUILDER_RUN_ATTEMPT),
        artifact_id: BUILDER_ARTIFACT_ID,
        artifact_api_digest: BUILDER_ARTIFACT_DIGEST,
        artifact_name: BUILDER_ARTIFACT_NAME,
        artifact_workflow_sha: LATER_MAIN_SHA,
      },
    });
    expect(OUTPUT_FIELDS).toContain("selection_digest");
  });

  it("reuses one exact successful child and accepts one old failure plus one active retry", async () => {
    const oldFailure = workflowRun({
      kind: "builder",
      id: "7000",
      conclusion: "failure",
    });
    const activeRetry = workflowRun({
      kind: "builder",
      id: BUILDER_RUN_ID,
      status: "queued",
      conclusion: null,
    });
    const fake = new FakeGitHub({
      builderRuns: [
        [oldFailure, activeRetry],
        [workflowRun({ kind: "builder" })],
      ],
      verifierRuns: [[workflowRun({ kind: "verifier" })]],
    });
    const result = await runOneClickProductionChildren(setup(fake));
    expect(result.record.builder_run_id).toBe(BUILDER_RUN_ID);
    expect(
      fake.calls.filter(
        (call) =>
          call.method === "POST" && String(call.path).includes("dispatches")
      )
    ).toHaveLength(0);
  });

  it("redispatches once after failed-only history", async () => {
    const failed = workflowRun({ kind: "builder", conclusion: "failure" });
    const fake = new FakeGitHub({
      builderRuns: [[failed], [failed], [workflowRun({ kind: "builder" })]],
      verifierRuns: [[workflowRun({ kind: "verifier" })]],
    });
    await runOneClickProductionChildren(setup(fake));
    const builderDispatches = fake.calls.filter(
      (call) =>
        call.method === "POST" &&
        String(call.path).includes(`/workflows/${BUILDER_WORKFLOW_ID}/`)
    );
    expect(builderDispatches).toHaveLength(1);
  });

  it.each([
    { repository: { full_name: "other/repo" } },
    { head_repository: { full_name: "other/repo" } },
    { path: ".github/workflows/other.yml" },
    { workflow_id: 999999 },
    { event: "push" },
    { head_branch: "feature" },
    { display_title: "forged title" },
  ])(
    "ignores a child with a wrong exact identity field: %j",
    async (override) => {
      const foreign = workflowRun({ kind: "builder", overrides: override });
      const fake = new FakeGitHub({
        builderRuns: [[foreign], [workflowRun({ kind: "builder" })]],
        verifierRuns: [[workflowRun({ kind: "verifier" })]],
      });
      await runOneClickProductionChildren(setup(fake));
      expect(
        fake.calls.filter(
          (call) =>
            call.method === "POST" &&
            String(call.path).includes(`/workflows/${BUILDER_WORKFLOW_ID}/`)
        )
      ).toHaveLength(1);
    }
  );

  it("fails closed on two eligible children", async () => {
    const fake = new FakeGitHub({
      builderRuns: [
        [
          workflowRun({
            kind: "builder",
            id: "7001",
            status: "in_progress",
            conclusion: null,
          }),
          workflowRun({
            kind: "builder",
            id: "7002",
            status: "queued",
            conclusion: null,
          }),
        ],
      ],
    });
    await expect(runOneClickProductionChildren(setup(fake))).rejects.toThrow(
      /ambiguous eligible/
    );
  });

  it.each([
    { expired: true },
    {
      id: "8002",
      workflow_run: { id: 9999, run_attempt: 1, head_sha: LATER_MAIN_SHA },
    },
    { digest: `sha256:${"0".repeat(64)}` },
  ])(
    "rejects duplicate, expired, or forged builder artifact metadata: %j",
    async (artifactOverride) => {
      const fake = new FakeGitHub({
        builderArtifacts: [artifactRecord("builder", artifactOverride)],
        verifierRuns: [],
      });
      await expect(
        runOneClickProductionChildren(setup(fake))
      ).rejects.toThrow();
    }
  );

  it("rejects duplicate canonical artifacts", async () => {
    const exact = artifactRecord("builder");
    const fake = new FakeGitHub({
      builderArtifacts: [exact, { ...exact, id: 8002 }],
      verifierRuns: [],
    });
    await expect(runOneClickProductionChildren(setup(fake))).rejects.toThrow(
      /exactly one canonical artifact/
    );
  });

  it("rejects a forged downloaded selection digest", async () => {
    const forged = {
      ...selectionJson(),
      selection_digest: "f".repeat(64),
    };
    const fake = new FakeGitHub({ selection: forged });
    await expect(runOneClickProductionChildren(setup(fake))).rejects.toThrow(
      /selection_digest/
    );
  });

  it("fails when the dispatched builder fails terminally", async () => {
    const failed = workflowRun({ kind: "builder", conclusion: "failure" });
    const fake = new FakeGitHub({
      builderRuns: [[], [failed]],
      verifierRuns: [],
    });
    await expect(runOneClickProductionChildren(setup(fake))).rejects.toThrow(
      /builder child/
    );
  });

  it("fails when the dispatched verifier fails terminally", async () => {
    const failed = workflowRun({ kind: "verifier", conclusion: "failure" });
    const fake = new FakeGitHub({
      verifierRuns: [[], [failed]],
    });
    await expect(runOneClickProductionChildren(setup(fake))).rejects.toThrow(
      /verifier child/
    );
  });

  it("fails at the bounded polling limit", async () => {
    const active = workflowRun({
      kind: "builder",
      status: "in_progress",
      conclusion: null,
    });
    const fake = new FakeGitHub({
      builderRuns: [[active]],
    });
    await expect(
      runOneClickProductionChildren({
        ...setup(fake),
        maxPolls: 2,
      })
    ).rejects.toThrow(/bounded poll count/);
  });

  it("does not redispatch when an already observed child temporarily disappears", async () => {
    const active = workflowRun({
      kind: "builder",
      status: "in_progress",
      conclusion: null,
    });
    const fake = new FakeGitHub({
      builderRuns: [[active], []],
    });
    await expect(
      runOneClickProductionChildren({
        ...setup(fake),
        maxPolls: 2,
      })
    ).rejects.toThrow(/bounded poll count/);
    expect(
      fake.calls.filter(
        (call) =>
          call.method === "POST" &&
          String(call.path).includes(`/workflows/${BUILDER_WORKFLOW_ID}/`)
      )
    ).toHaveLength(0);
  });

  it("does not expose an HTTP error body", async () => {
    const fake = new FakeGitHub({
      statusOverrides: {
        [`/repos/${EXPECTED_REPOSITORY}/actions/workflows?per_page=100&page=1`]: 503,
      },
    });
    await expect(runOneClickProductionChildren(setup(fake))).rejects.toThrow(
      /HTTP 503/
    );
    await expect(
      runOneClickProductionChildren(setup(fake))
    ).rejects.not.toThrow(/error body/);
  });

  it("validates the ZIP reader's cryptographic payload path", () => {
    const payload = selectionJson();
    const archive = zipSelection(payload);
    expect(createHash("sha256").update(archive).digest("hex")).toHaveLength(64);
  });
});
