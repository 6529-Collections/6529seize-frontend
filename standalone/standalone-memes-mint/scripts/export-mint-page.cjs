const {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  rmdirSync,
} = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "../../..");
const standaloneDir = path.resolve(__dirname, "..");
const appDir = path.join(standaloneDir, "src");
const appPublicDir = path.join(appDir, "public");
const appBuildDir = path.join(appDir, ".next-static-export");
const appTurboBuildDir = path.join(appDir, ".next");
const rootPublicDir = path.join(rootDir, "public");
const distRootDir = path.join(standaloneDir, "dist");
const finalOutputDir = distRootDir;

const S3_BUCKET_PROD = "thememes.6529.io";
const S3_BUCKET_TEST = "thememestest.6529.io";
const awsExecutablePath = resolveExecutablePath(
  ["/usr/bin/aws", "/opt/homebrew/bin/aws", "/usr/local/bin/aws"],
  "aws"
);

const STANDALONE_PUBLIC_FILES = [
  "6529.svg",
  "6529bgwhite.svg",
  "favicon.ico",
  "manifold.svg",
  "opensea.png",
  "rarible.svg",
];

function resolveExecutablePath(candidates, name) {
  const executablePath = candidates.find((candidate) => existsSync(candidate));
  if (!executablePath) {
    throw new Error(`Unable to locate ${name} in fixed system paths.`);
  }
  return executablePath;
}

function parseArgs(argv) {
  const useTest = argv.includes("--test");
  const doSync = argv.includes("--sync");
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`Mint standalone export

Usage:
  node standalone/standalone-memes-mint/scripts/export-mint-page.cjs [options]

Options:
  --test   Use bucket ${S3_BUCKET_TEST} (BASE_ENDPOINT https://${S3_BUCKET_TEST}) unless STANDALONE_S3_BUCKET_TEST is set
  --sync   After export: aws s3 sync dist/ -> s3://<bucket>/ --delete, then CloudFront invalidation /* (distribution id from list-distributions --query ... contains(bucket hostname))
  --help   Show this message

Default (no --test): bucket ${S3_BUCKET_PROD}, BASE_ENDPOINT https://${S3_BUCKET_PROD}

npm (pass flags after --):
  npm run export-mint-page -- --test --sync

Shorthand npm scripts (no extra --):
  npm run export-mint-page          prod, no sync
  npm run export-mint-page:sync     prod + sync
  npm run export-mint-page:test     test, no sync
  npm run export-mint-page:test:sync  test + sync

Env overrides:
  STANDALONE_S3_BUCKET_PROD   (default ${S3_BUCKET_PROD})
  STANDALONE_S3_BUCKET_TEST   (default ${S3_BUCKET_TEST})
`);
    process.exit(0);
  }
  const known = new Set(["--test", "--sync", "--help", "-h"]);
  for (const a of argv) {
    if (a.startsWith("-") && !known.has(a)) {
      console.warn(`Unknown option: ${a} (try --help)`);
    }
  }
  return { useTest, doSync };
}

