#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const VERSION = process.env.DELEGATION_DOCS_VERSION ?? "delegation-docs-2026-06-16";
const BUNDLE_DIR = path.join(
  REPO_ROOT,
  "public",
  "delegation-content",
  VERSION
);
const RECEIPT_DIR = path.join(REPO_ROOT, "tmp", "delegation-docs-publish");
const RECEIPT_PATH = path.join(RECEIPT_DIR, `${VERSION}-ipfs-receipt.json`);
const DEFAULT_GATEWAY_BASE_URL = "https://ipfs.6529.io/ipfs";
const CID_V1_BASE32_PATTERN = /^b[a-z2-7]{20,120}$/;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipBuild = args.has("--skip-build");
const skipGatewayVerify = args.has("--skip-gateway-verify");
const skipCdnSync = args.has("--skip-cdn-sync");

function logLine(message) {
  process.stdout.write(`${message}\n`);
}

function trimTrailingSlashes(value) {
  let end = value.length;

  while (end > 0 && value[end - 1] === "/") {
    end--;
  }

  return value.slice(0, end);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function assertCid(value, label) {
  if (typeof value !== "string" || !CID_V1_BASE32_PATTERN.test(value)) {
    throw new Error(`${label} is not a CIDv1 base32 value: ${String(value)}`);
  }

  return value;
}

function assertInsideRepo(targetPath) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(REPO_ROOT, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${targetPath} is outside the repository`);
  }

  return resolved;
}

function assertSafeUrl(value, label, { allowsInsecureLocalhost = false } = {}) {
  const url = new URL(value);
  const isLocalhost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";

  if (url.protocol === "https:") {
    return url;
  }

  if (
    allowsInsecureLocalhost &&
    url.protocol === "http:" &&
    isLocalhost &&
    process.env.DELEGATION_DOCS_ALLOW_INSECURE_LOCAL_IPFS_API === "1"
  ) {
    return url;
  }

  throw new Error(
    `${label} must use https://${
      allowsInsecureLocalhost
        ? " unless explicitly allowing localhost with DELEGATION_DOCS_ALLOW_INSECURE_LOCAL_IPFS_API=1"
        : ""
    }`
  );
}

function normalizeBundleRelativePath(filePath) {
  return path.relative(BUNDLE_DIR, filePath).replaceAll(path.sep, "/");
}

async function listFiles(rootDir) {
  const files = [];
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) =>
    normalizeBundleRelativePath(left).localeCompare(
      normalizeBundleRelativePath(right)
    )
  );
}

async function sha256File(filePath) {
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });

  return hash.digest("hex");
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function runCommand(command, commandArgs, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: REPO_ROOT,
      env: process.env,
      shell: process.platform === "win32",
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (options.capture) {
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} ${commandArgs.join(" ")} failed with exit code ${code}${
            stderr ? `\n${stderr}` : ""
          }`
        )
      );
    });
  });
}

async function buildBundle() {
  if (skipBuild) {
    return;
  }

  await runCommand("node", ["ops/scripts/build-delegation-docs-content.mjs"]);
}

function getIpfsApiEndpoint() {
  return (
    process.env.DELEGATION_DOCS_IPFS_API_ENDPOINT ??
    process.env.IPFS_API_ENDPOINT ??
    ""
  ).trim();
}

function getIpfsHeaders() {
  const headers = {};
  const authHeader = process.env.DELEGATION_DOCS_IPFS_API_AUTH_HEADER?.trim();
  const bearerToken = process.env.DELEGATION_DOCS_IPFS_API_BEARER_TOKEN?.trim();

  if (authHeader) {
    const separatorIndex = authHeader.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(
        "DELEGATION_DOCS_IPFS_API_AUTH_HEADER must be formatted as 'Header-Name: value'"
      );
    }

    headers[authHeader.slice(0, separatorIndex).trim()] = authHeader
      .slice(separatorIndex + 1)
      .trim();
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  return headers;
}

async function publishToIpfs(files) {
  const apiEndpoint = getIpfsApiEndpoint();

  if (!apiEndpoint) {
    throw new Error(
      "Set DELEGATION_DOCS_IPFS_API_ENDPOINT or IPFS_API_ENDPOINT to publish the delegation bundle"
    );
  }

  assertSafeUrl(apiEndpoint, "DELEGATION_DOCS_IPFS_API_ENDPOINT", {
    allowsInsecureLocalhost: true,
  });

  const form = new FormData();

  for (const filePath of files) {
    const bytes = await readFile(filePath);
    const relativePath = normalizeBundleRelativePath(filePath);
    form.append("file", new Blob([bytes]), relativePath);
  }

  const endpoint = new URL(`${trimTrailingSlashes(apiEndpoint)}/api/v0/add`);
  endpoint.searchParams.set("cid-version", "1");
  endpoint.searchParams.set("hash", "sha2-256");
  endpoint.searchParams.set("pin", "true");
  endpoint.searchParams.set("wrap-with-directory", "true");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: getIpfsHeaders(),
    body: form,
  });

  if (!response.ok) {
    throw new Error(
      `IPFS publish failed with ${response.status}: ${await response.text()}`
    );
  }

  const lines = (await response.text())
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const entries = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(
        `IPFS add response included non-JSON line: ${line.slice(0, 200)}`,
        { cause: error }
      );
    }
  });
  const rootEntry = entries.find((entry) => entry.Name === "") ?? entries.at(-1);
  const rootCid = assertCid(rootEntry?.Hash, "IPFS root CID");

  return { rootCid, entryCount: entries.length };
}

