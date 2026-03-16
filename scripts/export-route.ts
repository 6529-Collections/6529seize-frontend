import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile, copyFile, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const NEXT_DIR = ".next";
const DIST_ROOT = path.join("dist", "route-export");
const DEFAULT_BUILD_COMMAND = "npm run prebuild && npm run base-build";

interface AppBuildManifest {
  pages: Record<string, string[]>;
}

interface AppPathRoutesManifest {
  [compiledPath: string]: string;
}

interface BuildManifest {
  rootMainFiles?: string[];
  polyfillFiles?: string[];
  lowPriorityFiles?: string[];
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((value) => value.startsWith("--")));
  const routeArg = argv.find((value) => !value.startsWith("--"));

  if (!routeArg) {
    throw new Error(
      "Missing route argument. Usage: npm run export:route -- /the-memes/mint [--skip-build]"
    );
  }

  const normalizedRoute = normalizeRoute(routeArg);
  return {
    route: normalizedRoute,
    skipBuild: flags.has("--skip-build"),
  };
}

function normalizeRoute(route: string): string {
  if (!route.startsWith("/")) {
    return `/${route}`;
  }
  return route;
}

async function runCommand(command: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("bash", ["-lc", command], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed (${code}): ${command}`));
    });
    child.on("error", reject);
  });
}

async function startNextServer(port: number): Promise<{ close: () => Promise<void> }> {
  const child = spawn(
    "bash",
    ["-lc", `npx next start -p ${port}`],
    {
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    }
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  const origin = `http://127.0.0.1:${port}`;
  await waitForServerReady(origin);

  return {
    close: async () => {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
      await new Promise<void>((resolve) => {
        child.once("exit", () => resolve());
        setTimeout(() => resolve(), 3_000);
      });
    },
  };
}

async function waitForServerReady(origin: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${origin}/`);
      if (response.status < 500) {
        return;
      }
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for Next server at ${origin}`);
}

function choosePort(): number {
  const digest = createHash("sha1").update(process.cwd()).digest("hex");
  const seed = Number.parseInt(digest.slice(0, 4), 16);
  return 4100 + (seed % 700);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function collectManifestFilesForRoute(route: string, appManifest: AppBuildManifest): string[] {
  const candidates = new Set<string>([
    route,
    `${route}/page`,
    route.replace(/\/$/, ""),
    `${route.replace(/\/$/, "")}/page`,
  ]);

  const collected = new Set<string>();
  for (const [manifestRoute, files] of Object.entries(appManifest.pages ?? {})) {
    if (candidates.has(manifestRoute)) {
      files.forEach((file) => collected.add(file));
    }
  }

  if (collected.size === 0) {
    throw new Error(`Route ${route} was not found in app-build-manifest.json`);
  }

  return [...collected];
}

function extractAssetUrlsFromHtml(html: string): Set<string> {
  const assets = new Set<string>();
  const regex = /(?:src|href)="([^"]+)"/g;
  let match = regex.exec(html);
  while (match) {
    const value = match[1];
    if (value.startsWith("/_next/") || value.startsWith("/")) {
      assets.add(value);
    }
    match = regex.exec(html);
  }
  return assets;
}

