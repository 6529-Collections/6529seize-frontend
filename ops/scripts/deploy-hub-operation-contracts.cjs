const {
  EXPECTED_REPOSITORY,
} = require("./deploy-hub-shadow.cjs");

const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const RUN_URL_PATTERN =
  /^https:\/\/github\.com\/6529-Collections\/6529seize-frontend\/actions\/runs\/[1-9]\d*$/;
const WRITE_PERMISSIONS = new Set(["admin", "maintain", "write"]);
const PRODUCTION_PERMISSIONS = new Set(["admin", "maintain"]);

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
  const permission = result.permission ?? result.user?.permissions;
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

async function assertExactPulls(github, requests, baseRef) {
  for (const request of requests) {
    const pull = await github.getPullRequest(request.pr);
    assert(pull.state === "open", `PR #${request.pr} is not open.`);
    assert(
      pull.base?.ref === baseRef,
      `PR #${request.pr} does not target ${baseRef}.`
    );
    assert(pull.head?.sha === request.sha, `PR #${request.pr} head moved.`);
    assert(pull.mergeable !== false, `PR #${request.pr} is not mergeable.`);
  }
}

module.exports = {
  assert,
  assertAuthority,
  assertExactPulls,
  validateRuntime,
};