function getGatewayBaseUrl() {
  const gatewayBaseUrl = trimTrailingSlashes(
    (
      process.env.DELEGATION_DOCS_IPFS_GATEWAY_BASE_URL ??
      process.env.DELEGATION_DOCS_PRIMARY_GATEWAY_BASE_URL ??
      DEFAULT_GATEWAY_BASE_URL
    ).trim()
  );

  assertSafeUrl(gatewayBaseUrl, "DELEGATION_DOCS_IPFS_GATEWAY_BASE_URL");

  return gatewayBaseUrl;
}

async function fetchBytes(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function verifyPublishedFiles(fileReceipts, baseUrl) {
  const verifiedFiles = [];

  for (const fileReceipt of fileReceipts) {
    const url = `${baseUrl}/${fileReceipt.path}`;
    const bytes = await fetchBytes(url);
    const digest = sha256Bytes(bytes);

    if (digest !== fileReceipt.sha256) {
      throw new Error(
        `${url} sha256 mismatch: expected ${fileReceipt.sha256}, received ${digest}`
      );
    }

    verifiedFiles.push({
      path: fileReceipt.path,
      bytes: bytes.byteLength,
      sha256: digest,
      url,
    });
  }

  return verifiedFiles;
}

async function verifyGateway(rootCid, fileReceipts) {
  if (skipGatewayVerify) {
    return [];
  }

  return await verifyPublishedFiles(
    fileReceipts,
    `${getGatewayBaseUrl()}/${rootCid}`
  );
}

function resolveTemplate(value, rootCid) {
  return value.replaceAll("{cid}", rootCid).replaceAll("{version}", VERSION);
}

async function syncCdn(rootCid) {
  const s3UriTemplate = process.env.DELEGATION_DOCS_CDN_S3_URI?.trim();

  if (skipCdnSync || !s3UriTemplate) {
    return null;
  }

  const s3Uri = resolveTemplate(s3UriTemplate, rootCid);

  if (!s3Uri.startsWith("s3://")) {
    throw new Error("DELEGATION_DOCS_CDN_S3_URI must start with s3://");
  }

  await runCommand("aws", [
    "s3",
    "sync",
    BUNDLE_DIR,
    s3Uri,
    "--delete",
    "--cache-control",
    "public,max-age=31536000,immutable",
  ]);

  return { s3Uri };
}

async function verifyCdn(rootCid, fileReceipts) {
  const cdnBaseUrlTemplate = process.env.DELEGATION_DOCS_CDN_BASE_URL?.trim();

  if (skipCdnSync || !cdnBaseUrlTemplate) {
    return [];
  }

  const cdnBaseUrl = trimTrailingSlashes(
    resolveTemplate(cdnBaseUrlTemplate, rootCid)
  );

  assertSafeUrl(cdnBaseUrl, "DELEGATION_DOCS_CDN_BASE_URL");

  return await verifyPublishedFiles(fileReceipts, cdnBaseUrl);
}

async function readManifest() {
  const manifestPath = path.join(BUNDLE_DIR, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (!isPlainObject(manifest.articles)) {
    throw new Error(`${manifestPath} must contain an articles object`);
  }

  return manifest;
}

async function collectFileReceipts(files) {
  const receipts = [];

  for (const filePath of files) {
    const fileStat = await stat(filePath);
    receipts.push({
      path: normalizeBundleRelativePath(filePath),
      bytes: fileStat.size,
      sha256: await sha256File(filePath),
    });
  }

  return receipts;
}

async function writeReceipt(receipt) {
  await mkdir(RECEIPT_DIR, { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
}

async function main() {
  assertInsideRepo(BUNDLE_DIR);
  await buildBundle();

  const files = await listFiles(BUNDLE_DIR);
  await readManifest();
  const fileReceipts = await collectFileReceipts(files);

  if (dryRun) {
    const receipt = {
      dryRun: true,
      version: VERSION,
      bundleDir: BUNDLE_DIR,
      files: fileReceipts,
      nextStep:
        "Run without --dry-run with DELEGATION_DOCS_IPFS_API_ENDPOINT set to publish to the internal IPFS node.",
    };
    await writeReceipt(receipt);
    logLine(`dry-run receipt=${RECEIPT_PATH}`);
    logLine(`files=${files.length}`);
    return;
  }

  const published = await publishToIpfs(files);
  const gatewayVerification = await verifyGateway(
    published.rootCid,
    fileReceipts
  );
  const cdnSync = await syncCdn(published.rootCid);
  const cdnVerification = await verifyCdn(published.rootCid, fileReceipts);
  const receipt = {
    dryRun: false,
    version: VERSION,
    rootCid: published.rootCid,
    rootUri: `ipfs://${published.rootCid}`,
    gatewayBaseUrl: getGatewayBaseUrl(),
    gatewayUrl: `${getGatewayBaseUrl()}/${published.rootCid}`,
    cdnSync,
    generatedAt: new Date().toISOString(),
    bundleDir: BUNDLE_DIR,
    files: fileReceipts,
    ipfsEntryCount: published.entryCount,
    gatewayVerification,
    cdnVerification,
    manifestUpdateCommand: `DELEGATION_DOCS_IPFS_ROOT_CID=${published.rootCid} node ops/scripts/build-delegation-docs-content.mjs`,
  };

  await writeReceipt(receipt);
  logLine(`rootCid=${published.rootCid}`);
  logLine(`receipt=${RECEIPT_PATH}`);
  logLine(receipt.manifestUpdateCommand);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
