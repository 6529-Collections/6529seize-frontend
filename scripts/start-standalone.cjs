#!/usr/bin/env node

const { cpSync, existsSync, mkdirSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const {
  readPrivateRuntimeFile,
} = require("./public-review-discussion-destinations.cjs");

const repoRoot = resolve(__dirname, "..");
const standaloneRoot = resolve(repoRoot, ".next", "standalone");
const serverEntry = resolve(repoRoot, ".next", "standalone", "server.js");
const staticSource = resolve(repoRoot, ".next", "static");
const staticDest = resolve(standaloneRoot, ".next", "static");
const publicSource = resolve(repoRoot, "public");
const publicDest = resolve(standaloneRoot, "public");
const publicReviewPackager = resolve(
  repoRoot,
  "scripts",
  "package-public-review-artifacts.cjs"
);
const standaloneArtifactProfile =
  process.env["STANDALONE_ARTIFACT_PROFILE"]?.trim();
const publicReviewDestinationsFile =
  process.env["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE"]?.trim();
const packagingEnv = { ...process.env };
delete packagingEnv["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS"];
delete packagingEnv["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE"];
delete packagingEnv["STANDALONE_ARTIFACT_PROFILE"];

if (!existsSync(serverEntry)) {
  console.error(
    "Missing .next/standalone/server.js. Run `6529 run build` before starting the standalone server."
  );
  process.exit(1);
}

if (!existsSync(staticSource)) {
  console.error(
    "Missing .next/static. Run `6529 run build` before starting the standalone server."
  );
  process.exit(1);
}

mkdirSync(resolve(standaloneRoot, ".next"), { recursive: true });
cpSync(staticSource, staticDest, { recursive: true, force: true });

if (standaloneArtifactProfile) {
  if (standaloneArtifactProfile !== "staging") {
    console.error(
      `Unsupported standalone artifact profile: ${standaloneArtifactProfile}`
    );
    process.exit(1);
  }

  const packageResult = spawnSync(
    process.execPath,
    [
      publicReviewPackager,
      "prepare",
      "--profile",
      standaloneArtifactProfile,
      "--bundle-root",
      standaloneRoot,
    ],
    {
      cwd: repoRoot,
      env: packagingEnv,
      stdio: "inherit",
    }
  );

  if (packageResult.error) {
    throw packageResult.error;
  }
  if (packageResult.status !== 0) {
    process.exit(packageResult.status ?? 1);
  }
} else if (existsSync(publicSource)) {
  cpSync(publicSource, publicDest, { recursive: true, force: true });
}

const runtimeEnv = { ...process.env };
if (publicReviewDestinationsFile) {
  let publicReviewDiscussionDestinations;
  try {
    publicReviewDiscussionDestinations = readPrivateRuntimeFile(
      publicReviewDestinationsFile
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  runtimeEnv["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS"] =
    publicReviewDiscussionDestinations;
}
delete runtimeEnv["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE"];
delete runtimeEnv["STANDALONE_ARTIFACT_PROFILE"];

const result = spawnSync(process.execPath, [serverEntry], {
  cwd: repoRoot,
  env: {
    ...runtimeEnv,
    PORT: runtimeEnv["PORT"] || "3001",
    HOSTNAME: runtimeEnv["HOSTNAME"] || "0.0.0.0",
  },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
