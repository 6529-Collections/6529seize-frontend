#!/usr/bin/env node
/**
 * Refreshes the 6529 Explained snapshot of 6529's design record
 * (`lib/explained/data/record.json`) from a local clone of 6529chain, read
 * at `origin/main` with `git show` after a fetch. Run it at ship time (the
 * fact gate, PLAYBOOK.md §8), then run the drift check:
 *
 *   node scripts/explained/sync-record.mjs --chain <path to 6529chain> [--no-fetch] [--check] [--ref <commit>]
 *
 * It records, with the commit each came from:
 * - the record's head (commit, date, the newest D-number);
 * - every decision's D-number and the D-numbers its text cites, so the
 *   drift check can find a newer decision that touches a page's;
 * - a one-line summary for the decisions the pages cite (CITED below);
 * - P26: its commit, rule version, registry hash, rule ID, vector count,
 *   the registry values the kit's facts print (§10), and the IDs of its
 *   deviations (§11, each marked when a decision settled it) and legacy
 *   issues (§12);
 * - the Lean model's commit (its counts are read from the manifest the
 *   public feed serves, which names the commit it was built from).
 *
 * `--ref` reads a reviewed commit instead of `origin/main`, so the snapshot
 * can be regenerated where the pages were checked without moving to a newer
 * head.
 *
 * Nothing private beyond what the pages already restate is copied: no
 * person, no handle, no account or host name, no address. `--check` exits
 * 1 when the snapshot is behind the record instead of writing it.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const OUT = path.join(ROOT, "lib/explained/data/record.json");

/**
 * The decisions release 1 cites and summarizes (TDH-DESIGN.md §3,
 * `decision.D*`). A later chapter adds its own when it ships; a decision
 * outside this list keeps only its number and the numbers it cites.
 */
export const CITED = [
  "D30",
  "D41",
  "D63",
  "D86",
  "D89",
  "D112",
  "D116",
  "D118",
  "D119",
  "D121",
  "D125",
  "D128",
  "D130",
  "D131",
  "D132",
  "D136",
  "D137",
];

const REGISTRY_KEYS = [
  "eligibility_min_age_s",
  "day_s",
  "edition_floor_cap",
  "edition_floor_threshold",
  "consolidation_max_wallets",
  "consolidation_ungated_max_wallets",
  "consolidation_gate_activation_s",
  "season_bonus",
  "last_boosted_season",
  "genesis_bonus",
  "nakamoto_bonus",
  "gradient_bonus",
  "gradient_max_count",
  "gradient_rate_minimum",
];

function args() {
  const out = { chain: null, fetch: true, check: false, ref: "origin/main" };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--chain") out.chain = argv[++i];
    else if (argv[i] === "--no-fetch") out.fetch = false;
    else if (argv[i] === "--check") out.check = true;
    else if (argv[i] === "--ref") out.ref = argv[++i];
  }
  if (!out.chain) {
    console.error(
      "usage: sync-record.mjs --chain <path to 6529chain> [--no-fetch] [--check] [--ref <commit>]"
    );
    process.exit(2);
  }
  return out;
}

