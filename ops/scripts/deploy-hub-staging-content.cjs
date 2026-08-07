const {
  commitMessage,
  parseComposition,
} = require("./deploy-hub-staging-composition.cjs");
const { assert } = require("./deploy-hub-operation-contracts.cjs");
const {
  stagingPresenceContext,
} = require("./deploy-hub-operation-workflows.cjs");

const STAGING_REF = "1a-staging";

function publishContent({ git, expectedOldSha, contentSha, message }) {
  const nextSha = git.forwardContent(expectedOldSha, contentSha, message);
  git.pushStaging(expectedOldSha, nextSha);
  return nextSha;
}

function compositionOnLatestBase(git, stagingSha, baseRef) {
  const latestBaseSha = git.remoteSha(baseRef);
  git.fetchExact([stagingSha, latestBaseSha]);
  const composition = parseComposition(git.readCommitMessage(stagingSha));
  if (!composition) {
    assert(
      git.sameTree(stagingSha, latestBaseSha),
      `Current staging is not a Deploy Hub baseline. Align ${STAGING_REF} content with ${baseRef} before the first live operation.`
    );
  }
  return {
    baseSha: latestBaseSha,
    requests: composition?.requests ?? [],
  };
}

function composeContent(git, composition, operationId, phase) {
  git.fetchExact([
    composition.baseSha,
    ...composition.requests.map(({ sha }) => sha),
  ]);
  return git.mergeContent(
    composition.baseSha,
    composition.requests,
    `Deploy Hub ${operationId} ${phase}`
  );
}

function stagingMessage(subject, composition) {
  return commitMessage(subject, composition);
}

async function publishStagingPresence(
  github,
  request,
  runUrl,
  state,
  description
) {
  await github.createCommitStatus(request.sha, {
    state,
    target_url: runUrl,
    description: description.slice(0, 140),
    context: stagingPresenceContext(),
  });
}

module.exports = {
  composeContent,
  compositionOnLatestBase,
  publishContent,
  publishStagingPresence,
  STAGING_REF,
  stagingMessage,
};
