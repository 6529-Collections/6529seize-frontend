#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const INPUT_CONTRACT = "runner-benchmark-inputs-v1";
const EVIDENCE_CONTRACT = "runner-benchmark-evidence-v1";
const CONTROLLER_EVIDENCE_CONTRACT = "runner-benchmark-controller-evidence-v1";
const DEFAULT_TIMEOUT_SECONDS = 90;
const MIN_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 900;
const MAX_REPEAT_COUNT = 5;
const SOURCE_SHA_PATTERN = /^[a-f0-9]{40}$/u;
const RUNNER_LABEL_PATTERN = /^[A-Za-z0-9._-]{1,100}$/u;
const PROFILES = Object.freeze(["control", "candidate"]);
const STATUSES = Object.freeze([
  "success",
  "failure",
  "unavailable",
  "cancelled",
]);
const TIMING_KEYS = Object.freeze([
  "queue_ms",
  "setup_ms",
  "checkout_ms",
  "install_ms",
  "build_ms",
  "package_ms",
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireExactSha(value, label) {
  const normalized = requireString(value, label);
  if (!SOURCE_SHA_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a lowercase 40-hex commit SHA`);
  }
  return normalized;
}

function requireInteger(value, label, minimum, maximum) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${label} must be an integer from ${minimum} to ${maximum}`
    );
  }
  return parsed;
}

function normalizeInputs(input) {
  const sourceSha = requireExactSha(input.sourceSha, "sourceSha");
  const candidateLabel = requireString(input.candidateLabel, "candidateLabel");
  if (!RUNNER_LABEL_PATTERN.test(candidateLabel)) {
    throw new Error(
      "candidateLabel must contain only letters, numbers, periods, underscores, or hyphens"
    );
  }

  const profile = requireString(input.profile, "profile");
  if (!PROFILES.includes(profile)) {
    throw new Error(`profile must be one of: ${PROFILES.join(", ")}`);
  }
  if (profile === "control" && candidateLabel !== "ubuntu-latest") {
    throw new Error("control profile must use ubuntu-latest");
  }
  if (profile === "candidate" && candidateLabel === "ubuntu-latest") {
    throw new Error(
      "candidate profile must use an explicit candidate label; use control for ubuntu-latest"
    );
  }

  const timeoutSeconds = requireInteger(
    input.timeoutSeconds,
    "timeoutSeconds",
    MIN_TIMEOUT_SECONDS,
    MAX_TIMEOUT_SECONDS
  );
  const repeatCount = requireInteger(
    input.repeatCount,
    "repeatCount",
    1,
    MAX_REPEAT_COUNT
  );

  return Object.freeze({
    contract: INPUT_CONTRACT,
    source_sha: sourceSha,
    candidate_label: candidateLabel,
    timeout_seconds: timeoutSeconds,
    profile,
    repeat_count: repeatCount,
  });
}

function validateTrustedSource({
  sourceSha,
  checkedOutSha,
  mainSha,
  isAncestor,
}) {
  const expected = requireExactSha(sourceSha, "sourceSha");
  const checkedOut = requireExactSha(checkedOutSha, "checkedOutSha");
  const trustedMainSha = requireExactSha(mainSha, "mainSha");
  if (expected !== checkedOut) {
    throw new Error(
      "checked-out source does not match the requested source SHA"
    );
  }
  if (expected !== trustedMainSha && isAncestor !== true) {
    throw new Error("source SHA is not an ancestor of the trusted main ref");
  }
  return Object.freeze({
    source_sha: expected,
    checked_out_sha: checkedOut,
    main_sha: trustedMainSha,
  });
}

function normalizeTiming(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return requireInteger(value, label, 0, 24 * 60 * 60 * 1000);
}

function normalizeEnvironment(environment) {
  if (
    !environment ||
    typeof environment !== "object" ||
    Array.isArray(environment)
  ) {
    throw new Error("environment must be an object");
  }
  const allowed = [
    "runner_os",
    "runner_arch",
    "runner_environment",
    "node_version",
    "pnpm_version",
    "cpu_count",
    "kernel_release",
  ];
  const normalized = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(environment, key)) {
      const value = environment[key];
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        throw new Error(`environment.${key} has an unsupported value`);
      }
      normalized[key] = value;
    }
  }
  return normalized;
}

