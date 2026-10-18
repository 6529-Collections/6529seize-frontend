/**
 * Proves the TDH engine against P26's conformance vectors and records it.
 *
 *   6529 exec tsx scripts/explained/tdh-engine-conformance.ts \
 *     --chain <6529chain checkout> [--ref origin/main] [--check]
 *
 * Reads every vector with `git show <ref>:design/tdh-reference/vectors/<id>.json`,
 * runs it through the engine (`components/explained/engine/vectors.ts`), and
 * writes two files: the conformance record (`conformance.json`: each
 * vector's id, content digest, scope, status and check count, and the
 * digest of the engine sources that produced them) and the five public
 * vectors (`publicVectors.ts`, restated in full). Nothing else is copied
 * from the private repository. `--check` writes nothing and fails when
 * either file differs from what the vectors give.
 *
 * Jest checks the record against the engine on every run, and reruns the
 * whole set when `TDH_6529CHAIN` names a checkout.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalJson,
  isObject,
  parseJsonExact,
  type JsonObject,
  type JsonValue,
} from "../../components/explained/engine/json";
import {
  runVector,
  type VectorRun,
} from "../../components/explained/engine/vectors";

const ENGINE_DIR = "components/explained/engine";
const RECORD_PATH = `${ENGINE_DIR}/conformance.json`;
const PUBLIC_VECTORS_PATH = `${ENGINE_DIR}/publicVectors.ts`;
const VECTORS_PATH = "design/tdh-reference/vectors";
/** The vectors restated in full on the Implementations page (TDH-DESIGN §4.7). */
export const PUBLIC_VECTOR_IDS = [
  "04-mid-period-transfer",
  "06-consolidation-age-carry",
  "23-identity-sums",
  "28-registry-hash",
  "36-erc1155-send-and-return",
] as const;

/** Line endings as git stores them, whatever the checkout's. */
function lf(text: string): string {
  return text.replaceAll("\r\n", "\n");
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** The engine's source files that the record vouches for. */
export function engineFiles(root: string): string[] {
  return readdirSync(path.join(root, ENGINE_DIR))
    .filter((f) => f.endsWith(".ts") && f !== "publicVectors.ts")
    .sort()
    .map((f) => `${ENGINE_DIR}/${f}`);
}

/** SHA-256 over each engine file's name and LF text, in name order. */
export function engineDigest(root: string): string {
  return sha256(
    engineFiles(root)
      .map((f) => `${f}\n${lf(readFileSync(path.join(root, f), "utf8"))}`)
      .join("\0")
  );
}

/** SHA-256 of a vector's content, read exactly and serialized canonically. */
export function contentDigest(text: string): string {
  return sha256(canonicalJson(parseJsonExact(text)));
}

interface ChainVectors {
  /** The commit that last changed the vectors, as of the ref read. */
  readonly commit: string;
  readonly vectors: readonly { readonly id: string; readonly text: string }[];
}

function git(chain: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", chain, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * Every vector at `ref` of a 6529chain checkout, read with `git show`, and
 * the commit that last changed them: a later commit that leaves the vectors
 * alone (a new decision record, say) leaves the record as it is.
 */
export function readChainVectors(chain: string, ref: string): ChainVectors {
  const head = git(chain, ["rev-parse", `${ref}^{commit}`]).trim();
  const commit = git(chain, [
    "log",
    "-1",
    "--format=%H",
    head,
    "--",
    `${VECTORS_PATH}/`,
  ]).trim();
  const files = git(chain, [
    "ls-tree",
    "--name-only",
    commit,
    `${VECTORS_PATH}/`,
  ])
    .split("\n")
    .filter((f) => f.endsWith(".json"))
    .sort();
  return {
    commit,
    vectors: files.map((f) => ({
      id: path.posix.basename(f, ".json"),
      text: git(chain, ["show", `${commit}:${f}`]),
    })),
  };
}

interface RecordEntry {
  readonly id: string;
  readonly digest: string;
  readonly scope: VectorRun["scope"];
  readonly status: VectorRun["status"];
  readonly checks: number;
  readonly note?: string;
}

interface ConformanceRecord {
  readonly format: "6529.explained.tdh-engine-conformance.v1";
  readonly specification: {
    readonly repository: "6529chain";
    readonly commit: string;
    readonly path: string;
  };
  readonly engine: {
    readonly sha256: string;
    readonly files: readonly string[];
  };
  readonly summary: {
    readonly vectors: number;
    readonly inScope: number;
    readonly pass: number;
    readonly fail: number;
    readonly outOfScope: number;
    readonly checks: number;
  };
  readonly vectors: readonly RecordEntry[];
}

export function entryOf(run: VectorRun, text: string): RecordEntry {
  return {
    id: run.id,
    digest: contentDigest(text),
    scope: run.scope,
    status: run.status,
    checks: run.checks,
    ...(run.status === "out-of-scope" && run.note ? { note: run.note } : {}),
  };
}

function buildRecord(root: string, chain: ChainVectors): ConformanceRecord {
  const entries = chain.vectors.map((v) =>
    entryOf(runVector(v.id, v.text), v.text)
  );
  const count = (status: VectorRun["status"]) =>
    entries.filter((e) => e.status === status).length;
  return {
    format: "6529.explained.tdh-engine-conformance.v1",
    specification: {
      repository: "6529chain",
      commit: chain.commit,
      path: VECTORS_PATH,
    },
    engine: { sha256: engineDigest(root), files: engineFiles(root) },
    summary: {
      vectors: entries.length,
      inScope: entries.length - count("out-of-scope"),
      pass: count("pass"),
      fail: count("fail"),
      outOfScope: count("out-of-scope"),
      checks: entries.reduce((sum, e) => sum + e.checks, 0),
    },
    vectors: entries,
  };
}

/**
 * A JSON value laid out for reading: containers that hold containers open
 * one level per line down to `INLINE_DEPTH`, and everything below is one line
 * (a transfer, a record, a list of numbers). Numbers keep every digit.
 */
const INLINE_DEPTH = 5;

function inline(value: JsonValue): string {
  if (Array.isArray(value)) {
    return `[${value.map(inline).join(", ")}]`;
  }
  if (isObject(value)) {
    return `{${Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`)
      .join(", ")}}`;
  }
  return canonicalJson(value);
}

function layout(value: JsonValue, depth = 0): string {
  const children = Array.isArray(value)
    ? value
    : isObject(value)
      ? Object.values(value)
      : [];
  const nested = children.some((c) => Array.isArray(c) || isObject(c));
  if (depth >= INLINE_DEPTH || !nested) {
    return inline(value);
  }
  const pad = "  ".repeat(depth + 1);
  const items = Array.isArray(value)
    ? value.map((v) => `${pad}${layout(v, depth + 1)}`)
    : Object.entries(value as JsonObject).map(
        ([k, v]) => `${pad}${JSON.stringify(k)}: ${layout(v, depth + 1)}`
      );
  const [open, close] = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  return `${open}\n${items.join(",\n")}\n${"  ".repeat(depth)}${close}`;
}

/**
 * The public vectors document: each vector read exactly from its file and
 * laid out again, so the document reads back to the same values.
 */
function publicVectorsJson(chain: ChainVectors): string {
  const vectors: Record<string, JsonValue> = {};
  for (const id of PUBLIC_VECTOR_IDS) {
    const vector = chain.vectors.find((v) => v.id === id);
    if (!vector) {
      throw new Error(`vector ${id} is missing at ${chain.commit}`);
    }
    vectors[id] = parseJsonExact(vector.text);
  }
  return layout({
    format: "6529.tdh-public-vectors.v1",
    ruleVersion: "tdh-v1.4",
    source: {
      repository: "6529chain",
      commit: chain.commit,
      path: VECTORS_PATH,
    },
    vectors,
  });
}

function publicVectorsModule(chain: ChainVectors): string {
  const json = publicVectorsJson(chain);
  if (json.includes("`") || json.includes("${")) {
    throw new Error("the public vectors cannot be held in a template literal");
  }
  return `/**
 * Five of P26's conformance vectors, restated in full and served as
 * /network/tdh/public-vectors.json (TDH-DESIGN §4.7), as their files state
 * them at 6529chain ${chain.commit.slice(0, 7)}:
${PUBLIC_VECTOR_IDS.map((id) => ` * - ${id}`).join("\n")}
 *
 * Every address, transaction and token is synthetic. Generated by
 * scripts/explained/tdh-engine-conformance.ts; do not edit by hand.
 */
export const PUBLIC_VECTORS_JSON = String.raw\`${json}\`;
`;
}

