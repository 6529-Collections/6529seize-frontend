// Keep this build-time host mapping aligned with the deployed environments.
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

function isHelpRecordPublished(record, publicationEnvironment) {
  return (
    record.environments === undefined ||
    record.environments.includes(publicationEnvironment)
  );
}

function getPublishedHelpRecords({ records, publicationEnvironment }) {
  return records
    .filter((record) => isHelpRecordPublished(record, publicationEnvironment))
    .map(({ environments: _environments, ...record }) => record);
}

module.exports = {
  getPublicationEnvironment,
  getPublishedHelpRecords,
  isHelpRecordPublished,
};
