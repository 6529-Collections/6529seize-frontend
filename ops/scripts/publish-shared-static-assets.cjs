#!/usr/bin/env node
"use strict";

// Publishes a verified build's `_next/static` files to the shared production
// asset prefix (see config/assetPrefix.ts).
//
// Every file name under `_next/static` is either content-hashed or scoped by
// the build ID, so one prefix serves every build: unchanged files keep their
// URL across deploys and stay in browser caches. Objects are written once and
// never replaced or deleted, so HTML from any earlier build still finds its
// files. A name that already exists with different bytes would break that
// promise for one of the two builds, so the whole publication fails before
// anything is written. Bytes are compared by SHA-256: every upload sends its
// checksum, S3 verifies and stores it, and existing objects are read back with
// checksum mode.

const { execFile } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");

const { parseArgs } = require("./cli-args.cjs");

const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const DEFAULT_CONCURRENCY = 16;
const MAX_CONCURRENCY = 64;
// A single PutObject accepts up to 5 GiB; static files are far smaller. One
// part keeps the stored SHA-256 a full-object checksum.
const MAX_SINGLE_PUT_BYTES = 5 * 1024 * 1024 * 1024;
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u;
const KEY_SEGMENT_PATTERN = /^[A-Za-z0-9._~@+=,-]+$/u;

// The values `aws s3 cp` (Python mimetypes) gave the same files under the
// per-commit prefixes, so cached responses keep their Content-Type. Unknown
// extensions fail closed instead of being served with a guessed type.
const CONTENT_TYPES = Object.freeze({
  ".avif": "image/avif",
  ".css": "text/css",
  ".gif": "image/gif",
  ".ico": "image/vnd.microsoft.icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".mjs": "text/javascript",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
});

function fail(message) {
  throw new Error(message);
}

