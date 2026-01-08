const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");

const args = process.argv.slice(2);
const outputPath = parseOutputPath(args);
const configPath = parseConfigPath(args);
const changedOnly = args.includes("--changed");

function getChangedFiles() {
  const cmd = `{ git diff --name-only -z main...HEAD -- "*.js" "*.jsx" "*.ts" "*.tsx" ":(exclude)generated/**"; git ls-files --others --exclude-standard -z -- "*.js" "*.jsx" "*.ts" "*.tsx" ":(exclude)generated/**"; }`;
  try {
    const output = execSync(cmd, { shell: "/bin/bash", encoding: "utf8" });
    return output.split("\0").filter((file) => file && fs.existsSync(file));
  } catch {
    return [];
  }
}

let proc;

if (changedOnly) {
  const files = getChangedFiles();
  if (files.length === 0) {
    console.log("No changed files to lint.");
    process.exit(0);
  }
  const eslintArgs = ["eslint", "--no-warn-ignored", "--format", "json"];
  if (configPath) {
    eslintArgs.push("--config", configPath);
  }
  eslintArgs.push(...files);
  proc = spawn("npx", eslintArgs, { stdio: ["ignore", "pipe", "pipe"] });
} else {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const npmArgs = ["--silent", "run", "lint", "--"];
  if (configPath) {
    npmArgs.push("--config", configPath);
  }
  npmArgs.push("--format", "json");
  proc = spawn(npmCommand, npmArgs, { stdio: ["ignore", "pipe", "pipe"] });
}

let stdout = "";
let stderr = "";

proc.on("error", (error) => {
  console.error("Failed to run npm lint:", error);
  process.exit(1);
});

proc.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
});

proc.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

proc.on("close", (code) => {
  if (stderr.trim()) {
    process.stderr.write(stderr);
  }

  const jsonText = extractJsonArray(stdout);
  if (!jsonText) {
    console.error("No JSON output from eslint. Ensure lint supports --format json.");
    process.exit(code || 1);
  }

  let results;
  try {
    results = JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse eslint JSON output:", error);
    process.stderr.write(jsonText);
    process.exit(code || 1);
  }

  const rows = buildRuleSummary(results);
  const csv = toCsv(rows);

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, csv, "utf8");
    } catch (error) {
      console.error(`Failed to write CSV to ${outputPath}:`, error);
      process.exit(1);
    }
    process.exit(code || 0);
  }

  process.stdout.write(csv, () => {
    process.exit(code || 0);
  });
});

function parseOutputPath(args) {
  let output = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--output" || arg === "-o") {
      output = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--output=")) {
      output = arg.slice("--output=".length);
    }
  }

  if (output === "") {
    console.error("Missing output path after --output.");
    process.exit(1);
  }

  return output;
}

function parseConfigPath(args) {
  let config = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--config" || arg === "-c") {
      const value = args[index + 1];
      if (!value) {
        console.error("Missing config path after --config.");
        process.exit(1);
      }
      config = value;
      index += 1;
    } else if (arg.startsWith("--config=")) {
      config = arg.slice("--config=".length);
    } else if (arg.startsWith("-c=")) {
      config = arg.slice("-c=".length);
    }
  }

  if (config === "") {
    console.error("Missing config path after --config.");
    process.exit(1);
  }

  return config;
}

function extractJsonArray(output) {
  const text = output.trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function buildRuleSummary(results) {
  const counts = new Map();

  for (const fileResult of results) {
    const messages = Array.isArray(fileResult.messages) ? fileResult.messages : [];
    for (const message of messages) {
      const rule = message.ruleId || "fatal";
      const severity = message.severity === 2 ? "error" : message.severity === 1 ? "warning" : "unknown";
      const key = `${rule}::${severity}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const rows = Array.from(counts.entries()).map(([key, count]) => {
    const [rule, severity] = key.split("::");
    return { rule, severity, count };
  });

  const severityOrder = { error: 0, warning: 1, unknown: 2 };
  rows.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    const ruleCompare = a.rule.localeCompare(b.rule);
    if (ruleCompare !== 0) {
      return ruleCompare;
    }
    return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
  });

  return rows;
}

function toCsv(rows) {
  const lines = ["rule,error_or_warning,count"];
  for (const row of rows) {
    lines.push([row.rule, row.severity, String(row.count)].map(escapeCsv).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