function assertNoSecretShape(value, location = "evidence") {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      assertNoSecretShape(child, `${location}[${index}]`)
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (
      /(?:secret|password|credential|private[_-]?key|access[_-]?token|token)/iu.test(
        key
      )
    ) {
      throw new Error(
        `secret-shaped evidence field is forbidden: ${location}.${key}`
      );
    }
    assertNoSecretShape(child, `${location}.${key}`);
  }
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right)))
      .map(([key, child]) => [key, sortValue(child)])
  );
}

function normalizeCommonEvidence(raw) {
  const inputs = normalizeInputs({
    sourceSha: raw.source_sha,
    candidateLabel: raw.candidate_label,
    timeoutSeconds: raw.timeout_seconds,
    profile: raw.profile,
    repeatCount: raw.repeat_count ?? 1,
  });
  if (!STATUSES.includes(raw.status)) {
    throw new Error(`status must be one of: ${STATUSES.join(", ")}`);
  }
  const timings = {};
  for (const key of TIMING_KEYS) {
    timings[key] = normalizeTiming(raw.timings_ms?.[key], `timings_ms.${key}`);
  }
  const repeat = requireInteger(raw.repeat, "repeat", 1, inputs.repeat_count);
  const observedAt = requireString(raw.observed_at, "observed_at");
  if (Number.isNaN(Date.parse(observedAt))) {
    throw new Error("observed_at must be an ISO timestamp");
  }
  return {
    contract: EVIDENCE_CONTRACT,
    status: raw.status,
    source_sha: inputs.source_sha,
    candidate_label: inputs.candidate_label,
    profile: inputs.profile,
    timeout_seconds: inputs.timeout_seconds,
    repeat_count: inputs.repeat_count,
    repeat,
    repository: requireString(raw.repository, "repository"),
    workflow_sha: requireExactSha(raw.workflow_sha, "workflow_sha"),
    run_id: requireString(String(raw.run_id), "run_id"),
    request_id: requireString(raw.request_id, "request_id"),
    observed_at: observedAt,
    timings_ms: timings,
    environment: normalizeEnvironment(raw.environment),
    failure_class: raw.failure_class ? String(raw.failure_class) : null,
    failure_reason: raw.failure_reason ? String(raw.failure_reason) : null,
  };
}

function normalizeControllerEvidence(raw) {
  const inputs = normalizeInputs({
    sourceSha: raw.source_sha,
    candidateLabel: raw.candidate_label,
    timeoutSeconds: raw.timeout_seconds,
    profile: raw.profile,
    repeatCount: raw.repeat_count,
  });
  const results = Array.isArray(raw.results) ? raw.results : [];
  if (results.length !== inputs.repeat_count) {
    throw new Error("controller results must contain one entry per repeat");
  }
  const normalizedResults = results.map((result, index) => {
    const status = requireString(result.status, `results[${index}].status`);
    if (!STATUSES.includes(status)) {
      throw new Error(`results[${index}].status is not a valid status`);
    }
    return {
      repeat: requireInteger(
        result.repeat,
        `results[${index}].repeat`,
        1,
        inputs.repeat_count
      ),
      request_id: requireString(
        result.request_id,
        `results[${index}].request_id`
      ),
      run_id: result.run_id ? String(result.run_id) : null,
      status,
      failure_class: result.failure_class ? String(result.failure_class) : null,
      dispatch_ms: normalizeTiming(
        result.dispatch_ms,
        `results[${index}].dispatch_ms`
      ),
      observed_ms: normalizeTiming(
        result.observed_ms,
        `results[${index}].observed_ms`
      ),
      cancellation_requested: result.cancellation_requested === true,
    };
  });
  return {
    contract: CONTROLLER_EVIDENCE_CONTRACT,
    source_sha: inputs.source_sha,
    candidate_label: inputs.candidate_label,
    profile: inputs.profile,
    timeout_seconds: inputs.timeout_seconds,
    repeat_count: inputs.repeat_count,
    repository: requireString(raw.repository, "repository"),
    controller_run_id: requireString(
      String(raw.controller_run_id),
      "controller_run_id"
    ),
    workflow_sha: requireExactSha(raw.workflow_sha, "workflow_sha"),
    observed_at: requireString(raw.observed_at, "observed_at"),
    controller_elapsed_ms: normalizeTiming(
      raw.controller_elapsed_ms,
      "controller_elapsed_ms"
    ),
    results: normalizedResults,
    cost_usd: null,
    cost_evidence: "not supplied by GitHub-hosted benchmark",
  };
}

