import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const authority =
  require("../../ops/scripts/one-click-production-authority.cjs") as {
    AUTHORITY_PATH: string;
    MAX_RESPONSE_BYTES: number;
    buildAcquireBindPayload: (
      input: Record<string, unknown>
    ) => Record<string, unknown>;
    buildCompletePayload: (
      input: Record<string, unknown>
    ) => Record<string, unknown>;
    buildFailPayload: (
      input: Record<string, unknown>
    ) => Record<string, unknown>;
    buildReauthorizePayload: (
      input: Record<string, unknown>
    ) => Record<string, unknown>;
    canonicalJson: (value: unknown) => string;
    parseStrictJson: (
      value: string,
      label: string,
      maxBytes: number
    ) => unknown;
    validateResponse: (
      command: string,
      request: Record<string, unknown>,
      response: Record<string, unknown>,
      expected: Record<string, unknown>
    ) => Record<string, unknown>;
  };

const TARGET_SHA = "a".repeat(40);
const SELECTION_DIGEST = "b".repeat(64);
const EVIDENCE_DIGEST = "c".repeat(64);
const EPOCH = { all: 7, mode: "OFF", production: 11 };

const common = {
  parent_run_id: "9001",
  target_sha: TARGET_SHA,
  workflow_run_attempt: 2,
  workflow_run_id: "123456",
};

function stringField(record: Record<string, unknown>, key: string): string {
  const value: unknown = record[key];
  if (typeof value !== "string") {
    throw new Error(`Expected ${key} to be a string`);
  }
  return value;
}

const failureInput = (
  selection_digest: string | null,
  reason_code: string
) => ({
  ...common,
  evidence_digest: EVIDENCE_DIGEST,
  qualifier_workflow_run_attempt: 3,
  qualifier_workflow_run_id: "789012",
  reason_code,
  selection_digest,
});

function bindResponse(request: Record<string, unknown>) {
  return {
    controller_identity: "frontend-production-workflow",
    control_epoch: EPOCH,
    environment: "prod",
    hard_expires_at: 2000,
    lease_expires_at: 1500,
    lock_row_version: 19,
    operation_id: request["operation_id"],
    repository: "frontend",
    reused: false,
    selection_digest: request["selection_digest"],
    service: "frontend",
    status: "BOUND",
    target_sha: request["target_sha"],
    workflow_run_attempt: request["workflow_run_attempt"],
    workflow_run_id: request["workflow_run_id"],
    authorized: true,
    bound: true,
  };
}

function completionResponse(
  operationId: string,
  field: "completed" | "failed"
) {
  return {
    [field]: true,
    lock_row_version: 20,
    operation_id: operationId,
    reused: false,
    status: field === "completed" ? "COMPLETED" : "FAILED",
  };
}

function expectedBinding(selectionDigest: string | null) {
  return {
    authorized: true,
    bound: true,
    control_epoch: EPOCH,
    lock_row_version: 19,
    parent_run_id: common.parent_run_id,
    selection_digest: selectionDigest,
    status: "BOUND",
    target_sha: TARGET_SHA,
    workflow_run_attempt: 2,
    workflow_run_id: common.workflow_run_id,
  };
}

