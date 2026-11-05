#!/usr/bin/env node
// Prints the path of the sentry-cli binary that @sentry/nextjs installed
// (@sentry/nextjs -> @sentry/bundler-plugin-core -> @sentry/cli), so the
// production deploy can record the Sentry release with the exact binary the
// frozen install verified, instead of downloading one at deploy time.
// usage: node ops/scripts/resolve-sentry-cli.cjs
const { createRequire } = require("node:module");
const path = require("node:path");

function resolveSentryCliPath(fromDirectory = process.cwd()) {
  const nextjsDirectory = path.dirname(
    require.resolve("@sentry/nextjs/package.json", { paths: [fromDirectory] })
  );
  const bundlerCoreEntry = require.resolve("@sentry/bundler-plugin-core", {
    paths: [nextjsDirectory],
  });
  // Load @sentry/cli as @sentry/bundler-plugin-core sees it.
  const sentryCli = createRequire(bundlerCoreEntry)("@sentry/cli");
  return sentryCli.getPath();
}

if (require.main === module) {
  process.stdout.write(resolveSentryCliPath());
}

module.exports = { resolveSentryCliPath };