function writeHashedDocument(outputDir, basename, value) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies an isolated temporary evidence directory.
  fs.mkdirSync(outputDir, { recursive: true });
  const sorted = sortValue(value);
  const unsigned = `${JSON.stringify(sorted)}\n`;
  const digest = sha256(unsigned);
  const document = sortValue({ ...sorted, evidence_sha256: digest });
  const json = `${JSON.stringify(document, null, 2)}\n`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Basename is a fixed internal evidence filename.
  fs.writeFileSync(path.join(outputDir, `${basename}.json`), json, {
    encoding: "utf8",
    flag: "wx",
  });
  return { document, digest };
}

function markdownFor(document) {
  const isController = document.contract === CONTROLLER_EVIDENCE_CONTRACT;
  const lines = [
    isController
      ? "# Runner benchmark controller evidence"
      : "# Runner benchmark evidence",
    "",
    `- Status: **${document.status ?? "dispatch recorded"}**`,
    "- Source SHA: " + "`" + document.source_sha + "`",
    "- Profile: " + "`" + document.profile + "`",
    "- Candidate label: " + "`" + document.candidate_label + "`",
    `- Repeats: ${document.repeat_count}`,
    "- Evidence SHA-256: " + "`" + document.evidence_sha256 + "`",
    "",
  ];
  if (isController) {
    lines.push(
      "| Repeat | Status | Candidate run | Dispatch (ms) | Observed (ms) | Cancellation requested |",
      "| ---: | --- | ---: | ---: | ---: | --- |",
      ...document.results.map(
        (result) =>
          `| ${result.repeat} | ${result.status} | ${result.run_id ?? "not created"} | ${result.dispatch_ms ?? "—"} | ${result.observed_ms ?? "—"} | ${result.cancellation_requested ? "yes" : "no"} |`
      ),
      "",
      "Cost evidence: not supplied by this workflow; activation requires an external measured cost record."
    );
  } else {
    lines.push(
      "| Stage | Duration (ms) |",
      "| --- | ---: |",
      ...TIMING_KEYS.map(
        (key) =>
          `| ${key.replaceAll("_", " ")} | ${document.timings_ms[key] ?? "—"} |`
      ),
      "",
      "Environment metadata is limited to non-secret runner and toolchain facts."
    );
  }
  return `${lines.join("\n")}\n`;
}