describe("one-click production authority client", () => {
  it("exposes the versioned endpoint contract without networking", () => {
    expect(authority.AUTHORITY_PATH).toBe(
      "/deploy/release-bus-v2/production-authority"
    );
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "ops/scripts/one-click-production-authority.cjs"
      ),
      "utf8"
    );
    expect(source).not.toMatch(
      /\b(?:fetch|require\(["']node:(?:http|https|net)["']\))/u
    );
    expect(source).not.toMatch(/process\.env/u);
  });

  it("builds a deterministic acquire-bind payload with fixed identity", () => {
    const first = authority.buildAcquireBindPayload(common);
    const second = authority.buildAcquireBindPayload({ ...common });
    expect(first).toEqual({
      controller_identity: "frontend-production-workflow",
      environment: "prod",
      operation_id: "frontend-prod-9001",
      repository: "frontend",
      selection_digest: null,
      service: "frontend",
      target_sha: TARGET_SHA,
      workflow_run_attempt: 2,
      workflow_run_id: "123456",
    });
    expect(authority.canonicalJson(first)).toBe(
      authority.canonicalJson(second)
    );
    expect(authority.canonicalJson(first)).toBe(
      '{"controller_identity":"frontend-production-workflow","environment":"prod","operation_id":"frontend-prod-9001","repository":"frontend","selection_digest":null,"service":"frontend","target_sha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","workflow_run_attempt":2,"workflow_run_id":"123456"}'
    );
  });

  it("builds reauthorize, complete, and both failure selection shapes", () => {
    const reauthorize = authority.buildReauthorizePayload({
      ...common,
      selection_digest: SELECTION_DIGEST,
    });
    const complete = authority.buildCompletePayload({
      ...common,
      evidence_digest: EVIDENCE_DIGEST,
      qualifier_workflow_run_attempt: 3,
      qualifier_workflow_run_id: "789012",
      selection_digest: SELECTION_DIGEST,
    });
    const beforeSelection = authority.buildFailPayload(
      failureInput(null, "ABORTED")
    );
    const afterSelection = authority.buildFailPayload(
      failureInput(SELECTION_DIGEST, "AWS_MUTATION_FAILED")
    );
    expect(reauthorize["selection_digest"]).toBe(SELECTION_DIGEST);
    expect(complete).toMatchObject({
      evidence_digest: EVIDENCE_DIGEST,
      qualifier_workflow_run_attempt: 3,
      qualifier_workflow_run_id: "789012",
    });
    expect(beforeSelection["selection_digest"]).toBeNull();
    expect(afterSelection["selection_digest"]).toBe(SELECTION_DIGEST);
  });

  it.each([
    ["parent run", { parent_run_id: "0" }],
    ["target case", { target_sha: "A".repeat(40) }],
    ["target length", { target_sha: "a".repeat(39) }],
    ["workflow id", { workflow_run_id: "01" }],
    ["workflow attempt", { workflow_run_attempt: 0 }],
    ["selection case", { selection_digest: "B".repeat(64) }],
    ["evidence length", { evidence_digest: "c".repeat(63) }],
  ])("rejects malformed %s", (_label, override) => {
    expect(() =>
      authority.buildCompletePayload({
        ...common,
        evidence_digest: EVIDENCE_DIGEST,
        qualifier_workflow_run_attempt: 3,
        qualifier_workflow_run_id: "789012",
        selection_digest: SELECTION_DIGEST,
        ...override,
      })
    ).toThrow();
  });

  it("rejects unknown request fields and wrong fixed identity", () => {
    expect(() =>
      authority.buildAcquireBindPayload({ ...common, extra: "tampered" })
    ).toThrow();
    expect(() =>
      authority.validateResponse(
        "acquire-bind",
        { ...authority.buildAcquireBindPayload(common), service: "backend" },
        {},
        expectedBinding(null)
      )
    ).toThrow();
  });

  it("accepts exact acquire-bind response identity and state", () => {
    const request = authority.buildAcquireBindPayload(common);
    expect(
      authority.validateResponse(
        "acquire-bind",
        request,
        bindResponse(request),
        expectedBinding(null)
      )
    ).toEqual(bindResponse(request));
  });

  it("accepts a bounded denied acquire response without treating it as authorization", () => {
    const request = authority.buildAcquireBindPayload(common);
    const denied = {
      controller_identity: "frontend-production-workflow",
      control_epoch: EPOCH,
      environment: "prod",
      hard_expires_at: null,
      lease_expires_at: null,
      lock_row_version: null,
      observed_epoch: EPOCH,
      operation_id: request["operation_id"],
      reason_code: "ACTIVE_WORKFLOW",
      repository: "frontend",
      reused: false,
      selection_digest: null,
      service: "frontend",
      status: "DENIED",
      target_sha: TARGET_SHA,
      workflow_run_attempt: null,
      workflow_run_id: null,
      authorized: false,
      bound: false,
    };
    expect(
      authority.validateResponse("acquire-bind", request, denied, {
        authorized: false,
        bound: false,
        control_epoch: EPOCH,
        lock_row_version: null,
        parent_run_id: common.parent_run_id,
        selection_digest: null,
        status: "DENIED",
        target_sha: TARGET_SHA,
        workflow_run_attempt: 2,
        workflow_run_id: common.workflow_run_id,
      })
    ).toEqual(denied);
  });

  it.each([
    ["operation", { operation_id: "frontend-prod-9002" }],
    ["target", { target_sha: "d".repeat(40) }],
    ["workflow", { workflow_run_id: "999999" }],
    ["attempt", { workflow_run_attempt: 3 }],
  ])(
    "rejects response tampering in the %s identity field",
    (_label, override) => {
      const request = authority.buildAcquireBindPayload(common);
      expect(() =>
        authority.validateResponse(
          "acquire-bind",
          request,
          { ...bindResponse(request), ...override },
          expectedBinding(null)
        )
      ).toThrow();
    }
  );

  it.each([
    ["status", { status: "FAILED" }],
    ["authorized", { authorized: false }],
    ["bound", { bound: false }],
    ["epoch", { control_epoch: { all: 8, mode: "OFF", production: 11 } }],
    ["lock", { lock_row_version: 20 }],
  ])("rejects response tampering in the %s state", (_label, override) => {
    const request = authority.buildAcquireBindPayload(common);
    expect(() =>
      authority.validateResponse(
        "acquire-bind",
        request,
        { ...bindResponse(request), ...override },
        expectedBinding(null)
      )
    ).toThrow();
  });

  it("rejects risky response fields, including lease tokens and identity on completion", () => {
    const request = authority.buildAcquireBindPayload(common);
    expect(() =>
      authority.validateResponse(
        "acquire-bind",
        request,
        { ...bindResponse(request), lease_token: "must-not-be-accepted" },
        expectedBinding(null)
      )
    ).toThrow();

    const completeRequest = authority.buildCompletePayload({
      ...common,
      evidence_digest: EVIDENCE_DIGEST,
      qualifier_workflow_run_attempt: 3,
      qualifier_workflow_run_id: "789012",
      selection_digest: SELECTION_DIGEST,
    });
    expect(() =>
      authority.validateResponse(
        "complete",
        completeRequest,
        {
          ...completionResponse(
            stringField(completeRequest, "operation_id"),
            "completed"
          ),
          target_sha: TARGET_SHA,
        },
        {
          completed: true,
          evidence_digest: EVIDENCE_DIGEST,
          lock_row_version: 20,
          parent_run_id: common.parent_run_id,
          qualifier_workflow_run_attempt: 3,
          qualifier_workflow_run_id: "789012",
          selection_digest: SELECTION_DIGEST,
          status: "COMPLETED",
          target_sha: TARGET_SHA,
          workflow_run_attempt: 2,
          workflow_run_id: common.workflow_run_id,
        }
      )
    ).toThrow();
  });

  it("rejects a null-selection failure response that claims a selection", () => {
    const request = authority.buildFailPayload(failureInput(null, "ABORTED"));
    expect(() =>
      authority.validateResponse(
        "fail",
        request,
        completionResponse(stringField(request, "operation_id"), "failed"),
        {
          failed: true,
          evidence_digest: EVIDENCE_DIGEST,
          lock_row_version: 20,
          parent_run_id: common.parent_run_id,
          qualifier_workflow_run_attempt: 3,
          qualifier_workflow_run_id: "789012",
          reason_code: "ABORTED",
          selection_digest: SELECTION_DIGEST,
          status: "FAILED",
          target_sha: TARGET_SHA,
          workflow_run_attempt: 2,
          workflow_run_id: common.workflow_run_id,
        }
      )
    ).toThrow();
  });

  it("requires the exact post-selection digest for a failure request", () => {
    const request = authority.buildFailPayload(
      failureInput(SELECTION_DIGEST, "AWS_MUTATION_FAILED")
    );
    expect(() =>
      authority.validateResponse(
        "fail",
        request,
        completionResponse(stringField(request, "operation_id"), "failed"),
        {
          failed: true,
          evidence_digest: EVIDENCE_DIGEST,
          lock_row_version: 20,
          parent_run_id: common.parent_run_id,
          qualifier_workflow_run_attempt: 3,
          qualifier_workflow_run_id: "789012",
          reason_code: "AWS_MUTATION_FAILED",
          selection_digest: "d".repeat(64),
          status: "FAILED",
          target_sha: TARGET_SHA,
          workflow_run_attempt: 2,
          workflow_run_id: common.workflow_run_id,
        }
      )
    ).toThrow();
  });

  it("validates exact reauthorization and complete responses", () => {
    const reauthorize = authority.buildReauthorizePayload({
      ...common,
      selection_digest: SELECTION_DIGEST,
    });
    expect(
      authority.validateResponse(
        "reauthorize",
        reauthorize,
        bindResponse(reauthorize),
        expectedBinding(SELECTION_DIGEST)
      )
    ).toBeDefined();

    const complete = authority.buildCompletePayload({
      ...common,
      evidence_digest: EVIDENCE_DIGEST,
      qualifier_workflow_run_attempt: 3,
      qualifier_workflow_run_id: "789012",
      selection_digest: SELECTION_DIGEST,
    });
    expect(
      authority.validateResponse(
        "complete",
        complete,
        completionResponse(stringField(complete, "operation_id"), "completed"),
        {
          completed: true,
          evidence_digest: EVIDENCE_DIGEST,
          lock_row_version: 20,
          parent_run_id: common.parent_run_id,
          qualifier_workflow_run_attempt: 3,
          qualifier_workflow_run_id: "789012",
          selection_digest: SELECTION_DIGEST,
          status: "COMPLETED",
          target_sha: TARGET_SHA,
          workflow_run_attempt: 2,
          workflow_run_id: common.workflow_run_id,
        }
      )
    ).toBeDefined();
  });

  it("requires complete and fail terminal booleans to match their command", () => {
    const complete = authority.buildCompletePayload({
      ...common,
      evidence_digest: EVIDENCE_DIGEST,
      qualifier_workflow_run_attempt: 3,
      qualifier_workflow_run_id: "789012",
      selection_digest: SELECTION_DIGEST,
    });
    expect(() =>
      authority.validateResponse(
        "complete",
        complete,
        completionResponse(stringField(complete, "operation_id"), "failed"),
        {
          completed: true,
          evidence_digest: EVIDENCE_DIGEST,
          lock_row_version: 20,
          parent_run_id: common.parent_run_id,
          qualifier_workflow_run_attempt: 3,
          qualifier_workflow_run_id: "789012",
          selection_digest: SELECTION_DIGEST,
          status: "COMPLETED",
          target_sha: TARGET_SHA,
          workflow_run_attempt: 2,
          workflow_run_id: common.workflow_run_id,
        }
      )
    ).toThrow();
  });

  it("rejects duplicate keys, malformed JSON, sensitive fields, and oversized input", () => {
    expect(() =>
      authority.parseStrictJson(
        '{"a":1,"a":2}',
        "RESPONSE",
        authority.MAX_RESPONSE_BYTES
      )
    ).toThrow();
    expect(() =>
      authority.parseStrictJson("{", "RESPONSE", authority.MAX_RESPONSE_BYTES)
    ).toThrow();
    expect(() =>
      authority.parseStrictJson(
        '{"token":"secret"}',
        "RESPONSE",
        authority.MAX_RESPONSE_BYTES
      )
    ).toThrow();
    expect(() =>
      authority.parseStrictJson(
        "x".repeat(authority.MAX_RESPONSE_BYTES + 1),
        "RESPONSE",
        authority.MAX_RESPONSE_BYTES
      )
    ).toThrow();
  });

  it("supports file/stdin response validation without printing the response", () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "authority-client-")
    );
    const request = authority.buildAcquireBindPayload(common);
    const response = bindResponse(request);
    const requestFile = path.join(tempRoot, "request.json");
    fs.writeFileSync(requestFile, authority.canonicalJson(request));
    const script = path.join(
      process.cwd(),
      "ops/scripts/one-click-production-authority.cjs"
    );
    const result = spawnSync(
      process.execPath,
      [
        script,
        "validate-response",
        "acquire-bind",
        "--request-file",
        requestFile,
        "--parent-run-id",
        common.parent_run_id,
        "--target-sha",
        TARGET_SHA,
        "--workflow-run-id",
        common.workflow_run_id,
        "--workflow-run-attempt",
        "2",
        "--expected-selection-digest",
        "null",
        "--expected-status",
        "BOUND",
        "--expected-authorized",
        "true",
        "--expected-bound",
        "true",
        "--expected-control-epoch-json",
        JSON.stringify(EPOCH),
        "--expected-lock-row-version",
        "19",
      ],
      { input: `${authority.canonicalJson(response)}\n`, encoding: "utf8" }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("VALID\n");
    expect(result.stdout).not.toContain(TARGET_SHA);
  });
});
