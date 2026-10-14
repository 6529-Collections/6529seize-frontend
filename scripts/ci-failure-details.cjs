const fs = require("node:fs");
const path = require("node:path");

const MAX_DESCRIPTION_LENGTH = 4800;
const PROJECT_LABELS = {
  "web-desktop-chromium": "desktop Chromium",
  "web-mobile-chromium": "mobile Chromium",
  "web-desktop-firefox": "desktop Firefox",
  "web-desktop-webkit": "desktop WebKit",
};

function plainText(value) {
  return String(value)
    .replaceAll(/\b[A-Za-z][A-Za-z0-9+.-]*:\/\/\S+/g, "[URL omitted]")
    .replaceAll(/\s+/g, " ")
    .replaceAll(/[@\\`*_]/g, (character) =>
      character === "@" ? "＠" : `\\${character}`
    )
    .trim();
}

function boundedDescription(lines) {
  const suffix = "\n\nAdditional details omitted; inspect the linked run.";
  const kept = [];
  for (const line of lines) {
    if (
      [...kept, line].join("\n").length >
      MAX_DESCRIPTION_LENGTH - suffix.length
    ) {
      return kept.join("\n") + suffix;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

// Playwright's final failed-test list excludes tests recovered on retry.
// Read only that list, never assertion bodies, URLs, diagnostics, or raw logs.
function parsePlaywrightFailures(output) {
  const lines = output.replaceAll(/\u001b\[[0-9;]*m/g, "").split(/\r?\n/);
  const index = lines.findLastIndex((line) => /^\s*\d+ failed\s*$/.test(line));
  if (index < 0) return null;
  const count = Number(lines[index].trim().split(" ")[0]);
  if (!Number.isSafeInteger(count) || count < 1) return null;
  const tests = [];
  for (const line of lines.slice(index + 1)) {
    if (!line.trim()) {
      if (tests.length > 0) break;
      continue;
    }
    if (/^\s*\d+ (?:flaky|skipped|passed|did not run)\b/.test(line)) break;
    const match = /^\s*\[([^\]]+)\] › (.+?:\d+:\d+) › (.+?)\s*$/.exec(line);
    if (!match) continue;
    tests.push({
      project: match[1],
      location: match[2],
      name: match[3].split(" › ").at(-1),
      title: match[3],
    });
    if (tests.length === count) break;
  }
  return { count, tests };
}

function readFailedPack(root, result) {
  const attempt = result.attempts?.at(-1)?.attempt ?? 1;
  if (!Number.isSafeInteger(attempt) || attempt < 1) return null;
  const slug = result.script_key.replaceAll(/[^a-zA-Z0-9]+/g, "-");
  const parts = [
    root,
    slug,
    ...(attempt === 1 ? [] : [`attempt-${attempt}`]),
    "output.log",
  ];
  try {
    const file = path.join(...parts);
    const descriptor = fs.openSync(file, "r");
    try {
      if (fs.fstatSync(descriptor).size > 32 * 1024 * 1024) return null;
      return parsePlaywrightFailures(fs.readFileSync(descriptor, "utf8"));
    } finally {
      fs.closeSync(descriptor);
    }
  } catch {
    return null;
  }
}

function groupedTestLines(pack) {
  const tests = new Map();
  for (const test of pack.failures.tests) {
    const key = `${test.location}\n${test.title}`;
    const entry = tests.get(key) ?? {
      name: test.name,
      title: test.title,
      projects: new Set(),
    };
    entry.projects.add(test.project);
    tests.set(key, entry);
  }
  const groups = new Map();
  const titlesByName = new Map();
  for (const test of tests.values()) {
    const titles = titlesByName.get(test.name) ?? new Set();
    titles.add(test.title);
    titlesByName.set(test.name, titles);
  }
  for (const test of tests.values()) {
    const projects = [...test.projects].sort((a, b) => a.localeCompare(b));
    const key = projects.join(",");
    const group = groups.get(key) ?? { projects, tests: [] };
    group.tests.push(
      titlesByName.get(test.name).size > 1 ? test.title : test.name
    );
    groups.set(key, group);
  }
  const lines = [];
  for (const group of groups.values()) {
    const projects = group.projects.map(
      (project) => PROJECT_LABELS[project] ?? plainText(project)
    );
    // A group contains only tests with the same set of failed projects.
    const count = group.tests.length * group.projects.length;
    lines.push(
      "",
      `**${plainText(pack.alias)} — ${projects.join(" and ")} (${count} failure${count === 1 ? "" : "s"})**`,
      ""
    );
    lines.push(...group.tests.map((name) => `- ${plainText(name)}`));
  }
  if (pack.failures.tests.length < pack.failures.count) {
    lines.push(
      "",
      `${pack.failures.count - pack.failures.tests.length} test names unavailable; inspect the linked run.`
    );
  }
  return lines;
}

function collectE2EFailures(root) {
  if (!root) return null;
  try {
    const evidence = JSON.parse(
      fs.readFileSync(path.join(root, "evidence.json"), "utf8")
    );
    if (evidence.schema_version !== "deployment-e2e-packs.v1") return null;
    if (
      !Array.isArray(evidence.results) ||
      !evidence.results.every(
        (result) =>
          result &&
          typeof result.script_key === "string" &&
          result.script_key.length > 0 &&
          (result.attempts === undefined || Array.isArray(result.attempts))
      )
    )
      return null;
    const packs = evidence.results
      .filter((result) => result.status === "failed")
      .map((result) => ({
        alias:
          result.script_key.replace(/^test:e2e:(staging|production):?/, "") ||
          "core",
        failures: readFailedPack(root, result),
      }));
    if (!packs.length) return null;
    const count = packs.reduce(
      (total, pack) => total + (pack.failures?.count ?? 0),
      0
    );
    const lines = count
      ? [
          `**${count} failed test${count === 1 ? "" : "s"} across ${packs.length} pack${packs.length === 1 ? "" : "s"}**`,
        ]
      : ["**Validation failed; test names are unavailable**"];
    for (const pack of packs) {
      if (pack.failures) lines.push(...groupedTestLines(pack));
      else
        lines.push(
          "",
          `**${plainText(pack.alias)}**`,
          "",
          "Test results unavailable; inspect setup and run logs."
        );
    }
    return {
      description: boundedDescription(lines),
      nameCount: packs.reduce(
        (total, pack) => total + (pack.failures?.tests.length ?? 0),
        0
      ),
    };
  } catch {
    return null;
  }
}

function summarizeE2E(root) {
  return collectE2EFailures(root)?.description ?? null;
}

async function summarizeWorkflowSteps({
  repository,
  runId,
  runAttempt,
  token,
  fetchImpl,
}) {
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^\d+$/.test(runId))
    return null;
  const response = await fetchImpl(
    `https://api.github.com/repos/${repository}/actions/runs/${runId}/attempts/${runAttempt}/jobs?per_page=100`,
    {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!response.ok) return null;
  const { jobs } = await response.json();
  const lines = jobs.flatMap((job) =>
    (job.steps ?? [])
      .filter((step) => step.conclusion === "failure")
      .map((step) => `- ${plainText(job.name)} — ${plainText(step.name)}`)
  );
  return lines.length
    ? boundedDescription(["**Failed workflow steps**", "", ...lines])
    : null;
}

async function getFailureDescription({
  artifactRoot,
  description,
  repository,
  runId,
  runAttempt,
  token,
  fetchImpl = fetch,
}) {
  const tests = collectE2EFailures(artifactRoot);
  if (tests?.nameCount > 0) return tests.description;
  const fallback = [
    ...(description ? [description] : []),
    ...(artifactRoot
      ? [
          tests?.description ??
            "Test failure evidence unavailable; inspect setup and run logs.",
        ]
      : []),
  ].join("\n\n");
  try {
    const steps = await summarizeWorkflowSteps({
      repository,
      runId,
      runAttempt,
      token,
      fetchImpl,
    });
    if (steps)
      return boundedDescription([...(fallback ? [fallback, ""] : []), steps]);
  } catch {
    // Notification enrichment must never prevent the original alert.
  }
  return boundedDescription(
    (fallback || "Failure details unavailable; inspect the linked run.").split(
      "\n"
    )
  );
}

module.exports = {
  getFailureDescription,
  parsePlaywrightFailures,
  summarizeE2E,
};