function git(chain, gitArgs) {
  return execFileSync("git", ["-C", chain, ...gitArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** The first sentence of a decision, with links, code and quotes removed. */
export function summarize(text) {
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Code spans that name a repository, an account or a host are dropped.
    .replace(/`([^`]*)`/g, (match, inner) =>
      /[/@]|^[a-z0-9]+(?:-[a-z0-9]+){2,}$/.test(inner) ? "" : inner
    )
    .replace(/https?:\/\/\S+/g, "")
    .replace(/,\s*,/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = plain.split(/(?<=[.!?])\s+(?=[A-Z0-9("])/);
  let summary = sentences[0] ?? plain;
  // A one- or two-word first sentence ("Names.") takes the next one with it.
  if (summary.split(" ").length < 4 && sentences[1]) {
    summary = `${summary} ${sentences[1]}`;
  }
  return summary
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every decision in the D table of design/README.md: its number and the ones it cites. */
export function parseDecisions(readme) {
  const decisions = [];
  for (const line of readme.split(/\r?\n/)) {
    const match = /^\| (D\d+) \| (.*) \|\s*$/.exec(line);
    if (!match) continue;
    const [, id, text] = match;
    const refs = [
      ...new Set(
        [...text.matchAll(/\bD(\d{1,3})\b/g)].map((m) => `D${Number(m[1])}`)
      ),
    ]
      .filter((ref) => ref !== id)
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    decisions.push({ id, refs, text });
  }
  return decisions;
}

/** A P26 §10 registry value as a number (the first number in its cell). */
export function parseRegistry(spec) {
  const values = {};
  for (const line of spec.split(/\r?\n/)) {
    const match = /^\| `([a-z_]+)`(?:, `([a-z_]+)`)? \| ([^|]+) \|/.exec(line);
    if (!match) continue;
    const names = [match[1], match[2]].filter(Boolean);
    // "{1, 2, 3}, 0.01" names a set and a number: drop the set's members.
    const numbers = match[3]
      .replace(/\([^)]*\)/g, "")
      .replace(/\{[^}]*\}/g, "set")
      .split(",")
      .map((part) => part.trim());
    // "0.05, 20" pairs two names with two values; "86,400" is one number.
    if (names.length === 2 && numbers.length === 2) {
      names.forEach((name, index) => (values[name] = Number(numbers[index])));
    } else if (names.length === 1) {
      const value = Number(
        match[3]
          .replace(/\([^)]*\)/g, "")
          .replace(/,/g, "")
          .trim()
      );
      if (Number.isFinite(value)) values[names[0]] = value;
    }
  }
  return Object.fromEntries(
    REGISTRY_KEYS.filter((key) => key in values).map((key) => [
      key,
      values[key],
    ])
  );
}

/**
 * P26 §11's deviations and §12's legacy issues, by ID, in table order: a
 * deviation a decision settled says so in its last column ("Settled by").
 */
export function parseItems(spec) {
  const deviations = [];
  const issues = [];
  for (const line of spec.split(/\r?\n/)) {
    const dev = /^\| (DEV-\d+) \|.*\| ([^|]*) \|\s*$/.exec(line);
    if (dev) {
      deviations.push({ id: dev[1], settled: /^Settled\b/.test(dev[2]) });
      continue;
    }
    const bug = /^\| (BUG-\d+) \|/.exec(line);
    if (bug) issues.push(bug[1]);
  }
  return { deviations, issues };
}

async function main() {
  const opts = args();
  if (opts.fetch) git(opts.chain, ["fetch", "--quiet", "origin"]);
  const { ref } = opts;
  const head = git(opts.chain, ["log", "-1", "--format=%H %cI", ref])
    .trim()
    .split(" ");
  const readme = git(opts.chain, ["show", `${ref}:design/README.md`]);
  const spec = git(opts.chain, [
    "show",
    `${ref}:design/tdh-v1-specification.md`,
  ]);
  const facts = git(opts.chain, [
    "show",
    `${ref}:design/tdh-lean/Tdh/Facts.lean`,
  ]);
  const p26 = git(opts.chain, [
    "log",
    "-1",
    "--format=%H %cI",
    ref,
    "--",
    "design/tdh-v1-specification.md",
  ])
    .trim()
    .split(" ");
  const lean = git(opts.chain, [
    "log",
    "-1",
    "--format=%H %cI",
    ref,
    "--",
    "design/tdh-lean",
  ])
    .trim()
    .split(" ");
  const vectors = git(opts.chain, [
    "ls-tree",
    "--name-only",
    `${ref}:design/tdh-reference/vectors`,
  ])
    .split(/\r?\n/)
    .filter((name) => name.endsWith(".json")).length;

  const decisions = parseDecisions(readme);
  const newest = decisions.reduce(
    (max, d) => (Number(d.id.slice(1)) > Number(max.slice(1)) ? d.id : max),
    "D0"
  );
  const ruleVersion = /Rule version: `(tdh-v[\d.]+)`/.exec(spec)?.[1];
  const hex = (name) => {
    const block = new RegExp(`${name} ==\\s*\\n?\\s*(0x[0-9a-f]{64})`).exec(
      facts
    );
    return block?.[1];
  };
  const registryHash = hex("Params.v1_4.registryHash");
  const ruleId = hex("Params.v1_4.tdhRuleId");
  if (!ruleVersion || !registryHash || !ruleId) {
    throw new Error(
      "could not read P26's rule version, registry hash or rule ID"
    );
  }

  const record = {
    note: "Generated by scripts/explained/sync-record.mjs from 6529chain origin/main. Do not edit by hand.",
    source: "6529chain origin/main",
    head: { commit: head[0], date: head[1], newestDecision: newest },
    p26: {
      commit: p26[0],
      date: p26[1],
      ruleVersion,
      registryHash,
      ruleId,
      vectors,
      registry: parseRegistry(spec),
      ...parseItems(spec),
    },
    lean: { commit: lean[0], date: lean[1] },
    decisions: decisions.map((d) => ({
      id: d.id,
      refs: d.refs,
      ...(CITED.includes(d.id) ? { summary: summarize(d.text) } : {}),
    })),
  };

  if (opts.check) {
    // Compare values, not bytes: the repo's formatter lays the file out.
    const current = JSON.stringify(JSON.parse(readFileSync(OUT, "utf8")));
    if (current !== JSON.stringify(record)) {
      console.error(
        `record.json is behind 6529chain ${ref} (head ${head[0].slice(0, 7)}, ${newest}). Run without --check.`
      );
      process.exit(1);
    }
    console.log(
      `record.json matches 6529chain ${ref} at ${head[0].slice(0, 7)} (${newest}).`
    );
    return;
  }
  // Write it as the repo's formatter would, so a sync leaves no format churn.
  const prettier = await import("prettier");
  const options = (await prettier.resolveConfig(OUT)) ?? {};
  writeFileSync(
    OUT,
    await prettier.format(JSON.stringify(record, null, 2), {
      ...options,
      filepath: OUT,
    })
  );
  console.log(
    `wrote ${path.relative(ROOT, OUT)}: head ${head[0].slice(0, 7)} (${newest}), P26 ${p26[0].slice(0, 7)}, ${decisions.length} decisions, ${vectors} vectors`
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
