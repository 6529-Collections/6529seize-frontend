#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const CONTRACT = "museum-surface-registry-v1";
const VERSION = 1;
const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const SOURCE_EXTENSION_PATTERN = /\.(?:cjs|js|jsx|mjs|ts|tsx)$/u;
const REGISTRY_PATH = "ops/testing-strategy/museum-surface-registry.v1.json";
const SCHEMA_PATH =
  "ops/testing-strategy/museum-surface-registry.v1.schema.json";
const OWNED_ROOTS = Object.freeze({
  routes: "app/museum/network",
  components: "components/museum",
  e2e_specs: "tests/museum",
});

function normalizePath(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//u, "");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(root, relativePath) {
  const absolutePath = path.join(
    root,
    ...normalizePath(relativePath).split("/")
  );
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function isRegularFile(root, relativePath) {
  const absolutePath = path.join(
    root,
    ...normalizePath(relativePath).split("/")
  );
  try {
    const stat = fs.lstatSync(absolutePath);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function walkFiles(root, relativeDirectory, predicate = () => true) {
  const absoluteDirectory = path.join(
    root,
    ...normalizePath(relativeDirectory).split("/")
  );
  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }
  const files = [];
  const visit = (absolutePath, relativePath) => {
    const stat = fs.lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `museum surface registry: symbolic link is not allowed: ${relativePath}`
      );
    }
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath).sort()) {
        visit(path.join(absolutePath, entry), `${relativePath}/${entry}`);
      }
      return;
    }
    const normalized = normalizePath(relativePath);
    if (stat.isFile() && predicate(normalized)) {
      files.push(normalized);
    }
  };
  visit(absoluteDirectory, normalizePath(relativeDirectory));
  return files.sort();
}

function expectedInventory(root) {
  const routes = walkFiles(
    root,
    OWNED_ROOTS.routes,
    (file) =>
      file.endsWith("/page.tsx") || file === `${OWNED_ROOTS.routes}/page.tsx`
  );
  const supportFiles = walkFiles(
    root,
    OWNED_ROOTS.routes,
    (file) =>
      SOURCE_EXTENSION_PATTERN.test(file) &&
      !file.endsWith("/page.tsx") &&
      !file.endsWith("\\page.tsx")
  );
  const components = walkFiles(root, OWNED_ROOTS.components, (file) =>
    SOURCE_EXTENSION_PATTERN.test(file)
  );
  const e2eSpecs = walkFiles(root, OWNED_ROOTS.e2e_specs, (file) =>
    /\.(?:spec|test)\.(?:cjs|js|jsx|mjs|ts|tsx)$/u.test(file)
  );
  return { routes, supportFiles, components, e2eSpecs };
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `museum surface registry: ${label} must be a non-empty string`
    );
  }
}

function assertAllowedKeys(value, keys, label) {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(
        `museum surface registry: unknown ${label} property: ${key}`
      );
    }
  }
}

function validateSchemaContract(root) {
  const schema = readJson(root, SCHEMA_PATH);
  if (
    !isRecord(schema) ||
    schema.type !== "object" ||
    schema.properties?.contract?.const !== CONTRACT ||
    schema.properties?.version?.const !== VERSION ||
    schema.properties?.routes?.$ref !== "#/$defs/routeList" ||
    schema.$defs?.routeList?.items?.$ref !== "#/$defs/route"
  ) {
    throw new Error(
      "museum surface registry: schema does not describe the active v1 contract"
    );
  }
}