function argument(args: readonly string[], name: string): string | undefined {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
}

/** Formats an output as the repository's Prettier config would. */
async function formatted(
  root: string,
  file: string,
  text: string
): Promise<string> {
  // Prettier is loaded only to write files, never by the tests.
  const { format, resolveConfig } = await import("prettier");
  const filepath = path.join(root, file);
  const options = (await resolveConfig(filepath)) ?? {};
  return format(text, { ...options, filepath });
}

async function main(
  args: readonly string[],
  root = process.cwd()
): Promise<number> {
  const chainDir = argument(args, "--chain") ?? process.env["TDH_6529CHAIN"];
  if (!chainDir) {
    process.stderr.write(
      "--chain <6529chain checkout> (or TDH_6529CHAIN) is required\n"
    );
    return 2;
  }
  const chain = readChainVectors(
    chainDir,
    argument(args, "--ref") ?? "origin/main"
  );
  const record = buildRecord(root, chain);
  const outputs: [string, string][] = [
    [RECORD_PATH, await formatted(root, RECORD_PATH, JSON.stringify(record))],
    [
      PUBLIC_VECTORS_PATH,
      await formatted(root, PUBLIC_VECTORS_PATH, publicVectorsModule(chain)),
    ],
  ];
  process.stdout.write(
    `${JSON.stringify({ commit: chain.commit, ...record.summary })}\n`
  );
  if (args.includes("--check")) {
    const stale = outputs.filter(
      ([file, text]) => lf(readFileSync(path.join(root, file), "utf8")) !== text
    );
    for (const [file] of stale) {
      process.stderr.write(`${file} is not what the vectors give\n`);
    }
    return stale.length > 0 || record.summary.fail > 0 ? 1 : 0;
  }
  for (const [file, text] of outputs) {
    writeFileSync(path.join(root, file), text, "utf8");
  }
  return record.summary.fail > 0 ? 1 : 0;
}

const invokedPath = process.argv[1]?.replaceAll("\\", "/");
if (invokedPath?.endsWith("/scripts/explained/tdh-engine-conformance.ts")) {
  void main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    }
  );
}