// S3 keys compare by code point; locale order would vary by runner.
function compareCodePoints(a, b) {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function contentTypeFor(relativePath) {
  const extension = path.posix.extname(relativePath).toLowerCase();
  return Object.hasOwn(CONTENT_TYPES, extension)
    ? CONTENT_TYPES[extension]
    : null;
}

function validateBucket(bucket) {
  if (typeof bucket !== "string" || !BUCKET_PATTERN.test(bucket)) {
    fail(`invalid S3 bucket name: ${JSON.stringify(bucket)}`);
  }
  return bucket;
}

function validateKeyPath(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a non-empty string`);
  }
  const segments = value.split("/");
  for (const segment of segments) {
    if (
      segment === "." ||
      segment === ".." ||
      !KEY_SEGMENT_PATTERN.test(segment)
    ) {
      fail(`${label} has an unsafe path segment: ${JSON.stringify(value)}`);
    }
  }
  return value;
}

function walkFiles(root, relative = "") {
  const absolute = relative ? path.join(root, relative) : root;
  // Paths stay beneath the verified artifact root given on the command line.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    // Entries come from readdirSync beneath the same root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const metadata = fs.lstatSync(path.join(root, child));
    if (metadata.isSymbolicLink()) {
      fail(`static files must not contain symbolic links: ${child}`);
    }
    if (metadata.isDirectory()) {
      files.push(...walkFiles(root, child));
    } else if (metadata.isFile()) {
      files.push(child);
    } else {
      fail(`unsupported filesystem entry in static files: ${child}`);
    }
  }
  return files;
}

function buildLocalInventory(sourceDirectory, prefix) {
  const root = path.resolve(sourceDirectory);
  // The source is the verified artifact directory given on the command line.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const metadata = fs.lstatSync(root);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    fail("--source must be a real directory");
  }
  const relativePaths = walkFiles(root).sort(compareCodePoints);
  if (relativePaths.length === 0) {
    fail("--source contains no files");
  }
  const unknownTypes = new Set();
  const inventory = relativePaths.map((relativePath) => {
    validateKeyPath(relativePath, "static file path");
    const contentType = contentTypeFor(relativePath);
    if (!contentType) {
      unknownTypes.add(path.posix.extname(relativePath) || relativePath);
    }
    const absolutePath = path.join(root, relativePath);
    // relativePath was listed by walkFiles beneath the same root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const bytes = fs.readFileSync(absolutePath);
    if (bytes.length > MAX_SINGLE_PUT_BYTES) {
      fail(`static file is too large for a single upload: ${relativePath}`);
    }
    return {
      relativePath,
      absolutePath,
      key: `${prefix}/${relativePath}`,
      size: bytes.length,
      // The form S3 uses for x-amz-checksum-sha256 and ChecksumSHA256.
      sha256: crypto.createHash("sha256").update(bytes).digest("base64"),
      contentType,
    };
  });
  if (unknownTypes.size > 0) {
    fail(
      `no Content-Type is defined for: ${[...unknownTypes].sort(compareCodePoints).join(", ")}; add it to CONTENT_TYPES`
    );
  }
  return inventory;
}

function sameObject(file, remote) {
  return (
    Number(remote.size) === file.size &&
    typeof remote.sha256 === "string" &&
    remote.sha256 === file.sha256
  );
}

// Names the prefix lacks are uploaded. Names it holds with another size are
// collisions; the rest still need their stored checksum compared.
function planPublication(inventory, remoteObjects) {
  const remoteByKey = new Map();
  for (const remote of remoteObjects) {
    remoteByKey.set(remote.key, remote);
  }
  const upload = [];
  const verify = [];
  const collisions = [];
  for (const file of inventory) {
    const remote = remoteByKey.get(file.key);
    if (!remote) {
      upload.push(file);
    } else if (Number(remote.size) === file.size) {
      verify.push(file);
    } else {
      collisions.push({ file, remote });
    }
  }
  return { upload, verify, collisions };
}

function describeCollisions(collisions) {
  const shown = collisions.slice(0, 20).map(({ file, remote }) => {
    const stored = remote.sha256 ?? "no SHA-256 checksum";
    return `${file.key} (local sha256 ${file.sha256}, ${file.size} bytes; stored ${stored}, ${remote.size} bytes)`;
  });
  const more =
    collisions.length > shown.length
      ? `\n  ... and ${collisions.length - shown.length} more`
      : "";
  return `refusing to publish: ${collisions.length} static file name(s) already exist with different bytes. Shared names must be content-addressed; HTML from the build that first published these names would break if they were replaced.\n  ${shown.join("\n  ")}${more}`;
}

const execFileAsync = promisify(execFile);

async function defaultRunAws(args) {
  try {
    const { stdout, stderr } = await execFileAsync("aws", args, {
      // An empty pager keeps the CLI from paging output on a terminal.
      env: { ...process.env, AWS_PAGER: "" },
      maxBuffer: 1024 * 1024 * 1024,
      windowsHide: true,
    });
    return { code: 0, stdout: String(stdout), stderr: String(stderr) };
  } catch (error) {
    const exitCode = typeof error?.code === "number" ? error.code : 1;
    return {
      code: exitCode,
      stdout: String(error?.stdout ?? ""),
      stderr: String(error?.stderr ?? error?.message ?? ""),
    };
  }
}

function parseJson(text, label) {
  try {
    return text.trim() === "" ? null : JSON.parse(text);
  } catch {
    fail(`${label} returned invalid JSON`);
  }
}

// S3 returns at most 1,000 keys per ListObjectsV2 page. AWS CLI v2 follows
// every continuation token by default and prints all keys; only
// --no-paginate, --max-items, --page-size or --starting-token change that
// (https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-pagination.html).
// JSON output builds the full result before applying --query, so the query
// sees every page. Keep those flags out of this call.
async function listRemoteObjects({ bucket, prefix, runAws }) {
  const result = await runAws([
    "s3api",
    "list-objects-v2",
    "--bucket",
    bucket,
    "--prefix",
    `${prefix}/`,
    "--query",
    "Contents[].{key: Key, size: Size}",
    "--output",
    "json",
  ]);
  if (result.code !== 0) {
    fail(`listing s3://${bucket}/${prefix}/ failed: ${result.stderr.trim()}`);
  }
  const listed = parseJson(result.stdout, "list-objects-v2");
  if (listed === null) {
    return [];
  }
  if (!Array.isArray(listed)) {
    fail("list-objects-v2 did not return an object list");
  }
  return listed;
}

async function headRemoteObject({ bucket, key, runAws }) {
  const result = await runAws([
    "s3api",
    "head-object",
    "--bucket",
    bucket,
    "--key",
    key,
    "--checksum-mode",
    "ENABLED",
    "--output",
    "json",
  ]);
  if (result.code !== 0) {
    fail(`reading s3://${bucket}/${key} failed: ${result.stderr.trim()}`);
  }
  const head = parseJson(result.stdout, "head-object") ?? {};
  return { key, sha256: head.ChecksumSHA256, size: head.ContentLength };
}

async function verifyExisting({ bucket, file, runAws }) {
  const remote = await headRemoteObject({ bucket, key: file.key, runAws });
  return { file, remote, same: sameObject(file, remote) };
}

