#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const { parseArgs } = require("./cli-args.cjs");
const { writeEvidenceFile } = require("./verify-deployment-version.cjs");

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const MAX_PAGES = 3;
const PAGE_SIZE = 100;
const TRANSIENT_API_ERROR =
  /HTTP 5[0-9]{2}|dial tcp|TLS handshake timeout|i\/o timeout|connection reset|unexpected EOF|context deadline exceeded/;

function githubJson(endpoint, execute = execFileSync) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return JSON.parse(
        execute(
          "gh",
          ["api", "--method", "GET", "-H", "Cache-Control: no-cache", endpoint],
          {
            encoding: "utf8",
            timeout: 30000,
            stdio: ["ignore", "pipe", "pipe"],
          }
        )
      );
    } catch (error) {
      const diagnostic = String(error.stderr || error.message);
      if (attempt === 3 || !TRANSIENT_API_ERROR.test(diagnostic)) throw error;
      console.warn(
        `Retrying production deployment discovery after a transient GitHub error (${attempt}/3).`
      );
    }
  }
  throw new Error("Production deployment discovery exhausted its attempts.");
}

async function liveProductionVersion(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl("https://6529.io/api/version", {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  if (
    response.status !== 200 ||
    !response.headers.get("cache-control")?.toLowerCase().includes("no-store")
  ) {
    throw new Error("Production version is unavailable, stale, or invalid.");
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Production version is unavailable, stale, or invalid.");
  }
  if (
    !SHA_PATTERN.test(body?.version) ||
    body.stale === true ||
    (body.announced_version !== undefined &&
      body.announced_version !== body.version)
  ) {
    throw new Error("Production version is unavailable, stale, or invalid.");
  }
  return body.version;
}

function deployRunId(status, repository) {
  if (status?.state !== "success" || status.environment !== "production")
    return null;
  let url;
  try {
    url = new URL(status.log_url);
  } catch {
    return null;
  }
  const prefix = `/${repository}/actions/runs/`;
  if (
    url.origin !== "https://github.com" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith(prefix)
  )
    return null;
  const parts = url.pathname.slice(prefix.length).split("/");
  if (
    parts.length !== 3 ||
    parts[1] !== "job" ||
    !/^[1-9][0-9]{0,19}$/.test(parts[0]) ||
    !/^[1-9][0-9]{0,19}$/.test(parts[2])
  )
    return null;
  return parts[0];
}

function validRun(run, repository, sha) {
  return (
    run?.head_sha === sha &&
    run.path === ".github/workflows/build-upload-deploy-prod.yml" &&
    run.head_branch === "main" &&
    run.event === "workflow_dispatch" &&
    run.status === "completed" &&
    run.conclusion === "success" &&
    run.repository?.full_name === repository &&
    run.head_repository?.full_name === repository &&
    Number.isSafeInteger(run.id) &&
    run.id > 0
  );
}

function validDeployment(deployment, sha) {
  return (
    deployment?.sha === sha &&
    deployment.environment === "production" &&
    Number.isSafeInteger(deployment.id) &&
    deployment.id > 0
  );
}

async function findDeploymentRecord(repository, sha, getJson) {
  const root = `repos/${repository}`;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const deployments = await getJson(
      `${root}/deployments?sha=${sha}&environment=production&per_page=${PAGE_SIZE}&page=${page}`
    );
    if (!Array.isArray(deployments))
      throw new Error("Invalid production deployment history.");
    const matchingDeployments = deployments.filter((deployment) =>
      validDeployment(deployment, sha)
    );
    for (const deployment of matchingDeployments) {
      const statuses = await getJson(
        `${root}/deployments/${deployment.id}/statuses?per_page=1`
      );
      if (!Array.isArray(statuses))
        throw new Error("Invalid production deployment statuses.");
      const id = deployRunId(statuses[0], repository);
      if (id !== null)
        return { run_id: id, sha, discovery: "deployment-record" };
    }
    if (deployments.length < PAGE_SIZE) break;
  }
  return null;
}

async function findWorkflowRun(repository, sha, getJson) {
  const root = `repos/${repository}`;
  // Recovery is SHA-bound. Never select the newest run from possibly stale
  // history: a successful HTTP response can omit every recent deployment.
  for (let page = 1; page <= MAX_PAGES; page++) {
    const history = await getJson(
      `${root}/actions/workflows/build-upload-deploy-prod.yml/runs?branch=main&event=workflow_dispatch&head_sha=${sha}&per_page=${PAGE_SIZE}&page=${page}`
    );
    if (!Array.isArray(history.workflow_runs))
      throw new Error("Invalid production workflow history.");
    const run = history.workflow_runs.find((candidate) =>
      validRun(candidate, repository, sha)
    );
    if (run)
      return {
        run_id: String(run.id),
        sha,
        discovery: "sha-bound-workflow-history",
      };
    if (history.workflow_runs.length < PAGE_SIZE) break;
  }
  return null;
}

async function discoverProductionRun({
  repository,
  sha,
  getJson = githubJson,
}) {
  if (
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
    !SHA_PATTERN.test(sha)
  ) {
    throw new Error("Invalid production discovery repository or commit.");
  }
  const record = await findDeploymentRecord(repository, sha, getJson);
  if (record !== null) return record;
  const run = await findWorkflowRun(repository, sha, getJson);
  if (run !== null) return run;
  throw new Error(
    `No successful production deployment evidence matches live commit ${sha}.`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.output) throw new Error("--output is required");
  const initialEvidence = {
    schema_version: "production-canary-source.v1",
    state: "setup-failed",
  };
  writeEvidenceFile(args.output, initialEvidence);
  const sha = await liveProductionVersion();
  writeEvidenceFile(args.output, { ...initialEvidence, sha });
  const evidence = await discoverProductionRun({
    repository: args.repository,
    sha,
  });
  writeEvidenceFile(args.output, {
    schema_version: "production-canary-source.v1",
    state: "resolved",
    ...evidence,
  });
  process.stdout.write(`${evidence.run_id}\n`);
}

async function runCli() {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
if (require.main === module) void runCli();
module.exports = {
  githubJson,
  liveProductionVersion,
  deployRunId,
  discoverProductionRun,
};