function extractMediaRefs(content: string): Set<string> {
  const refs = new Set<string>();
  const regexes = [
    /\/_next\/static\/media\/[\w.-]+/g,
    /url\((['"]?)(\/[^)'"\s]+)\1\)/g,
  ];

  for (const regex of regexes) {
    let match = regex.exec(content);
    while (match) {
      const value = match[0].startsWith("url(") ? match[2] : match[0];
      if (value) {
        refs.add(value);
      }
      match = regex.exec(content);
    }
  }

  return refs;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyIntoExport(urlPath: string, routeDistDir: string): Promise<string | null> {
  if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
    return null;
  }

  const source = urlPath.startsWith("/_next/")
    ? path.join(NEXT_DIR, urlPath.replace("/_next/", ""))
    : path.join("public", urlPath.slice(1));

  if (!(await exists(source))) {
    return null;
  }

  const destination = urlPath.startsWith("/_next/")
    ? path.join(routeDistDir, "_assets", "_next", urlPath.replace("/_next/", ""))
    : path.join(routeDistDir, urlPath.slice(1));

  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  return destination;
}

function rewriteHtml(html: string): string {
  return html.replace(/(src|href)=(["'])(\/[^"']*)\2/g, (full, attr, quote, value) => {
    if (value.startsWith("/_next/")) {
      return `${attr}=${quote}./_assets/_next/${value.replace(/^\/_next\//, "")}${quote}`;
    }
    if (value.startsWith("//")) {
      return full;
    }
    return `${attr}=${quote}.${value}${quote}`;
  });
}

async function collectTransitiveMedia(routeDistDir: string): Promise<void> {
  const queue: string[] = [];

  async function gatherFromFile(filePath: string): Promise<void> {
    const content = await readFile(filePath, "utf8");
    const refs = extractMediaRefs(content);
    refs.forEach((ref) => queue.push(ref));
  }

  const initialFiles = ["index.html"];
  for (const rel of initialFiles) {
    await gatherFromFile(path.join(routeDistDir, rel));
  }

  const staticDir = path.join(routeDistDir, "_assets", "_next", "static");
  if (await exists(staticDir)) {
    const files = await walkFiles(staticDir);
    for (const file of files) {
      if (file.endsWith(".js") || file.endsWith(".css")) {
        await gatherFromFile(file);
      }
    }
  }

  for (const ref of queue) {
    await copyIntoExport(ref, routeDistDir);
  }
}

async function walkFiles(directory: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const out: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function exportRoute(route: string): Promise<void> {
  const appManifest = await readJsonFile<AppBuildManifest>(
    path.join(NEXT_DIR, "app-build-manifest.json")
  );
  const appRoutesManifest = await readJsonFile<AppPathRoutesManifest>(
    path.join(NEXT_DIR, "app-path-routes-manifest.json")
  );
  const buildManifest = await readJsonFile<BuildManifest>(
    path.join(NEXT_DIR, "build-manifest.json")
  );

  const declaredRoutes = new Set(Object.values(appRoutesManifest));
  if (!declaredRoutes.has(route)) {
    throw new Error(`Route ${route} was not found in app-path-routes-manifest.json`);
  }

  const routeDistDir = path.join(DIST_ROOT, route.replace(/^\//, ""));
  await rm(routeDistDir, { recursive: true, force: true });
  await mkdir(routeDistDir, { recursive: true });

  const port = choosePort();
  const server = await startNextServer(port);

  try {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    if (!response.ok) {
      throw new Error(`Route request failed with status ${response.status}`);
    }
    const html = await response.text();
    const rewrittenHtml = rewriteHtml(html);
    await writeFile(path.join(routeDistDir, "index.html"), rewrittenHtml, "utf8");

    const manifestFiles = collectManifestFilesForRoute(route, appManifest);
    const prioritizedFiles = new Set<string>([
      ...(buildManifest.rootMainFiles ?? []),
      ...(buildManifest.polyfillFiles ?? []),
      ...(buildManifest.lowPriorityFiles ?? []),
      ...manifestFiles,
    ]);

    const htmlAssets = extractAssetUrlsFromHtml(html);

    for (const file of prioritizedFiles) {
      const urlPath = file.startsWith("/") ? file : `/${file}`;
      await copyIntoExport(urlPath.startsWith("/_next/") ? urlPath : `/_next/${file}`, routeDistDir);
    }

    for (const asset of htmlAssets) {
      await copyIntoExport(asset, routeDistDir);
    }

    await collectTransitiveMedia(routeDistDir);
  } finally {
    await server.close();
  }
}

async function main() {
  const { route, skipBuild } = parseArgs(process.argv.slice(2));

  if (!skipBuild) {
    await runCommand(DEFAULT_BUILD_COMMAND);
  }

  await exportRoute(route);

  const outputPath = path.join(DIST_ROOT, route.replace(/^\//, ""));
  console.log(`✅ Exported ${route} to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
