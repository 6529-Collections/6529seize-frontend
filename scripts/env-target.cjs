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
  const match = line.match(/^(\s*#?\s*)(API_ENDPOINT|WS_ENDPOINT)\s*=\s*(.*)$/);
  if (!match) {
    return null;
  }

  const value = match[3].trim().replace(/^['"]|['"]$/g, "");
  return {
    key: match[2],
    value,
    active: !match[1].includes("#"),
  };
}

function readEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
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
  const seen = new Set();

  const nextLines = lines.map((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      return line;
    }

    if (!managedValues.has(`${parsed.key}:${parsed.value}`)) {
      return line;
    }

    seen.add(`${parsed.key}:${parsed.value}`);
    return formatLine(parsed.key, parsed.value, target[parsed.key] === parsed.value);
  });

  for (const [key, value] of Object.entries(target)) {
    const marker = `${key}:${value}`;
    if (!seen.has(marker)) {
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