function assertOwnedEntries(
  entries,
  label,
  surfaces,
  root,
  { route = false } = {}
) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(
      `museum surface registry: ${label} must be a non-empty array`
    );
  }
  const seen = new Set();
  const surfaceIds = new Set(surfaces.map((surface) => surface.id));
  for (const entry of entries) {
    if (!isRecord(entry)) {
      throw new Error(
        `museum surface registry: ${label} contains a malformed entry`
      );
    }
    assertAllowedKeys(
      entry,
      route ? ["file", "path", "surface_ids"] : ["file", "surface_ids"],
      label
    );
    assertString(entry.file, `${label}.file`);
    const file = normalizePath(entry.file);
    if (
      file !== entry.file ||
      path.isAbsolute(file) ||
      file.split("/").includes("..")
    ) {
      throw new Error(
        `museum surface registry: unsafe ${label} path: ${entry.file}`
      );
    }
    if (seen.has(file)) {
      throw new Error(
        `museum surface registry: duplicate ${label} path: ${file}`
      );
    }
    seen.add(file);
    if (!isRegularFile(root, file)) {
      throw new Error(
        `museum surface registry: ${label} path is missing or not regular: ${file}`
      );
    }
    if (!Array.isArray(entry.surface_ids) || entry.surface_ids.length === 0) {
      throw new Error(
        `museum surface registry: ${label} requires a surface owner: ${file}`
      );
    }
    const uniqueSurfaceIds = new Set(entry.surface_ids);
    if (uniqueSurfaceIds.size !== entry.surface_ids.length) {
      throw new Error(
        `museum surface registry: duplicate surface owner: ${file}`
      );
    }
    for (const surfaceId of entry.surface_ids) {
      if (!surfaceIds.has(surfaceId)) {
        throw new Error(
          `museum surface registry: unknown surface ${surfaceId} for ${file}`
        );
      }
    }
  }
  return seen;
}

function compareInventory(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((file) => !actualSet.has(file));
  const extra = actual.filter((file) => !expectedSet.has(file));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `museum surface registry: ${label} inventory mismatch; missing=${JSON.stringify(
        missing
      )}, extra=${JSON.stringify(extra)}`
    );
  }
}

function routePathFromFile(file) {
  const normalized = normalizePath(file);
  const marker = `${OWNED_ROOTS.routes}/`;
  if (!normalized.startsWith(marker) || !normalized.endsWith("/page.tsx")) {
    throw new Error(
      `museum surface registry: not a Museum page route: ${file}`
    );
  }
  const relative = normalized.slice(marker.length, -"/page.tsx".length);
  if (relative.length === 0) {
    return "/museum/network";
  }
  return `/museum/network/${relative}`;
}

function validateRegistry(root, registry = readJson(root, REGISTRY_PATH)) {
  validateSchemaContract(root);
  if (!isRecord(registry)) {
    throw new Error("museum surface registry: registry must be an object");
  }
  if (registry.contract !== CONTRACT || registry.version !== VERSION) {
    throw new Error("museum surface registry: unsupported contract or version");
  }
  if (registry.repository !== "6529-Collections/6529seize-frontend") {
    throw new Error("museum surface registry: repository identity mismatch");
  }
  assertAllowedKeys(
    registry,
    [
      "$schema",
      "contract",
      "version",
      "repository",
      "roots",
      "surfaces",
      "routes",
      "support_files",
      "components",
      "e2e_specs",
    ],
    "registry"
  );
  if (registry.$schema !== `./${path.basename(SCHEMA_PATH)}`) {
    throw new Error("museum surface registry: schema reference mismatch");
  }
  const rootsMatch =
    isRecord(registry.roots) &&
    Object.keys(registry.roots).length === Object.keys(OWNED_ROOTS).length &&
    Object.entries(OWNED_ROOTS).every(
      ([key, value]) => registry.roots[key] === value
    );
  if (!rootsMatch) {
    throw new Error(
      "museum surface registry: owned roots do not match the contract"
    );
  }
  if (!Array.isArray(registry.surfaces) || registry.surfaces.length === 0) {
    throw new Error("museum surface registry: surfaces must be non-empty");
  }
  const surfaceIds = new Set();
  for (const surface of registry.surfaces) {
    if (!isRecord(surface)) {
      throw new Error("museum surface registry: malformed surface");
    }
    assertString(surface.id, "surface.id");
    assertString(surface.title, `surface ${surface.id}.title`);
    assertAllowedKeys(surface, ["id", "title", "kind"], "surface");
    if (!/^museum\.[a-z0-9]+(?:\.[a-z0-9-]+)*$/u.test(surface.id)) {
      throw new Error(
        `museum surface registry: invalid surface id: ${surface.id}`
      );
    }
    if (
      !["shell", "page", "research", "governance", "methodology"].includes(
        surface.kind
      )
    ) {
      throw new Error(
        `museum surface registry: invalid surface kind: ${surface.id}`
      );
    }
    if (surfaceIds.has(surface.id)) {
      throw new Error(
        `museum surface registry: duplicate surface: ${surface.id}`
      );
    }
    surfaceIds.add(surface.id);
  }

  const inventory = expectedInventory(root);
  const routeEntries = registry.routes;
  const supportEntries = registry.support_files;
  const componentEntries = registry.components;
  const specEntries = registry.e2e_specs;
  const routePaths = new Set();
  for (const entry of routeEntries ?? []) {
    if (!isRecord(entry) || typeof entry.path !== "string") {
      throw new Error("museum surface registry: every route requires a path");
    }
    const expectedPath = routePathFromFile(entry.file);
    if (entry.path !== expectedPath) {
      throw new Error(
        `museum surface registry: route path mismatch for ${entry.file}; expected ${expectedPath}`
      );
    }
    if (routePaths.has(entry.path)) {
      throw new Error(
        `museum surface registry: duplicate route path: ${entry.path}`
      );
    }
    routePaths.add(entry.path);
  }

  const routes = assertOwnedEntries(
    routeEntries,
    "route",
    registry.surfaces,
    root,
    {
      route: true,
    }
  );
  const supportFiles = assertOwnedEntries(
    supportEntries,
    "support file",
    registry.surfaces,
    root
  );
  const components = assertOwnedEntries(
    componentEntries,
    "component",
    registry.surfaces,
    root
  );
  const e2eSpecs = assertOwnedEntries(
    specEntries,
    "E2E spec",
    registry.surfaces,
    root
  );

  compareInventory("route", inventory.routes, [...routes]);
  compareInventory("support file", inventory.supportFiles, [...supportFiles]);
  compareInventory("component", inventory.components, [...components]);
  compareInventory("E2E spec", inventory.e2eSpecs, [...e2eSpecs]);

  return {
    registry,
    inventory,
    ownership: {
      routes: new Map(
        routeEntries.map((entry) => [normalizePath(entry.file), entry])
      ),
      supportFiles: new Map(
        supportEntries.map((entry) => [normalizePath(entry.file), entry])
      ),
      components: new Map(
        componentEntries.map((entry) => [normalizePath(entry.file), entry])
      ),
      e2eSpecs: new Map(
        specEntries.map((entry) => [normalizePath(entry.file), entry])
      ),
    },
  };
}

