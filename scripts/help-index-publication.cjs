const {
  getPublishedReviewIds,
} = require("./package-public-review-artifacts.cjs");

// Keep this build-time allowlist aligned with config/publicReviews.ts.
function getPublicationEnvironment(baseEndpoint) {
  try {
    const hostname = new URL(baseEndpoint).hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "local";
    }
    if (hostname === "staging.6529.io") {
      return "staging";
    }
  } catch {
    // Missing or invalid build configuration must fail closed to production.
  }
  return "production";
}

function isHelpRecordPublished(
  record,
  publicationEnvironment,
  publishedReviewIds
) {
  return (
    (record.environments === undefined ||
      record.environments.includes(publicationEnvironment)) &&
    (record.public_review_id === undefined ||
      publishedReviewIds.has(record.public_review_id))
  );
}

function getPublishedHelpRecords({
  records,
  publicationEnvironment,
  repoRoot,
}) {
  const publishedReviewIds = getPublishedReviewIds(repoRoot);
  return records
    .filter((record) =>
      isHelpRecordPublished(
        record,
        publicationEnvironment,
        publishedReviewIds
      )
    )
    .map(
      ({
        environments: _environments,
        public_review_id: _publicReviewId,
        ...record
      }) => record
    );
}

module.exports = {
  getPublicationEnvironment,
  getPublishedHelpRecords,
  isHelpRecordPublished,
};
