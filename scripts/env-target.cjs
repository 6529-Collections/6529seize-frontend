#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, ".env");

const targets = {
  local: {
    API_ENDPOINT: "http://localhost:3000",
    WS_ENDPOINT: "ws://localhost:3000",
  },
  staging: {
    API_ENDPOINT: "https://api.staging.6529.io",
    WS_ENDPOINT: "wss://ws.staging.6529.io",
  },
  prod: {
    API_ENDPOINT: "https://api.6529.io",
    WS_ENDPOINT: "wss://ws.6529.io",
  },
};

const managedKeys = Object.keys(targets.local);
const managedValues = new Map(
  Object.values(targets).flatMap((target) =>
    Object.entries(target).map(([key, value]) => [`${key}:${value}`, true])
  )
);

function usage() {
  console.log(`Usage:
  6529 env status
  6529 env local
  6529 env staging
  6529 env prod`);
}

function parseEnvLine(line) {
  const equalsIndex = line.indexOf("=");
  if (equalsIndex === -1) {
    return null;
  }

  let left = line.slice(0, equalsIndex).trim();
  const right = line.slice(equalsIndex + 1);

  let active = true;
  if (left.startsWith("#")) {
    active = false;
    left = left.slice(1).trim();
  }

  if (left !== "API_ENDPOINT" && left !== "WS_ENDPOINT") {
    return null;
  }

  const value = right.trim().replaceAll(/^['"]|['"]$/g, "");
  return {
    key: left,
    value,
    active,
  };
}

function readEnv() {
  if (!fs.existsSync(envPath)) {
    console.error(`Missing ${envPath}`);
    process.exit(1);
  }

  return fs.readFileSync(envPath, "utf8");
}

function getActiveTarget(contents) {
  const active = {};

  for (const line of contents.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed?.active && managedKeys.includes(parsed.key)) {
      active[parsed.key] = parsed.value;
    }
  }

  for (const [name, target] of Object.entries(targets)) {
    if (managedKeys.every((key) => active[key] === target[key])) {
      return { name, active };
    }
  }

  return { name: "mixed", active };
}

function formatLine(key, value, active) {
  return `${active ? "" : "# "}${key}='${value}'`;
}

function switchTarget(targetName) {
  const target = targets[targetName];
  const contents = readEnv();
  const lines = contents.split(/\r?\n/);
  const managedKeysSet = new Set(managedKeys);
  const seen = new Set();

  const nextLines = lines.map((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      return line;
    }

    if (!managedKeysSet.has(parsed.key)) {
      return line;
    }

    seen.add(parsed.key);
    return formatLine(
      parsed.key,
      parsed.value,
      target[parsed.key] === parsed.value
    );
  });

  for (const [key, value] of Object.entries(target)) {
    if (!seen.has(key)) {
      nextLines.push(formatLine(key, value, true));
    }
  }

  fs.writeFileSync(envPath, nextLines.join("\n"));
  printStatus(readEnv());
}

function printStatus(contents) {
  const { name, active } = getActiveTarget(contents);
  console.log(`env target: ${name}`);
  console.log(`API_ENDPOINT: ${active.API_ENDPOINT || "(not set)"}`);
  console.log(`WS_ENDPOINT: ${active.WS_ENDPOINT || "(not set)"}`);
}

const command = process.argv[2] || "status";

if (command === "status") {
  printStatus(readEnv());
} else if (Object.hasOwn(targets, command)) {
  switchTarget(command);
} else {
  usage();
  process.exitCode = 1;
}