function readTsConfig(root) {
  const configPath = path.join(root, "tsconfig.json");
  const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
  if (loaded.error) {
    throw new Error(
      `museum surface registry: could not read tsconfig.json: ${loaded.error.messageText}`
    );
  }
  const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, root);
  return parsed.options;
}

function sourceFileForModule(resolvedFileName, root) {
  const absolute = path.resolve(resolvedFileName);
  const relative = normalizePath(path.relative(root, absolute));
  if (
    relative === "" ||
    relative.startsWith("../") ||
    path.isAbsolute(relative) ||
    !SOURCE_EXTENSION_PATTERN.test(relative)
  ) {
    return null;
  }
  return relative;
}

function resolveImport(root, importer, specifier, compilerOptions) {
  if (
    !specifier.startsWith(".") &&
    !specifier.startsWith("@/") &&
    !specifier.startsWith("~/")
  ) {
    return null;
  }
  const importerPath = path.join(root, ...normalizePath(importer).split("/"));
  const result = ts.resolveModuleName(
    specifier,
    importerPath,
    compilerOptions,
    ts.sys
  ).resolvedModule;
  if (!result) {
    return { unresolved: specifier };
  }
  const sourceFile = sourceFileForModule(result.resolvedFileName, root);
  return sourceFile === null ? null : { file: sourceFile };
}

function moduleSpecifiers(sourceFile) {
  const specifiers = [];
  const add = (node) => {
    if (ts.isStringLiteralLike(node)) {
      specifiers.push(node.text);
    }
  };
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      add(node.moduleSpecifier);
    }
    if (ts.isImportEqualsDeclaration(node)) {
      const reference = node.moduleReference;
      if (ts.isExternalModuleReference(reference)) {
        add(reference.expression);
      }
    }
    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...new Set(specifiers)];
}

