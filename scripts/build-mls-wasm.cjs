#!/usr/bin/env node
/**
 * Builds the OpenMLS WebAssembly module (native/mls-wasm) for encrypted chats.
 *
 * 1. cargo build --release --lib --target wasm32-unknown-unknown, with
 *    --remap-path-prefix so no local filesystem path reaches the binary;
 * 2. wasm-bindgen --target web into lib/e2ee/wasm/generated/;
 * 3. moves the .wasm to public/e2ee/mls-wasm-<first 16 hex of sha256>.wasm
 *    (older hashed files are deleted) and writes lib/e2ee/wasm/manifest.ts.
 *
 * Requirements: the Rust toolchain pinned in native/mls-wasm/rust-toolchain.toml
 * and wasm-bindgen-cli of the exact version locked in native/mls-wasm/Cargo.lock.
 * Optional: --wasm-opt runs binaryen's wasm-opt -Oz if it is on PATH.
 *
 * Usage: 6529 run build:mls-wasm [--wasm-opt]
 */
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");

const ROOT = path.resolve(__dirname, "..");
const CRATE = path.join(ROOT, "native", "mls-wasm");
const GENERATED = path.join(ROOT, "lib", "e2ee", "wasm", "generated");
const MANIFEST = path.join(ROOT, "lib", "e2ee", "wasm", "manifest.ts");
const PUBLIC_DIR = path.join(ROOT, "public", "e2ee");
const OUT_NAME = "mls_wasm";
const PUBLIC_PREFIX = "mls-wasm-";

