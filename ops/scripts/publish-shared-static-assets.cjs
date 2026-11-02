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
// anything is written.

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
// part keeps the S3 ETag equal to the file's MD5, which the comparison needs.
const MAX_SINGLE_PUT_BYTES = 5 * 1024 * 1024 * 1024;
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u;
const KEY_SEGMENT_PATTERN = /^[A-Za-z0-9._~@+=,-]+$/u;
const MD5_ETAG_PATTERN = /^[a-f0-9]{32}$/u;

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
  const relativePaths = walkFiles(root).sort();
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
    const md5 = crypto.createHash("md5").update(bytes).digest();
    return {
      relativePath,
      absolutePath,
      key: `${prefix}/${relativePath}`,
      size: bytes.length,
      md5Hex: md5.toString("hex"),
      md5Base64: md5.toString("base64"),
      contentType,
    };
  });
  if (unknownTypes.size > 0) {
    fail(
      `no Content-Type is defined for: ${[...unknownTypes].sort().join(", ")}; add it to CONTENT_TYPES`
    );
  }
  return inventory;
}

function normalizeEtag(etag) {
  return typeof etag === "string" ? etag.replaceAll('"', "").toLowerCase() : "";
}

function sameObject(file, remote) {
  const etag = normalizeEtag(remote.etag);
  return (
    Number(remote.size) === file.size &&
    MD5_ETAG_PATTERN.test(etag) &&
    etag === file.md5Hex
  );
}

function planPublication(inventory, remoteObjects) {
  const remoteByKey = new Map();
  for (const remote of remoteObjects) {
    remoteByKey.set(remote.key, remote);
  }
  const upload = [];
  const reuse = [];
  const collisions = [];
  for (const file of inventory) {
    const remote = remoteByKey.get(file.key);
    if (!remote) {
      upload.push(file);
    } else if (sameObject(file, remote)) {
      reuse.push(file);
    } else {
      collisions.push({ file, remote });
    }
  }
  return { upload, reuse, collisions };
}

function describeCollisions(collisions) {
  const shown = collisions.slice(0, 20).map(({ file, remote }) => {
    const remoteEtag = normalizeEtag(remote.etag) || "unknown";
    return `${file.key} (local md5 ${file.md5Hex}, ${file.size} bytes; stored ETag ${remoteEtag}, ${remote.size} bytes)`;
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

async function listRemoteObjects({ bucket, prefix, runAws }) {
  const result = await runAws([
    "s3api",
    "list-objects-v2",
    "--bucket",
    bucket,
    "--prefix",
    `${prefix}/`,
    "--query",
    "Contents[].{key: Key, etag: ETag, size: Size}",
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
    "--output",
    "json",
  ]);
  if (result.code !== 0) {
    fail(`reading s3://${bucket}/${key} failed: ${result.stderr.trim()}`);
  }
  const head = parseJson(result.stdout, "head-object") ?? {};
  return { key, etag: head.ETag, size: head.ContentLength };
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
    "--content-md5",
    file.md5Base64,
    "--if-none-match",
    "*",
    "--output",
    "json",
  ]);
  if (result.code === 0) {
    const stored = parseJson(result.stdout, "put-object") ?? {};
    if (normalizeEtag(stored.ETag) !== file.md5Hex) {
      fail(`stored ETag for ${file.key} does not match its MD5`);
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

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }
  const lanes = Array.from(
    { length: Math.min(concurrency, items.length) },
    lane
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
  if (plan.collisions.length > 0) {
    fail(describeCollisions(plan.collisions));
  }

  const outcomes = await runWithConcurrency(plan.upload, concurrency, (file) =>
    uploadFile({ bucket, file, cacheControl, runAws })
  );
  const uploaded = plan.upload.filter((_, i) => outcomes[i] === "uploaded");
  const reused = [
    ...plan.reuse,
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
    uploaded_paths: uploaded.map((file) => file.relativePath).sort(),
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

if (require.main === module) {
  main();
}

module.exports = {
  CONTENT_TYPES,
  IMMUTABLE_CACHE_CONTROL,
  buildLocalInventory,
  contentTypeFor,
  planPublication,
  publishSharedStaticAssets,
};