// Returns "uploaded", or "reused" when another writer stored the same bytes
// between the listing and this write.
async function uploadFile({ bucket, file, cacheControl, runAws }) {
  const result = await runAws([
    "s3api",
    "put-object",
    "--bucket",
    bucket,
    "--key",
    file.key,
    "--body",
    file.absolutePath,
    "--content-type",
    file.contentType,
    "--cache-control",
    cacheControl,
    "--checksum-algorithm",
    "SHA256",
    "--checksum-sha256",
    file.sha256,
    "--if-none-match",
    "*",
    "--output",
    "json",
  ]);
  if (result.code === 0) {
    const stored = parseJson(result.stdout, "put-object") ?? {};
    if (stored.ChecksumSHA256 !== file.sha256) {
      fail(`stored SHA-256 for ${file.key} does not match the verified file`);
    }
    return "uploaded";
  }
  if (/PreconditionFailed|\(412\)/u.test(result.stderr)) {
    const remote = await headRemoteObject({ bucket, key: file.key, runAws });
    if (sameObject(file, remote)) {
      return "reused";
    }
    fail(describeCollisions([{ file, remote }]));
  }
  fail(`uploading ${file.key} failed: ${result.stderr.trim()}`);
}

// Runs up to `concurrency` workers. After the first failure no new item
// starts; items already running finish, then the failure is thrown.
async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  let failed = false;
  async function lane() {
    if (failed || next >= items.length) {
      return;
    }
    // Claim the item synchronously: an await between reading and advancing
    // `next` would let two lanes take the same item.
    const index = next;
    next += 1;
    try {
      results[index] = await worker(items[index]);
    } catch (error) {
      failed = true;
      throw error;
    }
    await lane();
  }
  const lanes = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => lane()
  );
  await Promise.all(lanes);
  return results;
}

function sumBytes(files) {
  return files.reduce((total, file) => total + file.size, 0);
}

async function publishSharedStaticAssets({
  source,
  bucket,
  prefix,
  cacheControl = IMMUTABLE_CACHE_CONTROL,
  concurrency = DEFAULT_CONCURRENCY,
  runAws = defaultRunAws,
}) {
  validateBucket(bucket);
  validateKeyPath(prefix, "--prefix");
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > MAX_CONCURRENCY
  ) {
    fail(`--concurrency must be an integer from 1 to ${MAX_CONCURRENCY}`);
  }

  const inventory = buildLocalInventory(source, prefix);
  const remoteObjects = await listRemoteObjects({ bucket, prefix, runAws });
  const plan = planPublication(inventory, remoteObjects);
  const verified = await runWithConcurrency(plan.verify, concurrency, (file) =>
    verifyExisting({ bucket, file, runAws })
  );
  const collisions = [
    ...plan.collisions,
    ...verified.filter((check) => !check.same),
  ];
  if (collisions.length > 0) {
    fail(describeCollisions(collisions));
  }

  const outcomes = await runWithConcurrency(plan.upload, concurrency, (file) =>
    uploadFile({ bucket, file, cacheControl, runAws })
  );
  const uploaded = plan.upload.filter((_, i) => outcomes[i] === "uploaded");
  const reused = [
    ...plan.verify,
    ...plan.upload.filter((_, i) => outcomes[i] === "reused"),
  ];

  return {
    schema_version: "shared-static-publication.v1",
    bucket,
    prefix,
    cache_control: cacheControl,
    remote_objects_listed: remoteObjects.length,
    files: inventory.length,
    bytes: sumBytes(inventory),
    uploaded: { files: uploaded.length, bytes: sumBytes(uploaded) },
    reused: { files: reused.length, bytes: sumBytes(reused) },
    uploaded_paths: uploaded
      .map((file) => file.relativePath)
      .sort(compareCodePoints),
  };
}

function requiredArg(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.length === 0) {
    fail(`--${name} is required`);
  }
  return value;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const evidence = await publishSharedStaticAssets({
      source: requiredArg(args, "source"),
      bucket: requiredArg(args, "bucket"),
      prefix: requiredArg(args, "prefix"),
      concurrency:
        args.concurrency === undefined
          ? DEFAULT_CONCURRENCY
          : Number(args.concurrency),
    });
    if (typeof args.output === "string") {
      // The output path is the workflow-owned evidence file.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(args.output, `${JSON.stringify(evidence, null, 2)}\n`);
    }
    const percent = (part, whole) =>
      whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
    process.stdout.write(
      `Published ${evidence.files} static files to s3://${evidence.bucket}/${evidence.prefix}/: ` +
        `${evidence.uploaded.files} uploaded (${evidence.uploaded.bytes} bytes), ` +
        `${evidence.reused.files} already present (${evidence.reused.bytes} bytes, ` +
        `${percent(evidence.reused.bytes, evidence.bytes)}% of bytes).\n`
    );
  } catch (error) {
    console.error(
      `error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

function reportFatal(reason) {
  console.error(reason);
  process.exitCode = 1;
}

if (require.main === module) {
  main().catch(reportFatal);
}

module.exports = {
  CONTENT_TYPES,
  IMMUTABLE_CACHE_CONTROL,
  buildLocalInventory,
  contentTypeFor,
  planPublication,
  publishSharedStaticAssets,
  runWithConcurrency,
};