function fail(message) {
  console.error(`[build-mls-wasm] ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`[build-mls-wasm] ${message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: CRATE,
    stdio: "inherit",
    shell: false,
    ...options,
  });
  if (result.error) {
    fail(`${command} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, { cwd: CRATE, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    return null;
  }
  return result.stdout.trim();
}

function lockedWasmBindgenVersion() {
  const lock = fs.readFileSync(path.join(CRATE, "Cargo.lock"), "utf8");
  const match = lock.match(/name = "wasm-bindgen"\r?\nversion = "([^"]+)"/);
  if (!match) {
    fail("wasm-bindgen is not in native/mls-wasm/Cargo.lock");
  }
  return match[1];
}

function remapFlags() {
  const home = os.homedir();
  const cargoHome = process.env["CARGO_HOME"] || path.join(home, ".cargo");
  const rustupHome = process.env["RUSTUP_HOME"] || path.join(home, ".rustup");
  // rustc applies the last matching prefix, so list general before specific.
  const pairs = [
    [home, "/home"],
    [rustupHome, "/rustup"],
    [cargoHome, "/cargo"],
    [ROOT, "/repo"],
    [CRATE, "/mls-wasm"],
  ];
  const flags = [];
  for (const [from, to] of pairs) {
    flags.push(`--remap-path-prefix=${from}=${to}`);
  }
  return flags;
}

function buildWasm() {
  const extra = remapFlags();
  const existing = process.env["CARGO_ENCODED_RUSTFLAGS"];
  const encoded = [
    ...(existing ? existing.split("\u001f") : []),
    ...extra,
  ].join("\u001f");
  log("cargo build --release --lib --target wasm32-unknown-unknown");
  run(
    "cargo",
    [
      "build",
      "--release",
      "--lib",
      "--locked",
      "--target",
      "wasm32-unknown-unknown",
    ],
    {
      env: {
        ...process.env,
        CARGO_ENCODED_RUSTFLAGS: encoded,
        RUSTFLAGS: "",
      },
    }
  );
  return path.join(
    CRATE,
    "target",
    "wasm32-unknown-unknown",
    "release",
    `${OUT_NAME}.wasm`
  );
}

function runWasmBindgen(input) {
  const wanted = lockedWasmBindgenVersion();
  const version = capture("wasm-bindgen", ["--version"]);
  if (!version) {
    fail(
      `wasm-bindgen not found. Install it: cargo install wasm-bindgen-cli --version ${wanted} --locked`
    );
  }
  if (!version.endsWith(` ${wanted}`)) {
    fail(`wasm-bindgen ${wanted} required (found "${version}")`);
  }
  fs.rmSync(GENERATED, { recursive: true, force: true });
  fs.mkdirSync(GENERATED, { recursive: true });
  log(`wasm-bindgen ${wanted} --target web`);
  run("wasm-bindgen", [
    "--target",
    "web",
    "--out-dir",
    GENERATED,
    "--out-name",
    OUT_NAME,
    input,
  ]);
}

/**
 * The web-target glue defaults to `new URL("mls_wasm_bg.wasm", import.meta.url)`
 * and fetches any URL or Request it is given. The loader always passes
 * verified bytes, and a bundler following that URL would ship a second,
 * unverified copy, so both paths become errors.
 */
function patchGlue() {
  const file = path.join(GENERATED, `${OUT_NAME}.js`);
  const source = fs.readFileSync(file, "utf8");
  const needle = `module_or_path = new URL('${OUT_NAME}_bg.wasm', import.meta.url);`;
  if (!source.includes(needle)) {
    fail("unexpected wasm-bindgen glue: default wasm URL not found");
  }
  const fetchBranch = "        module_or_path = fetch(module_or_path);";
  if (!source.includes(fetchBranch)) {
    fail("unexpected wasm-bindgen glue: URL fetch branch not found");
  }
  const badInput =
    "throw new Error('E2EE_WASM:BAD_INPUT: pass the verified wasm bytes to init');";
  // A URL or Request would make the glue fetch an unverified module itself.
  const patched = source
    .replace(needle, badInput)
    .replace(fetchBranch, `        ${badInput}`);
  if (patched.includes("import.meta")) {
    fail("generated glue still references import.meta");
  }
  if (patched.includes("fetch(")) {
    fail("generated glue still fetches");
  }
  const header =
    "// Generated by scripts/build-mls-wasm.cjs from native/mls-wasm (wasm-bindgen --target web).\n" +
    "// Do not edit. The default wasm URL and URL fetching are removed: pass verified bytes to init.\n";
  fs.writeFileSync(file, header + patched.replace(/\r\n/g, "\n"));
  const dts = path.join(GENERATED, `${OUT_NAME}.d.ts`);
  fs.writeFileSync(dts, fs.readFileSync(dts, "utf8").replace(/\r\n/g, "\n"));
}

function maybeWasmOpt(file) {
  if (!process.argv.includes("--wasm-opt")) {
    return;
  }
  const version = capture("wasm-opt", ["--version"]);
  if (!version) {
    fail("--wasm-opt given but wasm-opt is not on PATH");
  }
  log(`${version} -Oz`);
  run("wasm-opt", [
    "-Oz",
    "--enable-bulk-memory",
    "--enable-nontrapping-float-to-int",
    file,
    "-o",
    file,
  ]);
}

function assertNoLocalPaths(buffers) {
  const home = os.homedir();
  const user = path.basename(home);
  const needles = [
    "Users\\",
    "C:\\",
    "/home/",
    "Users/",
    home,
    home.replace(/\\/g, "/"),
  ];
  if (user && user.length >= 4) {
    needles.push(`${path.sep}${user}${path.sep}`, `/${user}/`);
  }
  for (const [name, buffer] of buffers) {
    const text = buffer.toString("latin1");
    for (const needle of needles) {
      if (needle && text.includes(needle)) {
        fail(
          `${name} contains a local path fragment (${JSON.stringify(needle)})`
        );
      }
    }
  }
}

function publish() {
  const bgWasm = path.join(GENERATED, `${OUT_NAME}_bg.wasm`);
  maybeWasmOpt(bgWasm);
  const bytes = fs.readFileSync(bgWasm);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const fileName = `${PUBLIC_PREFIX}${sha256.slice(0, 16)}.wasm`;
  const glue = fs.readFileSync(path.join(GENERATED, `${OUT_NAME}.js`));
  assertNoLocalPaths([
    [fileName, bytes],
    [`${OUT_NAME}.js`, glue],
  ]);

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  for (const entry of fs.readdirSync(PUBLIC_DIR)) {
    if (
      entry.startsWith(PUBLIC_PREFIX) &&
      entry.endsWith(".wasm") &&
      entry !== fileName
    ) {
      fs.rmSync(path.join(PUBLIC_DIR, entry));
    }
  }
  fs.writeFileSync(path.join(PUBLIC_DIR, fileName), bytes);
  // The binary lives only in public/e2ee; drop the wasm-bindgen copies.
  fs.rmSync(bgWasm);
  fs.rmSync(path.join(GENERATED, `${OUT_NAME}_bg.wasm.d.ts`), { force: true });

  const manifest =
    "// Generated by scripts/build-mls-wasm.cjs. Do not edit.\n" +
    "// The loader fetches `file` and checks `sha256` before instantiating.\n" +
    "export const MLS_WASM_MANIFEST = {\n" +
    `  file: "/e2ee/${fileName}",\n` +
    `  sha256: "${sha256}",\n` +
    `  bytes: ${bytes.length},\n` +
    "} as const;\n";
  fs.writeFileSync(MANIFEST, manifest);

  const gzip = zlib.gzipSync(bytes, { level: 9 }).length;
  log(`public/e2ee/${fileName}`);
  log(`sha256 ${sha256}`);
  log(`size ${bytes.length} bytes raw, ${gzip} bytes gzip -9`);
}

function main() {
  if (!fs.existsSync(path.join(CRATE, "Cargo.toml"))) {
    fail("native/mls-wasm/Cargo.toml not found");
  }
  const input = buildWasm();
  runWasmBindgen(input);
  patchGlue();
  publish();
}

main();
