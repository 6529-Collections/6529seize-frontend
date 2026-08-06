const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");
const {
  DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  PINNED_PNPM_VERSION,
} = require("./runner-benchmark-inputs.cjs");

function readWorkflow(root, file) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Contract validation reads fixed workflow names under the repository root.
  const source = fs.readFileSync(
    path.join(root, ".github", "workflows", file),
    "utf8"
  );
  return { source, workflow: YAML.parse(source) };
}

function assertOnlyEvents(workflow, allowedEvents, label) {
  const events = Object.keys(workflow.on ?? {});
  if (events.some((eventName) => !allowedEvents.includes(eventName))) {
    throw new Error(`${label} has an unsafe event trigger`);
  }
}

function assertRequiredInputs(inputs, names, label) {
  for (const inputName of names) {
    if (!inputs?.[inputName]?.required) {
      throw new Error(`${label} input ${inputName} must be required`);
    }
  }
}

function assertControllerContract(controller) {
  if (!controller.workflow.on?.workflow_dispatch) {
    throw new Error("controller must be workflow_dispatch-only");
  }
  assertOnlyEvents(controller.workflow, ["workflow_dispatch"], "controller");
  if (controller.workflow.permissions?.actions !== "write") {
    throw new Error(
      "controller must retain actions: write for own-run dispatch/cancel"
    );
  }
  const inputs = controller.workflow.on.workflow_dispatch.inputs;
  assertRequiredInputs(
    inputs,
    [
      "source_sha",
      "candidate_label",
      "timeout_seconds",
      "completion_timeout_seconds",
      "profile",
      "repeat_count",
    ],
    "controller"
  );
  if (
    inputs.completion_timeout_seconds.default !==
    DEFAULT_COMPLETION_TIMEOUT_SECONDS
  ) {
    throw new Error("controller completion timeout default is not pinned");
  }
  if (controller.workflow.jobs?.dispatch?.env?.GH_TOKEN !== undefined) {
    throw new Error("controller GH_TOKEN must not be job-scoped");
  }
  if (
    controller.workflow.jobs?.dispatch?.["timeout-minutes"] !==
    "${{ fromJSON(needs.validate.outputs.controller_timeout_minutes) }}"
  ) {
    throw new Error(
      "controller timeout must be derived from the validated budget"
    );
  }
  if (!controller.source.includes('test "$GITHUB_RUN_ATTEMPT" = "1"')) {
    throw new Error("controller reruns must be rejected before dispatch");
  }
  if (
    !controller.source.includes("request-id") ||
    !controller.source.includes("controller_run_attempt")
  ) {
    throw new Error("controller correlation must bind the first attempt");
  }
}

function assertCandidateContract(candidate) {
  if (
    !candidate.workflow.on?.workflow_dispatch ||
    !candidate.workflow.on?.workflow_call
  ) {
    throw new Error("candidate must support dispatch and reusable invocation");
  }
  assertOnlyEvents(
    candidate.workflow,
    ["workflow_dispatch", "workflow_call"],
    "candidate"
  );
  if (
    candidate.workflow.permissions?.contents !== "read" ||
    candidate.workflow.permissions?.actions !== "read"
  ) {
    throw new Error("candidate permissions must be read-only");
  }
  const names = [
    "source_sha",
    "candidate_label",
    "timeout_seconds",
    "completion_timeout_seconds",
    "profile",
    "repeat_number",
    "repeat_count",
    "request_id",
    "controller_nonce",
    "controller_run_id",
    "controller_run_attempt",
  ];
  assertRequiredInputs(
    candidate.workflow.on.workflow_dispatch.inputs,
    names,
    "candidate dispatch"
  );
  assertRequiredInputs(
    candidate.workflow.on.workflow_call.inputs,
    names,
    "candidate call"
  );
  const authorize = candidate.workflow.jobs?.authorize;
  const benchmark = candidate.workflow.jobs?.benchmark;
  const verify = candidate.workflow.jobs?.verify;
  if (!authorize || !benchmark || !verify) {
    throw new Error(
      "candidate must separate authorization, measured source, and verifier jobs"
    );
  }
  if (
    benchmark.permissions?.contents !== "read" ||
    benchmark.permissions?.actions !== "none"
  ) {
    throw new Error("measured source job must not have Actions API authority");
  }
  if (
    verify["runs-on"] !== "ubuntu-latest" ||
    verify.permissions?.contents !== "read" ||
    verify.permissions?.actions !== "read"
  ) {
    throw new Error("verifier must run on the trusted Ubuntu runner read-only");
  }
  if (
    !String(benchmark["runs-on"]).includes(
      "needs.authorize.outputs.runner_label"
    ) ||
    String(benchmark["runs-on"]).includes("inputs.candidate_label")
  ) {
    throw new Error(
      "candidate label must be selected only from the authenticated authorization gate"
    );
  }
  if (benchmark.env?.GH_TOKEN !== undefined) {
    throw new Error("candidate GH_TOKEN must not be job-scoped");
  }
  const source = candidate.source;
  const activation = source.indexOf(
    `corepack prepare pnpm@${PINNED_PNPM_VERSION} --activate`
  );
  const cache = source.indexOf("cache: pnpm");
  if (activation < 0 || cache < 0 || activation > cache) {
    throw new Error(
      "candidate must activate pinned pnpm before setup-node cache"
    );
  }
  if (
    !source.includes("validate-candidate") ||
    !source.includes("verify-run") ||
    !source.includes("verify-controller-run") ||
    !source.includes("verify-evidence") ||
    !source.includes("github-actions[bot]") ||
    !source.includes("controller_run_attempt") ||
    !source.includes("Write untrusted benchmark observation")
  ) {
    throw new Error("candidate must validate inputs and run metadata");
  }
  if (!source.includes("actions/download-artifact@")) {
    throw new Error(
      "candidate verifier must consume untrusted observation artifacts"
    );
  }
  if (
    !source.includes(
      'reason="direct human candidate dispatch is unsupported'
    ) ||
    !source.includes("source execution is blocked")
  ) {
    throw new Error(
      "direct candidate dispatches must fail before source execution"
    );
  }
}

function assertNoDeploymentAuthority(sources) {
  for (const source of sources) {
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
}

function validateContract(root = path.resolve(__dirname, "../..")) {
  const controller = readWorkflow(root, "runner-benchmark.yml");
  const candidate = readWorkflow(root, "runner-benchmark-candidate.yml");
  assertControllerContract(controller);
  assertCandidateContract(candidate);
  assertNoDeploymentAuthority([controller.source, candidate.source]);
  return {
    contract: "runner-benchmark-workflow-contract-v1",
    controller: "runner-benchmark.yml",
    candidate: "runner-benchmark-candidate.yml",
  };
}

module.exports = { validateContract };
