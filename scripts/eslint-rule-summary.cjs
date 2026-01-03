const { spawn } = require("node:child_process");
const fs = require("node:fs");

const outputPath = parseOutputPath(process.argv.slice(2));

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npmArgs = ["--silent", "run", "lint", "--", "--format", "json"];

const proc = spawn(npmCommand, npmArgs, { stdio: ["ignore", "pipe", "pipe"] });

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
