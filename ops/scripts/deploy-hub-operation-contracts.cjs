const { EXPECTED_REPOSITORY } = require("./deploy-hub-shadow.cjs");

const OPERATION_ID_SOURCE = "[A-Za-z0-9][A-Za-z0-9._-]{0,79}";
const OPERATION_ID_PATTERN = new RegExp(`^${OPERATION_ID_SOURCE}$`);
const RUN_URL_PATTERN =
  /^https:\/\/github\.com\/6529-Collections\/6529seize-frontend\/actions\/runs\/[1-9]\d*$/;
const WRITE_PERMISSIONS = new Set(["admin", "maintain", "write"]);
const PRODUCTION_PERMISSIONS = new Set(["admin", "maintain"]);
const SUCCESSFUL_CHECK_CONCLUSIONS = new Set(["neutral", "skipped", "success"]);
const REQUIRED_PRODUCTION_CHECKS = ["Installed app checks"];
const SHA_PATTERN = /^[a-f0-9]{40}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRuntime({ operationId, repository, runUrl, baseRef }) {
  assert(repository === EXPECTED_REPOSITORY, "Repository is not supported.");
  assert(
    OPERATION_ID_PATTERN.test(operationId),
    "Operation ID has an invalid format."
  );
  assert(RUN_URL_PATTERN.test(runUrl), "Run URL has an invalid format.");
  assert(
    typeof baseRef === "string" && /^[A-Za-z0-9._/-]{1,255}$/.test(baseRef),
    "Default branch has an invalid format."
  );
}

async function assertAuthority(github, actor, requests) {
  const result = await github.getCollaboratorPermission(actor);
  const permission = result.role_name ?? result.permission;
  assert(
    WRITE_PERMISSIONS.has(permission),
    "Requester does not have frontend write authority."
  );
  if (requests.some((request) => request.target === "production")) {
    assert(
      PRODUCTION_PERMISSIONS.has(permission),
      "Production requires maintain or admin authority."
    );
  }
}

async function assertRequestAuthorities(github, requests) {
  const requesters = new Map();
  for (const request of requests) {
    const owned = requesters.get(request.requester) ?? [];
    owned.push(request);
    requesters.set(request.requester, owned);
  }
  for (const [requester, owned] of requesters) {
    await assertAuthority(github, requester, owned);
  }
}

async function assertExactPulls(github, requests, baseRef) {
  const pulls = [];
  for (const request of requests) {
    const pull = await github.getPullRequest(request.pr);
    assert(pull.state === "open", `PR #${request.pr} is not open.`);
    assert(
      pull.base?.ref === baseRef,
      `PR #${request.pr} does not target ${baseRef}.`
    );
    assert(pull.head?.sha === request.sha, `PR #${request.pr} head moved.`);
    assert(pull.mergeable !== false, `PR #${request.pr} is not mergeable.`);
    pulls.push(pull);
  }
  return pulls;
}

function latestExternalStatuses(statuses) {
  const latest = new Map();
  for (const status of statuses) {
    const context = status.context ?? "";
    const current = latest.get(context);
    if (
      !context.startsWith("Deploy Hub") &&
      (!current ||
        Date.parse(status.created_at ?? "") >
          Date.parse(current.created_at ?? ""))
    ) {
      latest.set(context, status);
    }
  }
  return [...latest.values()];
}

async function assertSuccessfulChecks(github, request) {
  const [checks, combined] = await Promise.all([
    github.getCheckRuns(request.sha),
    github.getCombinedStatus(request.sha),
  ]);
  const checkRuns = checks.check_runs ?? [];
  const statuses = latestExternalStatuses(combined.statuses ?? []);
  assert(
    checkRuns.length + statuses.length > 0,
    `PR #${request.pr} has no current check evidence.`
  );
  for (const requiredName of REQUIRED_PRODUCTION_CHECKS) {
    assert(
      checkRuns.some(({ name }) => name === requiredName),
      `PR #${request.pr} is missing required check ${requiredName}.`
    );
  }
  for (const check of checkRuns) {
    assert(
      check.status === "completed" &&
        SUCCESSFUL_CHECK_CONCLUSIONS.has(check.conclusion),
      `PR #${request.pr} check ${check.name ?? "unknown"} is not successful.`
    );
  }
  for (const status of statuses) {
    assert(
      status.state === "success",
      `PR #${request.pr} status ${status.context ?? "unknown"} is not successful.`
    );
  }
}

async function assertProductionRequestPreflight(
  github,
  request,
  baseRef,
  expectedMainSha,
  {
    sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
  } = {}
) {
  const mainSha = (await github.getRef(baseRef)).object?.sha;
  assert(mainSha === expectedMainSha, "Main moved before production merge.");
  let pull;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    [pull] = await assertExactPulls(github, [request], baseRef);
    if (pull.mergeable !== null && pull.mergeable_state !== "unknown") break;
    if (attempt < 5) await sleep(1_000);
  }
  assert(pull.draft !== true, `PR #${request.pr} is still a draft.`);
  assert(
    pull.mergeable === true && pull.mergeable_state === "clean",
    `PR #${request.pr} is not currently ready to merge.`
  );
  await assertSuccessfulChecks(github, request);
  const observedMain = (await github.getRef(baseRef)).object?.sha;
  assert(observedMain === mainSha, "Main moved during production preflight.");
  return mainSha;
}

async function assertProductionPreflight(github, requests, baseRef) {
  const mainSha = (await github.getRef(baseRef)).object?.sha;
  assert(SHA_PATTERN.test(mainSha ?? ""), "Current main SHA is unavailable.");
  for (const request of requests) {
    await assertProductionRequestPreflight(github, request, baseRef, mainSha);
  }
  const observedMain = (await github.getRef(baseRef)).object?.sha;
  assert(observedMain === mainSha, "Main moved during production preflight.");
  return mainSha;
}

module.exports = {
  assert,
  assertAuthority,
  assertExactPulls,
  OPERATION_ID_PATTERN,
  OPERATION_ID_SOURCE,
  assertProductionPreflight,
  assertProductionRequestPreflight,
  assertRequestAuthorities,
  validateRuntime,
};
