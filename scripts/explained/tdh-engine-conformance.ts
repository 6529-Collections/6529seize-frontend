/**
 * Proves the TDH engine against P26's conformance vectors and records it.
 *
 *   6529 exec tsx scripts/explained/tdh-engine-conformance.ts \
 *     --chain <6529chain checkout> [--ref origin/main] [--check]
 *
 * Reads every vector with `git show <ref>:design/tdh-reference/vectors/<id>.json`,
 * as bytes, and every file of `design/tdh-reference/no-vector`, runs them
 * through the engine (`components/explained/engine/vectors.ts`), and writes
 * two files: the conformance record (`conformance.json`: each vector's id,
 * content digest, scope, status and check count; each no-vector file's id,
 * byte digest and the reason it was refused; and the digest of the engine
 * sources that produced them) and the five public vectors
 * (`publicVectors.ts`, restated in full). Nothing else is copied from the
 * private repository. `--check` writes nothing and fails when either file
 * differs from what the vectors give.
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
  decodeVectorText,
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
/** Files that are no vector, which every implementation must fail (P26 §13). */
const NO_VECTOR_PATH = "design/tdh-reference/no-vector";
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

function sha256(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
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

/**
 * SHA-256 of a vector's content, read exactly and serialized canonically: the
 * same for the file's bytes and for the same values laid out again.
 */
export function contentDigest(file: string | Uint8Array): string {
  const text = typeof file === "string" ? file : decodeVectorText(file);
  return sha256(canonicalJson(parseJsonExact(text)));
}

/** One file of the set, as git stores it. */
interface ChainFile {
  readonly id: string;
  readonly bytes: Uint8Array;
}

interface ChainVectors {
  /** The commit that last changed the vectors or the no-vector files. */
  readonly commit: string;
  readonly vectors: readonly ChainFile[];
  readonly noVectors: readonly ChainFile[];
}

function git(chain: string, args: readonly string[]): Buffer {
  return execFileSync("git", ["-C", chain, ...args], {
    maxBuffer: 64 * 1024 * 1024,
  });
}

function gitText(chain: string, args: readonly string[]): string {
  return git(chain, args).toString("utf8");
}

function filesAt(chain: string, commit: string, dir: string): ChainFile[] {
  return gitText(chain, ["ls-tree", "--name-only", commit, `${dir}/`])
    .split("\n")
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({
      id: path.posix.basename(f, ".json"),
      bytes: new Uint8Array(git(chain, ["show", `${commit}:${f}`])),
    }));
}

/**
 * Every vector and every file that is no vector at `ref` of a 6529chain
 * checkout, read as bytes with `git show`, and the commit that last changed
 * them: a later commit that leaves them alone (a new decision record, say)
 * leaves the record as it is.
 */
export function readChainVectors(chain: string, ref: string): ChainVectors {
  const head = gitText(chain, ["rev-parse", `${ref}^{commit}`]).trim();
  const commit = gitText(chain, [
    "log",
    "-1",
    "--format=%H",
    head,
    "--",
    `${VECTORS_PATH}/`,
    `${NO_VECTOR_PATH}/`,
  ]).trim();
  return {
    commit,
    vectors: filesAt(chain, commit, VECTORS_PATH),
    noVectors: filesAt(chain, commit, NO_VECTOR_PATH),
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

/** A file that is no vector, and why the engine refused it, if it did. */
interface NoVectorEntry {
  readonly id: string;
  /** SHA-256 of the file's bytes: no JSON reading applies to it. */
  readonly sha256: string;
  readonly refused: boolean;
  readonly reason?: string;
}

interface ConformanceRecord {
  readonly format: "6529.explained.tdh-engine-conformance.v2";
  readonly specification: {
    readonly repository: "6529chain";
    readonly commit: string;
    readonly path: string;
    readonly noVectorPath: string;
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
    /** Files that are no vector, and how many the engine refused as such. */
    readonly noVectors: number;
    readonly noVectorsRefused: number;
  };
  readonly vectors: readonly RecordEntry[];
  readonly noVectors: readonly NoVectorEntry[];
}

export function entryOf(
  run: VectorRun,
  file: string | Uint8Array
): RecordEntry {
  return {
    id: run.id,
    digest: contentDigest(file),
    scope: run.scope,
    status: run.status,
    checks: run.checks,
    ...(run.status === "out-of-scope" && run.note ? { note: run.note } : {}),
  };
}

/**
 * A file that is no vector: refused when the engine read it or checked its
 * format, before any value was read as an input (P26 §13).
 */
export function noVectorEntryOf(file: ChainFile): NoVectorEntry {
  const run = runVector(file.id, file.bytes);
  return {
    id: file.id,
    sha256: sha256(file.bytes),
    refused: run.noVector !== undefined,
    ...(run.noVector === undefined ? {} : { reason: run.noVector }),
  };
}

function buildRecord(root: string, chain: ChainVectors): ConformanceRecord {
  const entries = chain.vectors.map((v) =>
    entryOf(runVector(v.id, v.bytes), v.bytes)
  );
  const noVectors = chain.noVectors.map(noVectorEntryOf);
  const count = (status: VectorRun["status"]) =>
    entries.filter((e) => e.status === status).length;
  return {
    format: "6529.explained.tdh-engine-conformance.v2",
    specification: {
      repository: "6529chain",
      commit: chain.commit,
      path: VECTORS_PATH,
      noVectorPath: NO_VECTOR_PATH,
    },
    engine: { sha256: engineDigest(root), files: engineFiles(root) },
    summary: {
      vectors: entries.length,
      inScope: entries.length - count("out-of-scope"),
      pass: count("pass"),
      fail: count("fail"),
      outOfScope: count("out-of-scope"),
      checks: entries.reduce((sum, e) => sum + e.checks, 0),
      noVectors: noVectors.length,
      noVectorsRefused: noVectors.filter((e) => e.refused).length,
    },
    vectors: entries,
    noVectors,
  };
}

/** Every vector passes and every file that is no vector is refused. */
function conforms(record: ConformanceRecord): boolean {
  return (
    record.summary.fail === 0 &&
    record.summary.noVectorsRefused === record.summary.noVectors
  );
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
    vectors[id] = parseJsonExact(decodeVectorText(vector.bytes));
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
    return stale.length > 0 || !conforms(record) ? 1 : 0;
  }
  for (const [file, text] of outputs) {
    writeFileSync(path.join(root, file), text, "utf8");
  }
  return conforms(record) ? 0 : 1;
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