function run(command, args, envOverrides = {}) {
  const result = spawnSync(resolveCommand(command), args, {
    cwd: rootDir,
    env: { ...process.env, ...envOverrides },
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    if (result.error.stack) {
      console.error(result.error.stack);
    }
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveCommand(command) {
  if (command === "aws") {
    return awsExecutablePath;
  }
  return command;
}

function resolveCloudFrontDistributionIdByAlias(hostname) {
  const query = `DistributionList.Items[?Aliases.Items[?@ == '${hostname}']].Id`;
  const proc = spawnSync(
    awsExecutablePath,
    [
      "cloudfront",
      "list-distributions",
      "--query",
      query,
      "--output",
      "text",
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );
  if (proc.error) {
    console.warn(proc.error.message);
    return null;
  }
  if (proc.status !== 0) {
    console.warn(proc.stderr?.trim() || "aws cloudfront list-distributions failed");
    return null;
  }
  const text = proc.stdout.trim();
  if (!text) {
    console.warn(
      `No CloudFront distribution matched alias "${hostname}"`
    );
    return null;
  }
  const ids = text.split(/\s+/).filter(Boolean);
  if (ids.length !== 1) {
    console.warn(
      `Expected exactly one CloudFront distribution for alias "${hostname}", found ${ids.length}`
    );
    return null;
  }
  return ids[0] ?? null;
}

function ensureDirClean(dir) {
  rmSync(dir, { recursive: true, force: true });
}

function copyStandalonePublicAssets() {
  mkdirSync(appPublicDir, { recursive: true });
  for (const name of STANDALONE_PUBLIC_FILES) {
    const from = path.join(rootPublicDir, name);
    if (!existsSync(from)) {
      throw new Error(`Missing required public asset for export: ${name}`);
    }
    const to = path.join(appPublicDir, name);
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
}

function removeEmptyDirectoriesUnder(root) {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const fullPath = path.join(root, entry.name);
    removeEmptyDirectoriesUnder(fullPath);
  }
  if (root === finalOutputDir) {
    return;
  }
  if (readdirSync(root).length === 0) {
    rmdirSync(root);
  }
}

function removeSpuriousExportRoots(dir) {
  for (const name of ["wp-content", "wp-includes"]) {
    const fullPath = path.join(dir, name);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

function removeArtifacts(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      removeArtifacts(fullPath);
      continue;
    }

    if (
      entry.name === ".DS_Store" ||
      entry.name === "index.txt" ||
      entry.name.startsWith("__next.")
    ) {
      rmSync(fullPath, { force: true });
    }
  }
}

function main() {
  const { useTest, doSync } = parseArgs(process.argv.slice(2));

  const s3Bucket = useTest
    ? process.env["STANDALONE_S3_BUCKET_TEST"]?.trim() || S3_BUCKET_TEST
    : process.env["STANDALONE_S3_BUCKET_PROD"]?.trim() || S3_BUCKET_PROD;
  const baseEndpoint = `https://${s3Bucket}`;
  const mainSiteBase =
    process.env["STANDALONE_MAIN_SITE_BASE"]?.trim() || "https://6529.io";

  ensureDirClean(appPublicDir);
  ensureDirClean(appBuildDir);
  ensureDirClean(appTurboBuildDir);
  ensureDirClean(distRootDir);

  copyStandalonePublicAssets();

  run(
    process.execPath,
    [
      path.join(rootDir, "node_modules", "next", "dist", "bin", "next"),
      "build",
      appDir,
    ],
    {
      STANDALONE_BASE_ENDPOINT: baseEndpoint,
      STANDALONE_MAIN_SITE_BASE: mainSiteBase,
    }
  );

  if (!existsSync(path.join(appBuildDir, "index.html"))) {
    throw new Error(
      `Expected static export at ${appBuildDir}/index.html, but it was not created.`
    );
  }

  mkdirSync(finalOutputDir, { recursive: true });
  cpSync(appBuildDir, finalOutputDir, { recursive: true });
  removeArtifacts(finalOutputDir);
  removeSpuriousExportRoots(finalOutputDir);
  removeEmptyDirectoriesUnder(finalOutputDir);

  if (!existsSync(path.join(finalOutputDir, "index.html"))) {
    throw new Error(
      `Expected packaged artifact at ${finalOutputDir}/index.html, but it was not created.`
    );
  }

  console.log(`Mint page export ready at ${finalOutputDir}`);
  console.log(`BASE_ENDPOINT baked in: ${baseEndpoint}`);
  console.log(`STANDALONE_MAIN_SITE_BASE baked in: ${mainSiteBase}`);

  if (doSync) {
    const distAbs = path.resolve(finalOutputDir);
    const localPrefix = distAbs.endsWith(path.sep) ? distAbs : distAbs + path.sep;
    console.log(`Syncing to s3://${s3Bucket}/ ...`);
    run("aws", [
      "s3",
      "sync",
      localPrefix,
      `s3://${s3Bucket}/`,
      "--delete",
    ]);

    const cloudFrontDistributionId =
      resolveCloudFrontDistributionIdByAlias(s3Bucket);
    if (cloudFrontDistributionId) {
      console.log(
        `Creating CloudFront invalidation /* for distribution ${cloudFrontDistributionId} ...`
      );
      run("aws", [
        "cloudfront",
        "create-invalidation",
        "--distribution-id",
        cloudFrontDistributionId,
        "--paths",
        "/*",
      ]);
    } else {
      console.warn(
        "CloudFront invalidation skipped: list-distributions --query returned no id (CNAMEs vs bucket hostname, IAM, or pagination)"
      );
    }
  }
}

main();
