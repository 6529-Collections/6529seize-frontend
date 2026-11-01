#!/usr/bin/env node
/**
 * Contract section 11 benchmark for the wasm build, same scenario as
 * `cargo run --release --bin bench` (src/bin/bench.rs).
 *
 *   node native/mls-wasm/bench/bench.mjs [sizes...] [--reps N] [--wasm FILE] [--glue FILE]
 *
 * Defaults: sizes 2 87 174 1024, the hashed module named in
 * lib/e2ee/wasm/manifest.ts and the glue in lib/e2ee/wasm/generated/.
 * Each size runs N times (default 3); every numeric field is the median.
 * Prints JSON on stdout and one line per size on stderr.
 */
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { gzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const sizes = args
  .filter(
    (a, i) =>
      /^\d+$/.test(a) && !["--wasm", "--glue", "--reps"].includes(args[i - 1])
  )
  .map(Number);
const reps = Math.max(1, Number(option("--reps") ?? 3));
const manifest = readFileSync(
  join(repo, "lib", "e2ee", "wasm", "manifest.ts"),
  "utf8"
);
const manifestFile = manifest.match(/file: "([^"]+)"/)[1];
const wasmPath = option("--wasm") ?? join(repo, "public", manifestFile);
const gluePath =
  option("--glue") ??
  join(repo, "lib", "e2ee", "wasm", "generated", "mls_wasm.js");

// The glue is an ES module in a CommonJS package: import a .mjs copy.
const tmp = mkdtempSync(join(tmpdir(), "mls-bench-"));
const glueCopy = join(tmp, "mls_wasm.mjs");
copyFileSync(gluePath, glueCopy);
const glue = await import(pathToFileURL(glueCopy).href);
const bytes = readFileSync(wasmPath);
await glue.default({ module_or_path: bytes });
rmSync(tmp, { recursive: true, force: true });

const DAY = 24 * 3600;
const SPLIT = 200;
const MESSAGES = 50;
const enc = new TextEncoder();
const keccakHex = (s) => createHash("sha3-256").update(s).digest("hex"); // labels only
const b64Len = (s) => (s ? Buffer.from(s, "base64").length : 0);
const now = () => performance.now();

function device(name) {
  const d = glue.MlsDevice.create();
  const h = keccakHex(name);
  d.setCredential(`6529-e2ee-v1:0x${h.slice(0, 40)}:0x${h}`);
  return d;
}
const keyPackage = (d) =>
  JSON.parse(d.createKeyPackages(1, false, 30 * DAY))[0].data;
const metadata = (g) =>
  JSON.stringify({
    v: 1,
    g,
    kind: "group",
    name: "bench",
    admins: ["p0"],
    created_by: "p0",
    history: "from_join",
  });
const entryItem = (entry) => JSON.stringify({ ...entry, type: "entry" });

