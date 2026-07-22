#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { createHmac } = require("node:crypto");

const PROFILE_FIELDS = [
  "NODE_ENV",
  "API_ENDPOINT",
  "WS_ENDPOINT",
  "ALLOWLIST_API_ENDPOINT",
  "BASE_ENDPOINT",
  "VERSION",
  "ALCHEMY_API_KEY",
  "NEXTGEN_CHAIN_ID",
  "MOBILE_APP_SCHEME",
  "CORE_SCHEME",
  "IPFS_API_ENDPOINT",
  "IPFS_GATEWAY_ENDPOINT",
  "GIPHY_API_KEY",
  "AWS_RUM_APP_ID",
  "AWS_RUM_REGION",
  "AWS_RUM_SAMPLE_RATE",
  "NEXT_PUBLIC_MIXPANEL_TOKEN",
  "ASSETS_FROM_S3",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_DSN",
  "ANNOUNCED_VERSION_ENDPOINT",
];

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must be --key value pairs");
    }
    result[key.slice(2)] = value;
  }
  return result;
}

function required(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${name}`);
  }
  return value;
}

function buildProfile(args, environment = process.env) {
  const sourceSha = required(args, "source-sha");
  const outputEnvironment = required(args, "environment");
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error("Invalid source SHA");
  if (!new Set(["staging", "production"]).has(outputEnvironment)) {
    throw new Error("Unsupported build profile environment");
  }
  const key = environment.RELEASE_BUS_BUILD_PROFILE_HMAC_KEY;
  if (typeof key !== "string" || key.length < 32) {
    throw new Error("Build-profile HMAC key is missing or too short");
  }
  const values = Object.fromEntries(
    PROFILE_FIELDS.map((field) => {
      if (!(field in environment)) {
        throw new Error(`Build-profile field ${field} is missing`);
      }
      return [field, String(environment[field])];
    })
  );
  if (values.VERSION !== sourceSha) {
    throw new Error("Build-profile VERSION does not match source SHA");
  }
  const protectedIdentity = {
    schema_version: 1,
    kind: "release_bus_frontend_build_profile",
    environment: outputEnvironment,
    source_sha: sourceSha,
    node_version: "22",
    timestamp_policy: "utc_workflow_run_start_seconds",
    values,
  };
  return {
    schema_version: 1,
    kind: "release_bus_frontend_build_profile",
    environment: outputEnvironment,
    source_sha: sourceSha,
    node_version: "22",
    timestamp_policy: protectedIdentity.timestamp_policy,
    protected_fields: PROFILE_FIELDS,
    digest: createHmac("sha256", key)
      .update(JSON.stringify(protectedIdentity))
      .digest("hex"),
  };
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const profile = buildProfile(args);
  const output = required(args, "output");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(profile, null, 2)}\n`);
}

module.exports = { PROFILE_FIELDS, buildProfile };

if (require.main === module) {
  try {
    run();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 2;
  }
}
