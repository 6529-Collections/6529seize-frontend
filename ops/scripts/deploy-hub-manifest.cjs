const EXPECTED_REPOSITORY = "6529-Collections/6529seize-frontend";
const MAX_REQUESTS = 20;
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const REQUESTER_PATTERN = /^[A-Za-z0-9-]{1,39}$/;
const TARGETS = new Set(["staging", "production"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeManifestRequests(manifestJson, actor, repository) {
  assert(repository === EXPECTED_REPOSITORY, "Repository is not supported.");
  if (actor !== null) {
    assert(
      REQUESTER_PATTERN.test(actor) &&
        !actor.startsWith("-") &&
        !actor.endsWith("-"),
      "Dispatching GitHub actor has an invalid format."
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new Error("Manifest must be valid JSON.");
  }

  assert(Array.isArray(parsed), "Manifest must be a JSON array.");
  assert(parsed.length > 0, "Manifest must contain at least one request.");
  assert(
    parsed.length <= MAX_REQUESTS,
    `Manifest cannot contain more than ${MAX_REQUESTS} requests.`
  );

  const seenPrs = new Set();
  return parsed.map((request, index) => {
    const label = `Manifest request ${index + 1}`;
    assert(
      request && typeof request === "object" && !Array.isArray(request),
      `${label} must be an object.`
    );
    assert(
      request.repository === repository,
      `${label} has an invalid repository.`
    );
    assert(
      Number.isInteger(request.pr) && request.pr > 0,
      `${label} has an invalid PR number.`
    );
    assert(!seenPrs.has(request.pr), `${label} repeats PR ${request.pr}.`);
    seenPrs.add(request.pr);
    assert(
      typeof request.sha === "string" && SHA_PATTERN.test(request.sha),
      `${label} has an invalid exact SHA.`
    );
    assert(TARGETS.has(request.target), `${label} has an invalid target.`);
    assert(
      typeof request.requester === "string" &&
        REQUESTER_PATTERN.test(request.requester) &&
        !request.requester.startsWith("-") &&
        !request.requester.endsWith("-"),
      `${label} has an invalid requester.`
    );
    assert(
      actor === null || request.requester.toLowerCase() === actor.toLowerCase(),
      `${label} requester must match the dispatching GitHub actor.`
    );
    assert(
      typeof request.requested_at === "string" &&
        Number.isFinite(Date.parse(request.requested_at)) &&
        new Date(request.requested_at).toISOString() === request.requested_at,
      `${label} has an invalid request time.`
    );

    return Object.freeze({
      repository: request.repository,
      pr: request.pr,
      sha: request.sha,
      target: request.target,
      requester: request.requester,
      requested_at: request.requested_at,
    });
  });
}

function normalizeManifest(manifestJson, actor, repository) {
  return normalizeManifestRequests(manifestJson, actor, repository);
}

function normalizeTrustedManifest(manifestJson, repository) {
  return normalizeManifestRequests(manifestJson, null, repository);
}

function partitionCohorts(requests) {
  return requests.reduce((cohorts, request) => {
    const current = cohorts.at(-1);
    if (!current || current.target !== request.target) {
      cohorts.push({ target: request.target, requests: [request] });
    } else {
      current.requests.push(request);
    }
    return cohorts;
  }, []);
}

module.exports = {
  EXPECTED_REPOSITORY,
  normalizeManifest,
  normalizeTrustedManifest,
  partitionCohorts,
};
