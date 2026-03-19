const { cpSync, existsSync, mkdirSync, rmSync } = require("node:fs");
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

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
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

function ensureDirClean(dir) {
  rmSync(dir, { recursive: true, force: true });
}

function removeArtifacts(dir) {
  const { readdirSync } = require("node:fs");
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

ensureDirClean(appPublicDir);
ensureDirClean(appBuildDir);
ensureDirClean(appTurboBuildDir);
ensureDirClean(distRootDir);

cpSync(rootPublicDir, appPublicDir, { recursive: true });

run(process.execPath, [
  path.join(rootDir, "node_modules", "next", "dist", "bin", "next"),
  "build",
  appDir,
]);

if (!existsSync(path.join(appBuildDir, "index.html"))) {
  throw new Error(
    `Expected static export at ${appBuildDir}/index.html, but it was not created.`
  );
}

mkdirSync(finalOutputDir, { recursive: true });
cpSync(appBuildDir, finalOutputDir, { recursive: true });
removeArtifacts(finalOutputDir);

if (!existsSync(path.join(finalOutputDir, "index.html"))) {
  throw new Error(
    `Expected packaged artifact at ${finalOutputDir}/index.html, but it was not created.`
  );
}

console.log(`Mint page export ready at ${finalOutputDir}`);