function scriptKindForFile(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === ".tsx") return ts.ScriptKind.TSX;
  if (extension === ".jsx") return ts.ScriptKind.JSX;
  if ([".js", ".cjs", ".mjs"].includes(extension)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function parseSourceFile(importerPath, importer, source, compilerOptions) {
  const sourceFile = ts.createSourceFile(
    importerPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForFile(importer)
  );
  const programOptions = { ...compilerOptions, noLib: true, noResolve: true };
  const defaultHost = ts.createCompilerHost(programOptions);
  const normalizedImporterPath = path.resolve(importerPath);
  const host = {
    ...defaultHost,
    getSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile
    ) {
      if (path.resolve(fileName) === normalizedImporterPath) return sourceFile;
      return defaultHost.getSourceFile(
        fileName,
        languageVersion,
        onError,
        shouldCreateNewSourceFile
      );
    },
  };
  const program = ts.createProgram({
    rootNames: [importerPath],
    options: programOptions,
    host,
  });
  if (program.getSyntacticDiagnostics(sourceFile).length > 0) {
    throw new Error(
      `museum surface registry: TypeScript parse failed: ${importer}`
    );
  }
  return sourceFile;
}

function buildReverseImportGraph(
  root,
  { entryFiles = [], compilerOptions = readTsConfig(root) } = {}
) {
  const reverse = new Map();
  const forward = new Map();
  const unresolved = [];
  const visited = new Set();
  const queue = [...new Set(entryFiles.map(normalizePath))];

  while (queue.length > 0) {
    const importer = queue.shift();
    if (visited.has(importer)) {
      continue;
    }
    visited.add(importer);
    const importerPath = path.join(root, ...importer.split("/"));
    if (!isRegularFile(root, importer)) {
      throw new Error(
        `museum surface registry: import graph source is missing: ${importer}`
      );
    }
    const source = fs.readFileSync(importerPath, "utf8");
    const sourceFile = parseSourceFile(
      importerPath,
      importer,
      source,
      compilerOptions
    );
    const dependencies = new Set();
    for (const specifier of moduleSpecifiers(sourceFile)) {
      const resolved = resolveImport(
        root,
        importer,
        specifier,
        compilerOptions
      );
      if (resolved?.unresolved) {
        unresolved.push({ importer, specifier });
        continue;
      }
      if (resolved?.file) {
        dependencies.add(resolved.file);
        queue.push(resolved.file);
        const importers = reverse.get(resolved.file) ?? new Set();
        importers.add(importer);
        reverse.set(resolved.file, importers);
      }
    }
    forward.set(importer, dependencies);
  }
  return { forward, reverse, unresolved, visited: [...visited].sort() };
}

function allOwnedEntries(ownership) {
  return [
    ...ownership.routes.entries(),
    ...ownership.supportFiles.entries(),
    ...ownership.components.entries(),
    ...ownership.e2eSpecs.entries(),
  ];
}

function entrySurfaceIds(ownershipIndex, file) {
  const entry = ownershipIndex.get(file);
  return entry ? entry.surface_ids : [];
}

function isOwnedRootPath(file) {
  const normalized = normalizePath(file);
  return (
    normalized.startsWith(`${OWNED_ROOTS.routes}/`) ||
    normalized === OWNED_ROOTS.routes ||
    normalized.startsWith(`${OWNED_ROOTS.components}/`) ||
    normalized.startsWith(`${OWNED_ROOTS.e2e_specs}/`)
  );
}