function writeEvidence(inputPath, outputDir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies a temporary JSON input path.
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  assertNoSecretShape(raw);
  const evidence = normalizeCommonEvidence(raw);
  const { document, digest } = writeHashedDocument(
    outputDir,
    "runner-benchmark-evidence",
    evidence
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Output is the isolated temporary evidence directory.
  fs.writeFileSync(
    path.join(outputDir, "runner-benchmark-evidence.md"),
    markdownFor(document),
    { encoding: "utf8", flag: "wx" }
  );
  return { digest, document };
}

function writeControllerEvidence(inputPath, outputDir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies a temporary JSON input path.
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  assertNoSecretShape(raw);
  const evidence = normalizeControllerEvidence(raw);
  const { document, digest } = writeHashedDocument(
    outputDir,
    "runner-benchmark-controller-evidence",
    evidence
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Output is the isolated temporary evidence directory.
  fs.writeFileSync(
    path.join(outputDir, "runner-benchmark-controller-evidence.md"),
    markdownFor(document),
    { encoding: "utf8", flag: "wx" }
  );
  return { digest, document };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      throw new Error(`unexpected argument: ${argument}`);
    }
    const key = argument.slice(2).replaceAll("-", "_");
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value`);
    }
    result[key] = value;
    index += 1;
  }
  return result;
}

function readWorkflow(root, file) {
  const YAML = require("yaml");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Contract validation reads fixed workflow names under the repository root.
  const source = fs.readFileSync(
    path.join(root, ".github", "workflows", file),
    "utf8"
  );
  return { source, workflow: YAML.parse(source) };
}

function validateContract(root = path.resolve(__dirname, "../..")) {
  const controller = readWorkflow(root, "runner-benchmark.yml");
  const candidate = readWorkflow(root, "runner-benchmark-candidate.yml");
  if (!controller.workflow.on?.workflow_dispatch) {
    throw new Error("controller must be workflow_dispatch-only");
  }
  if (
    controller.workflow.on.workflow_run ||
    controller.workflow.on.pull_request
  ) {
    throw new Error("controller has an unsafe event trigger");
  }
  if (controller.workflow.permissions?.actions !== "write") {
    throw new Error(
      "controller must retain actions: write for own-run dispatch/cancel"
    );
  }
  if (
    !candidate.workflow.on?.workflow_dispatch ||
    !candidate.workflow.on?.workflow_call
  ) {
    throw new Error("candidate must support dispatch and reusable invocation");
  }
  if (
    candidate.workflow.permissions?.contents !== "read" ||
    candidate.workflow.permissions?.actions !== "read"
  ) {
    throw new Error("candidate permissions must be read-only");
  }
  for (const source of [controller.source, candidate.source]) {
    if (
      source.includes("secrets.") ||
      source.includes("id-token:") ||
      source.includes("contents: write")
    ) {
      throw new Error(
        "runner benchmark workflows must not access deployment credentials"
      );
    }
  }
  return {
    contract: "runner-benchmark-workflow-contract-v1",
    controller: "runner-benchmark.yml",
    candidate: "runner-benchmark-candidate.yml",
  };
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "validate") {
    const args = parseArgs(rest);
    process.stdout.write(
      `${JSON.stringify(
        normalizeInputs({
          sourceSha: args.source_sha,
          candidateLabel: args.candidate_label,
          timeoutSeconds: args.timeout_seconds,
          profile: args.profile,
          repeatCount: args.repeat_count,
        })
      )}\n`
    );
    return;
  }
  if (command === "verify-source") {
    const args = parseArgs(rest);
    process.stdout.write(
      `${JSON.stringify(
        validateTrustedSource({
          sourceSha: args.source_sha,
          checkedOutSha: args.checked_out_sha,
          mainSha: args.main_sha,
          isAncestor: args.is_ancestor === "true",
        })
      )}\n`
    );
    return;
  }
  if (command === "write-evidence" || command === "write-controller-evidence") {
    const args = parseArgs(rest);
    const inputPath = requireString(args.input, "input");
    const outputDir = requireString(args.output_dir, "output-dir");
    const result =
      command === "write-evidence"
        ? writeEvidence(inputPath, outputDir)
        : writeControllerEvidence(inputPath, outputDir);
    process.stdout.write(
      `${JSON.stringify({ evidence_sha256: result.digest })}\n`
    );
    return;
  }
  if (command === "validate-contract") {
    process.stdout.write(`${JSON.stringify(validateContract())}\n`);
    return;
  }
  throw new Error(
    "usage: runner-benchmark.cjs <validate|verify-source|write-evidence|write-controller-evidence|validate-contract> ..."
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  CONTROLLER_EVIDENCE_CONTRACT,
  DEFAULT_TIMEOUT_SECONDS,
  EVIDENCE_CONTRACT,
  INPUT_CONTRACT,
  MAX_REPEAT_COUNT,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  PROFILES,
  RUNNER_LABEL_PATTERN,
  SOURCE_SHA_PATTERN,
  TIMING_KEYS,
  normalizeInputs,
  normalizeCommonEvidence,
  normalizeControllerEvidence,
  validateContract,
  validateTrustedSource,
  writeControllerEvidence,
  writeEvidence,
};