function run(n, seed) {
  const g = `0x${seed.toString(16).padStart(2, "0").repeat(32)}`;
  const creator = device("creator");
  const members = Array.from({ length: n - 1 }, (_, i) => device(`m${i + 1}`));
  const kps = members.map(keyPackage);
  creator.createGroup(g, metadata(g));

  let t = now();
  const res = JSON.parse(
    creator.createCommit(g, JSON.stringify({ add_key_packages: kps }))
  );
  const addAllMs = now() - t;
  t = now();
  creator.mergePending(g);
  const mergeMs = now() - t;

  const joiner = members[0];
  let joinMs = 0;
  if (joiner) {
    t = now();
    joiner.joinWelcome(g, new Uint8Array(Buffer.from(res.welcome, "base64")));
    joiner.acceptWelcome(g);
    joinMs = now() - t;
  }

  let encMs = 0;
  let decMs = 0;
  let msgLen = 0;
  if (joiner) {
    const body = enc.encode("x".repeat(200));
    for (let i = 0; i < MESSAGES; i++) {
      t = now();
      const m = JSON.parse(creator.encryptMessage(g, body));
      encMs += now() - t;
      msgLen = b64Len(m.data);
      const item = JSON.stringify({
        type: "message",
        epoch: m.epoch,
        data: m.data,
      });
      t = now();
      const d = JSON.parse(joiner.decryptMessage(g, item));
      decMs += now() - t;
      if (!d.sig_ok) throw new Error("sig");
    }
    encMs /= MESSAGES;
    decMs /= MESSAGES;
  }

  const summary = JSON.parse(creator.groupSummary(g));
  const victim = summary.members
    .map((m) => m.device_key)
    .find(
      (k) => k !== creator.deviceKey() && (!joiner || k !== joiner.deviceKey())
    );
  let rmMs = 0;
  let rmLen = 0;
  let rmProcMs = 0;
  if (victim) {
    t = now();
    const r = JSON.parse(
      creator.createCommit(g, JSON.stringify({ remove_device_keys: [victim] }))
    );
    rmMs = now() - t;
    rmLen = r.entry.padded_len;
    t = now();
    const s = JSON.parse(joiner.processEntry(g, entryItem(r.entry)));
    if (!s.declared_ok) throw new Error("declared");
    joiner.acceptStaged(g);
    rmProcMs = now() - t;
    creator.mergePending(g);
  }

  let suMs = 0;
  let suLen = 0;
  let suProcMs = 0;
  if (joiner) {
    t = now();
    const r = JSON.parse(
      joiner.createCommit(g, JSON.stringify({ self_update: true }))
    );
    suMs = now() - t;
    suLen = r.entry.padded_len;
    t = now();
    const s = JSON.parse(creator.processEntry(g, entryItem(r.entry)));
    if (!s.declared_ok) throw new Error("declared");
    creator.acceptStaged(g);
    suProcMs = now() - t;
    joiner.mergePending(g);
  }

  const g2 = `0x${((seed + 100) % 256).toString(16).padStart(2, "0").repeat(32)}`;
  const creator2 = device("creator2");
  const members2 = Array.from({ length: n - 1 }, (_, i) => device(`s${i + 1}`));
  const kps2 = members2.map(keyPackage);
  creator2.createGroup(g2, metadata(g2));
  let splitMs = 0;
  let splitMaxEntry = 0;
  let splitMaxWelcome = 0;
  let splitCommits = 0;
  for (let i = 0; i < kps2.length; i += SPLIT) {
    t = now();
    const r = JSON.parse(
      creator2.createCommit(
        g2,
        JSON.stringify({ add_key_packages: kps2.slice(i, i + SPLIT) })
      )
    );
    creator2.mergePending(g2);
    splitMs += now() - t;
    splitCommits += 1;
    splitMaxEntry = Math.max(splitMaxEntry, r.entry.padded_len);
    splitMaxWelcome = Math.max(splitMaxWelcome, b64Len(r.welcome));
  }

  const state = creator.exportState().length;
  for (const d of [creator, creator2, ...members, ...members2]) d.free();
  return {
    leaves: n,
    add_all_commit_ms: addAllMs,
    add_all_merge_ms: mergeMs,
    add_all_entry_bytes: res.entry.padded_len,
    add_all_mls_bytes: res.mls_commit_len,
    welcome_bytes: b64Len(res.welcome),
    join_ms: joinMs,
    split_commits: splitCommits,
    split_total_ms: splitMs,
    split_max_entry_bytes: splitMaxEntry,
    split_max_welcome_bytes: splitMaxWelcome,
    remove_commit_ms: rmMs,
    remove_entry_bytes: rmLen,
    remove_process_ms: rmProcMs,
    self_update_commit_ms: suMs,
    self_update_entry_bytes: suLen,
    self_update_process_ms: suProcMs,
    message_bytes: msgLen,
    encrypt_ms: encMs,
    decrypt_ms: decMs,
    creator_state_bytes: state,
  };
}

function median(runs) {
  const out = { ...runs[0] };
  for (const key of Object.keys(out)) {
    const xs = runs.map((r) => r[key]).sort((a, b) => a - b);
    const m = xs[Math.floor(xs.length / 2)];
    out[key] = key.endsWith("_ms") ? Math.round(m * 1000) / 1000 : m;
  }
  return out;
}

const results = [];
for (const [i, n] of (sizes.length ? sizes : [2, 87, 174, 1024]).entries()) {
  const runs = Array.from({ length: reps }, (_, r) => run(n, i * 10 + r + 1));
  const m = median(runs);
  process.stderr.write(`${JSON.stringify(m)}
`);
  results.push(m);
}
const module = {
  raw_bytes: bytes.length,
  gzip_bytes: gzipSync(bytes, { level: 9 }).length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
};
process.stdout.write(
  `${JSON.stringify({ target: "wasm", node: process.version, module, results }, null, 2)}\n`
);
