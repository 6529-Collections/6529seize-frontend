const SHA_PATTERN = /^[a-f0-9]{40}$/;
const TRAILER = "Deploy-Hub-Composition:";
const MAX_ACTIVE_REQUESTS = 100;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeComposition(value) {
  assert(value?.version === 1, "Staging composition version is unsupported.");
  assert(
    SHA_PATTERN.test(value.base_sha ?? ""),
    "Staging composition base SHA is invalid."
  );
  assert(Array.isArray(value.prs), "Staging composition PRs are invalid.");
  assert(
    value.prs.length <= MAX_ACTIVE_REQUESTS,
    "Staging composition contains too many PRs."
  );
  const seen = new Set();
  const requests = value.prs.map((request) => {
    assert(
      Number.isInteger(request?.pr) && request.pr > 0,
      "Staging composition PR number is invalid."
    );
    assert(!seen.has(request.pr), "Staging composition repeats a PR.");
    seen.add(request.pr);
    assert(
      SHA_PATTERN.test(request.sha ?? ""),
      "Staging composition PR SHA is invalid."
    );
    return Object.freeze({ pr: request.pr, sha: request.sha });
  });
  return Object.freeze({
    baseSha: value.base_sha,
    requests: Object.freeze(requests),
  });
}

function parseComposition(message) {
  const line = String(message)
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(TRAILER));
  if (!line) return null;
  const encoded = line.slice(TRAILER.length).trim();
  assert(/^[A-Za-z0-9_-]+$/.test(encoded), "Staging composition is invalid.");
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new Error("Staging composition is invalid.");
  }
  return normalizeComposition(parsed);
}

function encodeComposition(composition) {
  const normalized = normalizeComposition({
    version: 1,
    base_sha: composition.baseSha,
    prs: composition.requests,
  });
  return Buffer.from(
    JSON.stringify({
      version: 1,
      base_sha: normalized.baseSha,
      prs: normalized.requests,
    })
  ).toString("base64url");
}

function commitMessage(subject, composition) {
  assert(
    typeof subject === "string" && subject.length > 0 && !subject.includes("\n"),
    "Staging commit subject is invalid."
  );
  return `${subject}\n\n${TRAILER} ${encodeComposition(composition)}`;
}

function addRequests(composition, requests) {
  const replacements = new Set(requests.map(({ pr }) => pr));
  return normalizeComposition({
    version: 1,
    base_sha: composition.baseSha,
    prs: [
      ...composition.requests.filter(({ pr }) => !replacements.has(pr)),
      ...requests.map(({ pr, sha }) => ({ pr, sha })),
    ],
  });
}

function removeRequest(composition, pr) {
  return normalizeComposition({
    version: 1,
    base_sha: composition.baseSha,
    prs: composition.requests.filter((request) => request.pr !== pr),
  });
}

module.exports = {
  addRequests,
  commitMessage,
  parseComposition,
  removeRequest,
};