function mapChangedFilesToSurfaces(
  changedFiles,
  { root, registry = readJson(root, REGISTRY_PATH), graph = null } = {}
) {
  if (!Array.isArray(changedFiles)) {
    throw new Error("museum surface registry: changedFiles must be an array");
  }
  const validated = validateRegistry(root, registry);
  const normalizedFiles = [...new Set(changedFiles.map(normalizePath))].sort();
  const ownedEntries = allOwnedEntries(validated.ownership);
  const ownershipIndex = new Map(ownedEntries);
  const entryFiles = ownedEntries.map(([file]) => file);
  const importGraph = graph ?? buildReverseImportGraph(root, { entryFiles });
  if (importGraph.unresolved.length > 0) {
    throw new Error(
      `museum surface registry: unresolved local imports: ${JSON.stringify(
        importGraph.unresolved
      )}`
    );
  }

  const directOwnedFiles = new Set(entryFiles);
  const unmapped = normalizedFiles.filter(
    (file) => isOwnedRootPath(file) && !directOwnedFiles.has(file)
  );
  if (unmapped.length > 0) {
    throw new Error(
      `museum surface registry: changed Museum-owned paths are unmapped: ${unmapped.join(", ")}`
    );
  }

  const affected = new Set();
  const escalated = new Set();
  const visited = new Set();
  const queue = [...normalizedFiles];
  while (queue.length > 0) {
    const file = queue.shift();
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);
    const directSurfaces = entrySurfaceIds(ownershipIndex, file);
    if (directSurfaces.length > 0) {
      directSurfaces.forEach((surfaceId) => affected.add(surfaceId));
    }
    const importers = importGraph.reverse.get(file) ?? new Set();
    for (const importer of importers) {
      const importerSurfaces = entrySurfaceIds(ownershipIndex, importer);
      if (importerSurfaces.length > 0) {
        importerSurfaces.forEach((surfaceId) => affected.add(surfaceId));
        escalated.add(file);
      }
      queue.push(importer);
    }
  }

  return {
    contract: CONTRACT,
    mode: "shadow",
    changed_files: normalizedFiles,
    affected_surfaces: [...affected].sort(),
    escalated_files: [...escalated].sort(),
    unmapped_files: [],
    graph: {
      entry_count: entryFiles.length,
      visited_module_count: importGraph.visited.length,
      unresolved_import_count: importGraph.unresolved.length,
    },
    report_digest: sha256(
      JSON.stringify({
        changed_files: normalizedFiles,
        affected_surfaces: [...affected].sort(),
        escalated_files: [...escalated].sort(),
      })
    ),
  };
}

function changedFilesFromGit(root, base, head) {
  if (!SHA_PATTERN.test(base) || !SHA_PATTERN.test(head)) {
    throw new Error(
      "museum surface registry: Git refs must resolve to 40-hex commits"
    );
  }
  const output = execFileSync(
    "git",
    ["diff", "--name-only", "-z", "--no-renames", base, head, "--"],
    { cwd: root, encoding: "buffer", maxBuffer: 16 * 1024 * 1024 }
  );
  return output.toString("utf8").split("\0").filter(Boolean);
}

function readOption(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? "" : (argv[index + 1] ?? "");
}

function assertArguments(argv) {
  const valueOptions = new Set(["--changed-from", "--changed-to", "--output"]);
  const flagOptions = new Set(["--", "--check"]);
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (flagOptions.has(option)) continue;
    if (!valueOptions.has(option)) {
      throw new Error(`museum surface registry: unknown option: ${option}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`museum surface registry: missing value for ${option}`);
    }
    index += 1;
  }
}

function main(argv = process.argv.slice(2)) {
  assertArguments(argv);
  const root = path.resolve(__dirname, "..");
  const registry = readJson(root, REGISTRY_PATH);
  const validated = validateRegistry(root, registry);
  const base = readOption(argv, "--changed-from");
  const head = readOption(argv, "--changed-to");
  let report = null;
  if (base || head) {
    if (!base || !head) {
      throw new Error(
        "museum surface registry: both --changed-from and --changed-to are required"
      );
    }
    const changedFiles = changedFilesFromGit(root, base, head);
    report = mapChangedFilesToSurfaces(changedFiles, { root, registry });
  }
  const output = {
    contract: CONTRACT,
    mode: "shadow",
    registry_path: REGISTRY_PATH,
    schema_path: SCHEMA_PATH,
    counts: {
      surfaces: validated.registry.surfaces.length,
      routes: validated.inventory.routes.length,
      support_files: validated.inventory.supportFiles.length,
      components: validated.inventory.components.length,
      e2e_specs: validated.inventory.e2eSpecs.length,
    },
    ...(report ? { report } : {}),
  };
  const outputPath = readOption(argv, "--output");
  if (outputPath) {
    const absoluteOutput = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
    fs.writeFileSync(absoluteOutput, `${JSON.stringify(output, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "museum surface registry: failed"
    );
    process.exitCode = 1;
  }
}

module.exports = {
  assertArguments,
  CONTRACT,
  OWNED_ROOTS,
  REGISTRY_PATH,
  buildReverseImportGraph,
  expectedInventory,
  isOwnedRootPath,
  mapChangedFilesToSurfaces,
  moduleSpecifiers,
  normalizePath,
  routePathFromFile,
  validateRegistry,
};
